const express = require('express');
const router = express.Router();
const axios = require('axios');
const logger = require('../utils/logger');
const NodeCache = require('node-cache');

// Initialize cache (15 minutes)
const cache = new NodeCache({ stdTTL: 900 });

/**
 * POST /api/gateway/proxy
 * Global API proxy endpoint - route requests to any API worldwide
 */
router.post('/proxy', async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, data, cacheKey } = req.body;

    // Validation
    if (!url) {
      return res.status(400).json({
        status: 'error',
        message: 'URL is required',
        code: 'INVALID_INPUT'
      });
    }

    // Check cache if cacheKey provided
    if (cacheKey) {
      const cachedResponse = cache.get(cacheKey);
      if (cachedResponse) {
        logger.info(`Cache hit for key: ${cacheKey}`);
        return res.status(200).json({
          status: 'success',
          data: cachedResponse,
          cached: true,
          message: 'Response from cache'
        });
      }
    }

    // Add Master Key to headers
    const requestHeaders = {
      'User-Agent': '3web-api-gateway/1.0',
      ...headers
    };

    logger.info(`Proxying ${method} request to: ${url}`);

    // Make request
    const response = await axios({
      method: method.toUpperCase(),
      url,
      headers: requestHeaders,
      data: method !== 'GET' ? data : undefined,
      timeout: 30000
    });

    // Cache response if cacheKey provided
    if (cacheKey) {
      cache.set(cacheKey, response.data);
    }

    res.status(response.status).json({
      status: 'success',
      data: response.data,
      statusCode: response.status,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Gateway proxy error: ${error.message}`);
    
    const statusCode = error.response?.status || 500;
    const errorData = error.response?.data || { message: error.message };

    res.status(statusCode).json({
      status: 'error',
      message: 'Proxy request failed',
      code: 'PROXY_ERROR',
      error: errorData
    });
  }
});

/**
 * GET /api/gateway/endpoints
 * List all supported API endpoints
 */
router.get('/endpoints', (req, res) => {
  const endpoints = [
    {
      name: 'Ethereum RPC',
      url: process.env.WEB3_PROVIDER_URL,
      methods: ['POST'],
      description: 'Ethereum blockchain RPC endpoint'
    },
    {
      name: 'Polygon RPC',
      url: process.env.POLYGON_RPC_URL,
      methods: ['POST'],
      description: 'Polygon blockchain RPC endpoint'
    },
    {
      name: 'Arbitrum RPC',
      url: process.env.ARBITRUM_RPC_URL,
      methods: ['POST'],
      description: 'Arbitrum blockchain RPC endpoint'
    },
    {
      name: 'Optimism RPC',
      url: process.env.OPTIMISM_RPC_URL,
      methods: ['POST'],
      description: 'Optimism blockchain RPC endpoint'
    }
  ];

  res.status(200).json({
    status: 'success',
    data: endpoints,
    total: endpoints.length,
    message: 'Supported API endpoints'
  });
});

/**
 * GET /api/gateway/health
 * Check health of all connected APIs
 */
router.get('/health', async (req, res) => {
  try {
    const healthChecks = [];

    const apis = [
      { name: 'Ethereum', url: process.env.WEB3_PROVIDER_URL },
      { name: 'Polygon', url: process.env.POLYGON_RPC_URL },
      { name: 'Arbitrum', url: process.env.ARBITRUM_RPC_URL },
      { name: 'Optimism', url: process.env.OPTIMISM_RPC_URL }
    ];

    // Check each API
    for (const api of apis) {
      try {
        const startTime = Date.now();
        await axios.post(api.url, {
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1
        }, { timeout: 5000 });
        
        const responseTime = Date.now() - startTime;
        
        healthChecks.push({
          name: api.name,
          status: 'healthy',
          responseTime: `${responseTime}ms`,
          lastChecked: new Date().toISOString()
        });
      } catch (error) {
        healthChecks.push({
          name: api.name,
          status: 'unhealthy',
          error: error.message,
          lastChecked: new Date().toISOString()
        });
      }
    }

    res.status(200).json({
      status: 'success',
      data: healthChecks,
      message: 'API health check completed'
    });
  } catch (error) {
    logger.error(`Health check error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      code: 'HEALTH_CHECK_ERROR'
    });
  }
});

/**
 * POST /api/gateway/batch
 * Batch multiple API requests
 */
router.post('/batch', async (req, res) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests)) {
      return res.status(400).json({
        status: 'error',
        message: 'Requests must be an array',
        code: 'INVALID_INPUT'
      });
    }

    logger.info(`Processing batch of ${requests.length} requests`);

    // Process all requests in parallel
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          const response = await axios({
            method: request.method || 'GET',
            url: request.url,
            headers: request.headers || {},
            data: request.data,
            timeout: 10000
          });
          return {
            id: request.id,
            status: 'success',
            data: response.data,
            statusCode: response.status
          };
        } catch (error) {
          return {
            id: request.id,
            status: 'error',
            error: error.message,
            statusCode: error.response?.status || 500
          };
        }
      })
    );

    res.status(200).json({
      status: 'success',
      data: results.map(r => r.value || r.reason),
      total: requests.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      message: 'Batch requests processed'
    });
  } catch (error) {
    logger.error(`Batch request error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Batch processing failed',
      code: 'BATCH_ERROR'
    });
  }
});

module.exports = router;
