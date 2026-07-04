/**
 * Settings Routes
 * User settings and configuration
 */

const express = require('express');
const router = express.Router();
const { authenticateMasterKey } = require('../middleware/auth');
const securityManager = require('../utils/securityManager');

router.use(authenticateMasterKey);

// GET /api/settings - Get user settings
router.get('/', (req, res) => {
  res.json({
    success: true,
    settings: {
      encryption: {
        algorithm: 'AES-256-GCM',
        keyStrength: 256,
        keyDerivation: 'PBKDF2',
        iterations: 100000
      },
      security: {
        mfaEnabled: false,
        sessionTimeout: 30,
        maxSessions: 5,
        requiresApprovalForHighRisk: true
      },
      notifications: {
        emailAlerts: true,
        transactionNotifications: true,
        securityAlerts: true
      }
    },
    timestamp: new Date().toISOString()
  });
});

// POST /api/settings/generate-master-key
router.post('/generate-master-key', (req, res) => {
  try {
    const masterKey = securityManager.generateMasterKey();

    res.json({
      success: true,
      masterKey,
      message: 'Master key generated. Store this safely!',
      warning: 'Never share this key with anyone',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/settings/generate-ecdsa-keys
router.post('/generate-ecdsa-keys', (req, res) => {
  try {
    const keyPair = securityManager.generateECDSAKeyPair();

    res.json({
      success: true,
      publicKey: keyPair.publicKey,
      message: 'ECDSA key pair generated',
      warning: 'Keep the private key secure',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// PUT /api/settings/update-security
router.put('/update-security', (req, res) => {
  try {
    const { mfaEnabled, sessionTimeout, maxSessions } = req.body;

    res.json({
      success: true,
      message: 'Security settings updated',
      settings: {
        mfaEnabled: mfaEnabled || false,
        sessionTimeout: sessionTimeout || 30,
        maxSessions: maxSessions || 5
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
