/**
 * 3Web - Web3 SaaS Platform with Global API Gateway
 * Main Entry Point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const mongoose = require('mongoose');
const redis = require('redis');

// Import routes
const authRoutes = require('./routes/auth');
const gatewayRoutes = require('./routes/gateway');
const web3Routes = require('./routes/web3');
const tronRoutes = require('./routes/tron');
const servicesRoutes = require('./routes/services');

// Import middleware
const { authenticateMasterKey } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Initialize Express app
const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;
const HOST = process.env.API_GATEWAY_HOST || '0.0.0.0';

// Winston Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Redis Client
let redisClient;
(async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    await redisClient.connect();
    logger.info('✅ Redis connected successfully');
  } catch (err) {
    logger.error('❌ Redis connection failed:', err);
  }
})();

// MongoDB Connection
mongoose.connect(process.env.DATABASE_URL || 'mongodb://admin:password@localhost:27017/3web_saas', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => logger.info('✅ MongoDB connected successfully'))
  .catch(err => logger.error('❌ MongoDB connection failed:', err));

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: JSON.parse(process.env.CORS_CREDENTIALS || 'true')
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request Logger
app.use(requestLogger(logger));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/web3', web3Routes);
app.use('/api/tron', authenticateMasterKey, tronRoutes);
app.use('/api/services', authenticateMasterKey, servicesRoutes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler(logger));

// Start Server
app.listen(PORT, HOST, () => {
  logger.info(`🚀 3Web API Gateway running on http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔐 Master Key Authentication: Enabled`);
  logger.info(`🌐 Supported Networks: Ethereum, Polygon, Arbitrum, Optimism, TRON`);
});

module.exports = app;
