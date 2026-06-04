require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes and middleware
const apiGatewayRoutes = require('./routes/api-gateway');
const authRoutes = require('./routes/auth');
const web3Routes = require('./routes/web3');
const servicesRoutes = require('./routes/services');

// Import middleware
const { requestLogger, errorHandler } = require('./middleware/index');
const { validateMasterKey } = require('./middleware/auth');

// Initialize Express app
const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// Security Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Master-Key']
}));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Request Logger
app.use(requestLogger);

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/gateway', validateMasterKey, apiGatewayRoutes);
app.use('/api/web3', validateMasterKey, web3Routes);
app.use('/api/services', validateMasterKey, servicesRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    path: req.path,
    method: req.method
  });
});

// Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, process.env.API_GATEWAY_HOST || '0.0.0.0', () => {
  console.log(`
╔══════════════════════════════════════════╗
║     🌐 3Web SaaS Platform Started        ║
║     API Gateway running on port ${PORT}       ║
║     Environment: ${process.env.NODE_ENV || 'development'}           ║
╚══════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

module.exports = app;
