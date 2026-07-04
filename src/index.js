/**
 * Updated index.js with all routes
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const mongoose = require('mongoose');
const redis = require('redis');
const fs = require('fs');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const gatewayRoutes = require('./routes/gateway');
const web3Routes = require('./routes/web3');
const tronRoutes = require('./routes/tron');
const servicesRoutes = require('./routes/services');
const assetsRoutes = require('./routes/assets');
const contractsRoutes = require('./routes/contracts');
const privateKeysRoutes = require('./routes/privateKeys');
const contractLinksRoutes = require('./routes/contractLinks');
const settingsRoutes = require('./routes/settings');
const manualConfigRoutes = require('./routes/manualConfig');
const dataMigrationRoutes = require('./routes/dataMigration');

// Import middleware
const { authenticateMasterKey } = require('./middleware/auth');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// Initialize Express app
const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;
const HOST = process.env.API_GATEWAY_HOST || '0.0.0.0';

// Create logs and backups directories
const logsDir = path.join(__dirname, '../logs');
const backupsDir = path.join(__dirname, '../backups');

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Winston Logger Configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use(requestLogger(logger));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API Info
app.get('/api', (req, res) => {
  res.json({
    name: '3Web - Web3 SaaS Platform',
    version: '1.0.0',
    description: 'Global API Gateway with Multi-Chain Support & Data Migration',
    supportedNetworks: ['Ethereum', 'Polygon', 'Arbitrum', 'Optimism', 'TRON', 'Binance'],
    features: [
      'Master Key Authentication',
      'AES-256-GCM Encryption',
      'ECDSA Signing',
      'Multi-Sig Support',
      'Smart Contract Management',
      'Asset Management',
      'Private Key Management',
      'Contract Linking',
      'Data Migration',
      'Multi-Database Support',
      'API Key Management',
      'Binance Integration'
    ],
    supportedDatabases: ['MongoDB', 'PostgreSQL', 'MySQL', 'Firebase'],
    supportedFileFormats: ['CSV', 'JSON', 'Excel (XLSX)']
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/web3', web3Routes);
app.use('/api/tron', authenticateMasterKey, tronRoutes);
app.use('/api/services', authenticateMasterKey, servicesRoutes);
app.use('/api/assets', authenticateMasterKey, assetsRoutes);
app.use('/api/contracts', authenticateMasterKey, contractsRoutes);
app.use('/api/private-keys', authenticateMasterKey, privateKeysRoutes);
app.use('/api/contract-links', authenticateMasterKey, contractLinksRoutes);
app.use('/api/settings', authenticateMasterKey, settingsRoutes);
app.use('/api/config', authenticateMasterKey, manualConfigRoutes);
app.use('/api/migration', authenticateMasterKey, dataMigrationRoutes);

// 404 Handler
app.use(notFoundHandler);

// Error Handler
app.use(errorHandler(logger));

// Start Server
app.listen(PORT, HOST, () => {
  logger.info(`🚀 3Web API Gateway running on http://${HOST}:${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔐 Security: Master Key + AES-256-GCM + ECDSA + API Keys`);
  logger.info(`🌐 Networks: Ethereum, Polygon, Arbitrum, Optimism, TRON, Binance`);
  logger.info(`📊 Databases: MongoDB, PostgreSQL, MySQL, Firebase`);
  logger.info(`📄 Migration: CSV, JSON, Excel Upload & Sync`);
  logger.info('━'.repeat(70));
});

module.exports = app;
