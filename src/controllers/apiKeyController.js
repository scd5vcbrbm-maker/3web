/**
 * API Key Management Controller
 */

const APIKey = require('../models/APIKey');
const securityManager = require('../utils/securityManager');
const crypto = require('crypto');

// Generate new API key
exports.generateAPIKey = async (req, res) => {
  try {
    const { userId } = req.user;
    const { keyName, keyType = 'SERVER', permissions, serverInfo } = req.body;

    if (!keyName) {
      return res.status(400).json({
        success: false,
        error: 'keyName is required'
      });
    }

    // Generate unique key value and secret
    const keyValue = 'sk_' + crypto.randomBytes(32).toString('hex');
    const keySecret = crypto.randomBytes(32).toString('hex');

    // Encrypt key
    const encrypted = securityManager.encryptAES256(
      keySecret,
      process.env.MASTER_KEY_SECRET
    );

    const apiKey = new APIKey({
      userId,
      keyName,
      keyType,
      keyValue,
      keySecret: encrypted,
      permissions: permissions || {
        canRead: true,
        canWrite: false,
        canDelete: false,
        canMint: false,
        canBurn: false,
        canTransfer: false
      },
      serverName: serverInfo?.serverName,
      serverIP: serverInfo?.serverIP,
      serverLocation: serverInfo?.serverLocation,
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
        requestsPerDay: 86400
      },
      usageStats: {
        totalRequests: 0,
        createdRequests: 0,
        failedRequests: 0
      },
      rotationSchedule: {
        autoRotate: true,
        rotationInterval: 90 // days
      },
      auditLog: [{
        action: 'API_KEY_CREATED',
        timestamp: new Date(),
        details: `Created API key: ${keyName}`,
        ipAddress: req.ip
      }]
    });

    await apiKey.save();

    res.status(201).json({
      success: true,
      message: 'API key generated successfully',
      data: {
        keyId: apiKey._id,
        keyName,
        keyValue,
        keySecret: keySecret, // Only shown once!
        warning: 'Save this key secretly. You will not be able to see it again!',
        permissions: apiKey.permissions,
        createdAt: apiKey.createdAt,
        expiresAt: apiKey.expiresAt
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all API keys (without secrets)
exports.getAllAPIKeys = async (req, res) => {
  try {
    const { userId } = req.user;
    const keys = await APIKey.find({ userId }, { keySecret: 0 }).sort({ createdAt: -1 });

    res.json({
      success: true,
      keys,
      count: keys.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Rotate API key
exports.rotateAPIKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;

    const apiKey = await APIKey.findOne({ _id: keyId, userId });
    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    // Generate new key
    const newKeyValue = 'sk_' + crypto.randomBytes(32).toString('hex');
    const newKeySecret = crypto.randomBytes(32).toString('hex');

    const encrypted = securityManager.encryptAES256(
      newKeySecret,
      process.env.MASTER_KEY_SECRET
    );

    apiKey.keyValue = newKeyValue;
    apiKey.keySecret = encrypted;
    apiKey.rotationSchedule.lastRotated = new Date();
    apiKey.rotationSchedule.nextRotation = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    apiKey.auditLog.push({
      action: 'API_KEY_ROTATED',
      timestamp: new Date(),
      details: 'API key rotated',
      ipAddress: req.ip
    });

    await apiKey.save();

    res.json({
      success: true,
      message: 'API key rotated successfully',
      data: {
        keyId,
        newKeyValue,
        newKeySecret,
        warning: 'Update your applications with the new key!',
        rotatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Disable API key
exports.disableAPIKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;

    const apiKey = await APIKey.findOneAndUpdate(
      { _id: keyId, userId },
      {
        active: false,
        $push: {
          auditLog: {
            action: 'API_KEY_DISABLED',
            timestamp: new Date(),
            details: 'API key disabled',
            ipAddress: req.ip
          }
        }
      },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        error: 'API key not found'
      });
    }

    res.json({
      success: true,
      message: 'API key disabled',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
