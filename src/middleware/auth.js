const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Validate Master Key from request headers
 */
const validateMasterKey = (req, res, next) => {
  try {
    const masterKey = req.headers['x-master-key'] || req.headers['authorization']?.split(' ')[1];
    
    if (!masterKey) {
      return res.status(401).json({
        status: 'error',
        message: 'Master Key is required',
        code: 'MISSING_MASTER_KEY'
      });
    }

    // Verify Master Key using JWT
    try {
      const decoded = jwt.verify(masterKey, process.env.MASTER_KEY_SECRET);
      req.masterKey = decoded;
      req.userId = decoded.userId;
      req.apiKey = decoded.apiKey;
      next();
    } catch (error) {
      logger.warn(`Invalid Master Key attempt: ${error.message}`);
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired Master Key',
        code: 'INVALID_MASTER_KEY'
      });
    }
  } catch (error) {
    logger.error(`Auth middleware error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication error',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Generate Master Key Token
 */
const generateMasterKey = (userId, apiKey) => {
  try {
    const token = jwt.sign(
      {
        userId,
        apiKey,
        type: 'master_key',
        iat: Date.now()
      },
      process.env.MASTER_KEY_SECRET,
      {
        algorithm: process.env.MASTER_KEY_ALGORITHM || 'HS256',
        expiresIn: process.env.TOKEN_EXPIRY || '24h'
      }
    );
    return token;
  } catch (error) {
    logger.error(`Error generating master key: ${error.message}`);
    throw error;
  }
};

/**
 * Validate JWT Token
 */
const validateToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Token is required',
        code: 'MISSING_TOKEN'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn(`Invalid token: ${error.message}`);
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
};

module.exports = {
  validateMasterKey,
  generateMasterKey,
  validateToken
};
