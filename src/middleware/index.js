const logger = require('../utils/logger');

/**
 * Request Logger Middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - Status: ${res.statusCode} - Duration: ${duration}ms`);
  });
  
  next();
};

/**
 * Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, err);
  
  // Default error response
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    status: 'error',
    message,
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  requestLogger,
  errorHandler
};
