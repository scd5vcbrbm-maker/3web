/**
 * Request Logger Middleware
 */

const requestLogger = (logger) => {
  return (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    });

    next();
  };
};

module.exports = {
  requestLogger
};
