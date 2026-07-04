/**
 * Private Key Controller
 * Handles encryption, storage, and management of private keys
 */

const PrivateKey = require('../models/PrivateKey');
const MasterKey = require('../models/MasterKey');
const securityManager = require('../utils/securityManager');
const ethers = require('ethers');
const TronWeb = require('tronweb');

// Add new private key
exports.addPrivateKey = async (req, res) => {
  try {
    const { userId } = req.user;
    const { label, privateKey, network, keyType, permissions } = req.body;

    if (!label || !privateKey || !network) {
      return res.status(400).json({
        success: false,
        error: 'label, privateKey, and network are required'
      });
    }

    // Get or create master key
    let masterKey = await MasterKey.findOne({ userId });
    if (!masterKey) {
      return res.status(400).json({
        success: false,
        error: 'Master key not configured. Please set up master key first.'
      });
    }

    // Derive encryption key from master key
    const salt = Buffer.from(masterKey.salt, 'hex');
    const encryptionKey = securityManager.deriveKey(
      process.env.MASTER_KEY_SECRET,
      salt
    );

    // Encrypt private key
    const encrypted = securityManager.encryptAES256(
      privateKey,
      encryptionKey.key.toString('hex')
    );

    // Get public address based on network
    let publicAddress;
    if (network === 'tron') {
      const tronWeb = new TronWeb({
        fullHost: 'https://api.tronstack.com',
        privateKey
      });
      publicAddress = tronWeb.defaultAddress.base58;
    } else {
      const wallet = new ethers.Wallet(privateKey);
      publicAddress = wallet.address;
    }

    // Create signature for verification
    const signatureData = `${publicAddress}${Date.now()}`;
    const signature = securityManager.signWithECDSA(
      signatureData,
      process.env.MASTER_PRIVATE_KEY || privateKey
    );

    // Save encrypted key
    const storedKey = new PrivateKey({
      userId,
      label,
      keyType,
      network,
      publicAddress,
      encryptedPrivateKey: encrypted,
      masterKeyHash: masterKey.masterKeyHash,
      keyDerivationSalt: masterKey.salt,
      signature,
      permissions: permissions || {
        canSign: true,
        canTransfer: true,
        canDeploy: false,
        canMint: false,
        canBurn: false
      },
      auditLog: [{
        action: 'KEY_CREATED',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS'
      }]
    });

    await storedKey.save();

    res.status(201).json({
      success: true,
      message: 'Private key added successfully',
      key: {
        id: storedKey._id,
        label: storedKey.label,
        publicAddress: storedKey.publicAddress,
        network: storedKey.network,
        keyType: storedKey.keyType,
        active: storedKey.active,
        createdAt: storedKey.createdAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all keys (without exposing private keys)
exports.getAllKeys = async (req, res) => {
  try {
    const { userId } = req.user;
    const keys = await PrivateKey.find({ userId }, {
      encryptedPrivateKey: 0,
      signature: 0
    }).sort({ createdAt: -1 });

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

// Get single key info (without private key)
exports.getKeyInfo = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;

    const key = await PrivateKey.findOne(
      { _id: keyId, userId },
      { encryptedPrivateKey: 0, signature: 0 }
    );

    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    res.json({
      success: true,
      key,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Update key permissions
exports.updateKeyPermissions = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;
    const { permissions } = req.body;

    const key = await PrivateKey.findOneAndUpdate(
      { _id: keyId, userId },
      {
        permissions,
        updatedAt: new Date(),
        $push: {
          auditLog: {
            action: 'PERMISSIONS_UPDATED',
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
          }
        }
      },
      { new: true }
    );

    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      key,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Deactivate key
exports.deactivateKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;

    const key = await PrivateKey.findOneAndUpdate(
      { _id: keyId, userId },
      {
        active: false,
        updatedAt: new Date(),
        $push: {
          auditLog: {
            action: 'KEY_DEACTIVATED',
            timestamp: new Date(),
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
            status: 'SUCCESS'
          }
        }
      },
      { new: true }
    );

    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    res.json({
      success: true,
      message: 'Key deactivated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get audit log
exports.getAuditLog = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;

    const key = await PrivateKey.findOne({ _id: keyId, userId });

    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    const auditLog = key.auditLog
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      auditLog,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: key.auditLog.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Delete key
exports.deleteKey = async (req, res) => {
  try {
    const { keyId } = req.params;
    const { userId } = req.user;
    const { confirmPassword } = req.body;

    if (!confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Confirmation password required'
      });
    }

    // Verify user password before deletion
    // TODO: Verify password from user model

    const key = await PrivateKey.findOneAndDelete({ _id: keyId, userId });

    if (!key) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }

    res.json({
      success: true,
      message: 'Key deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
