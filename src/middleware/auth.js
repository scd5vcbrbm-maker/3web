/**
 * Master Key Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const logger = require('winston');

const authenticateMasterKey = (req, res, next) => {
  try {
    const masterKey = req.headers['x-master-key'];
    
    if (!masterKey) {
      return res.status(401).json({
        success: false,
        error: 'Missing X-Master-Key header'
      });
    }

    // Verify master key
    const decoded = jwt.verify(masterKey, process.env.MASTER_KEY_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired Master Key',
      details: err.message
    });
  }
};

const validateJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Missing JWT token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired JWT token'
    });
  }
};

module.exports = {
  authenticateMasterKey,
  validateJWT
};
