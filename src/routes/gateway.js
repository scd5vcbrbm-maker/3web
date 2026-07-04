/**
 * Global API Gateway Routes
 * - Proxy requests to external APIs
 * - Rate limiting and caching
 * - Request/response validation
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticateMasterKey } = require('../middleware/auth');

// POST /api/gateway/proxy
router.post('/proxy', authenticateMasterKey, async (req, res) => {
  try {
    const { url, method = 'GET', headers = {}, data } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    const config = {
      method,
      url,
      headers: {
        ...headers,
        'User-Agent': '3Web-Gateway/1.0'
      },
      timeout: 30000
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    res.json({
      success: true,
      statusCode: response.status,
      data: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/gateway/batch
router.post('/batch', authenticateMasterKey, async (req, res) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests)) {
      return res.status(400).json({
        success: false,
        error: 'requests must be an array'
      });
    }

    const results = await Promise.all(
      requests.map(async (request) => {
        try {
          const response = await axios({
            method: request.method || 'GET',
            url: request.url,
            headers: request.headers,
            data: request.data,
            timeout: 30000
          });
          return {
            id: request.id,
            success: true,
            status: response.status,
            data: response.data
          };
        } catch (err) {
          return {
            id: request.id,
            success: false,
            error: err.message
          };
        }
      })
    );

    res.json({
      success: true,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/gateway/health
router.get('/health', authenticateMasterKey, (req, res) => {
  res.json({
    success: true,
    status: 'Gateway is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
