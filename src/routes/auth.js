const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const { generateMasterKey } = require('../middleware/auth');

/**
 * POST /api/auth/register
 * Register new user and generate Master Key
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and name are required',
        code: 'INVALID_INPUT'
      });
    }

    // Generate user ID and API Key
    const userId = uuidv4();
    const apiKey = uuidv4();

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate Master Key
    const masterKey = generateMasterKey(userId, apiKey);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      status: 'success',
      data: {
        userId,
        email,
        name,
        apiKey,
        masterKey,
        expiresIn: process.env.TOKEN_EXPIRY || '24h'
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Registration failed',
      code: 'REGISTRATION_ERROR'
    });
  }
});

/**
 * POST /api/auth/login
 * Login user and return Master Key
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
        code: 'INVALID_INPUT'
      });
    }

    // TODO: Verify email and password against database
    // For now, generate a sample master key
    const userId = uuidv4();
    const apiKey = uuidv4();
    const masterKey = generateMasterKey(userId, apiKey);

    logger.info(`User login: ${email}`);

    res.status(200).json({
      status: 'success',
      data: {
        userId,
        email,
        masterKey,
        apiKey,
        expiresIn: process.env.TOKEN_EXPIRY || '24h'
      },
      message: 'Login successful'
    });
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Login failed',
      code: 'LOGIN_ERROR'
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh Master Key
 */
router.post('/refresh', (req, res) => {
  try {
    const { masterKey } = req.body;

    if (!masterKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Master Key is required',
        code: 'INVALID_INPUT'
      });
    }

    // Verify old master key
    const decoded = jwt.verify(masterKey, process.env.MASTER_KEY_SECRET, { ignoreExpiration: true });
    
    // Generate new master key
    const newMasterKey = generateMasterKey(decoded.userId, decoded.apiKey);

    logger.info(`Master Key refreshed for user: ${decoded.userId}`);

    res.status(200).json({
      status: 'success',
      data: {
        masterKey: newMasterKey,
        expiresIn: process.env.TOKEN_EXPIRY || '24h'
      },
      message: 'Master Key refreshed successfully'
    });
  } catch (error) {
    logger.error(`Token refresh error: ${error.message}`);
    res.status(401).json({
      status: 'error',
      message: 'Invalid Master Key',
      code: 'INVALID_MASTER_KEY'
    });
  }
});

/**
 * POST /api/auth/validate
 * Validate Master Key
 */
router.post('/validate', (req, res) => {
  try {
    const { masterKey } = req.body;

    if (!masterKey) {
      return res.status(400).json({
        status: 'error',
        message: 'Master Key is required',
        code: 'INVALID_INPUT'
      });
    }

    const decoded = jwt.verify(masterKey, process.env.MASTER_KEY_SECRET);

    res.status(200).json({
      status: 'success',
      data: {
        valid: true,
        userId: decoded.userId,
        apiKey: decoded.apiKey,
        expiresAt: new Date(decoded.exp * 1000).toISOString()
      },
      message: 'Master Key is valid'
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Invalid or expired Master Key',
      code: 'INVALID_MASTER_KEY'
    });
  }
});

module.exports = router;
