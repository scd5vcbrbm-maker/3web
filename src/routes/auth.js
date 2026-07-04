/**
 * Authentication Routes
 * - Master Key generation and validation
 * - JWT token management
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required()
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message
      });
    }

    const { email, password, name } = value;
    const hashedPassword = await bcrypt.hash(password, 10);

    // TODO: Save user to database
    const masterKey = jwt.sign(
      {
        userId: uuidv4(),
        email,
        name,
        createdAt: new Date()
      },
      process.env.MASTER_KEY_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      masterKey,
      expiresIn: process.env.TOKEN_EXPIRY || '24h'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // TODO: Retrieve user from database
    const masterKey = jwt.sign(
      {
        userId: uuidv4(),
        email,
        loginTime: new Date()
      },
      process.env.MASTER_KEY_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      masterKey,
      expiresIn: process.env.TOKEN_EXPIRY || '24h'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', (req, res) => {
  try {
    const { masterKey } = req.body;

    if (!masterKey) {
      return res.status(400).json({
        success: false,
        error: 'Master key is required'
      });
    }

    const decoded = jwt.verify(masterKey, process.env.MASTER_KEY_SECRET, {
      ignoreExpiration: true
    });

    const newMasterKey = jwt.sign(
      decoded,
      process.env.MASTER_KEY_SECRET,
      { expiresIn: process.env.TOKEN_EXPIRY || '24h' }
    );

    res.json({
      success: true,
      masterKey: newMasterKey,
      expiresIn: process.env.TOKEN_EXPIRY || '24h'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/auth/validate
router.post('/validate', (req, res) => {
  try {
    const masterKey = req.headers['x-master-key'];

    if (!masterKey) {
      return res.status(401).json({
        success: false,
        valid: false,
        error: 'Master key is required'
      });
    }

    jwt.verify(masterKey, process.env.MASTER_KEY_SECRET);

    res.json({
      success: true,
      valid: true,
      message: 'Master key is valid'
    });
  } catch (err) {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid or expired master key'
    });
  }
});

module.exports = router;
