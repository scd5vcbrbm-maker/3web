/**
 * Manual Configuration Controller
 * Handle manual addition of wallets, contracts, and encryption keys
 */

const PrivateKey = require('../models/PrivateKey');
const SmartContractLink = require('../models/SmartContractLink');
const EncryptionKey = require('../models/EncryptionKey');
const securityManager = require('../utils/securityManager');
const fs = require('fs');
const path = require('path');

// Add manual wallet
exports.addManualWallet = async (req, res) => {
  try {
    const { userId } = req.user;
    const { label, walletAddress, network, encryptionKeyValue } = req.body;

    if (!label || !walletAddress || !network || !encryptionKeyValue) {
      return res.status(400).json({
        success: false,
        error: 'label, walletAddress, network, and encryptionKeyValue are required'
      });
    }

    // Validate address format
    if (network === 'tron') {
      const TronWeb = require('tronweb');
      const tronWeb = new TronWeb({ fullHost: 'https://api.tronstack.com' });
      if (!tronWeb.isAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid TRON address'
        });
      }
    }

    // Create encryption key
    const keyId = 'manual_key_' + Date.now();
    const encrypted = securityManager.encryptAES256(
      encryptionKeyValue,
      process.env.MASTER_KEY_SECRET
    );

    const encryptionKey = new EncryptionKey({
      userId,
      keyId,
      keyType: 'OPERATIONAL_KEY',
      encryptedKey: encrypted,
      keyHash: securityManager.hashSHA256(encryptionKeyValue),
      permissions: {
        canEncrypt: true,
        canDecrypt: true,
        canSign: true
      },
      linkedContracts: [walletAddress]
    });

    await encryptionKey.save();

    // Create private key entry
    const privateKey = new PrivateKey({
      userId,
      label,
      keyType: 'CUSTOM',
      network,
      publicAddress: walletAddress,
      encryptedPrivateKey: encrypted,
      masterKeyHash: securityManager.hashSHA256(encryptionKeyValue),
      active: true,
      auditLog: [{
        action: 'MANUAL_WALLET_ADDED',
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        status: 'SUCCESS'
      }]
    });

    await privateKey.save();

    // Save to .env if requested
    if (req.body.saveToEnv) {
      const envKey = `${network.toUpperCase()}_WALLET_${label.toUpperCase().replace(/\s+/g, '_')}`;
      const envValue = walletAddress;
      updateEnvFile(envKey, envValue);
    }

    res.status(201).json({
      success: true,
      message: 'Wallet added manually',
      data: {
        walletId: privateKey._id,
        label,
        walletAddress,
        network,
        keyId,
        savedToEnv: req.body.saveToEnv || false,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Add manual contract
exports.addManualContract = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      contractName,
      contractAddress,
      contractType,
      linkedWallet,
      encryptionKey,
      abi
    } = req.body;

    if (!contractName || !contractAddress || !linkedWallet) {
      return res.status(400).json({
        success: false,
        error: 'contractName, contractAddress, and linkedWallet are required'
      });
    }

    // Create contract link
    const contractLink = new SmartContractLink({
      userId,
      contractName,
      contractAddress,
      contractType: contractType || 'TRC20',
      linkedWallet,
      encryptionKey: {
        keyId: encryptionKey.keyId || 'manual_' + Date.now(),
        algorithm: 'AES-256-GCM',
        strength: 256
      },
      linkingStatus: 'LINKED',
      linkedAt: new Date(),
      metadata: {
        sourceCode: req.body.sourceCode,
        verifiedOnTronscan: req.body.verifiedOnTronscan || false
      },
      auditLog: [{
        action: 'MANUAL_CONTRACT_ADDED',
        performer: userId,
        timestamp: new Date(),
        ipAddress: req.ip,
        status: 'SUCCESS'
      }]
    });

    await contractLink.save();

    // Save to .env if requested
    if (req.body.saveToEnv) {
      const envKey = `${contractType.toUpperCase()}_CONTRACT_${contractName.toUpperCase().replace(/\s+/g, '_')}`;
      const envValue = contractAddress;
      updateEnvFile(envKey, envValue);
    }

    res.status(201).json({
      success: true,
      message: 'Contract added manually',
      data: {
        contractId: contractLink._id,
        contractName,
        contractAddress,
        linkedWallet,
        status: contractLink.linkingStatus,
        savedToEnv: req.body.saveToEnv || false,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Add encryption key manually
exports.addManualEncryptionKey = async (req, res) => {
  try {
    const { userId } = req.user;
    const { keyName, keyValue, keyType = 'OPERATIONAL_KEY', linkedContracts = [] } = req.body;

    if (!keyName || !keyValue) {
      return res.status(400).json({
        success: false,
        error: 'keyName and keyValue are required'
      });
    }

    const keyId = 'manual_key_' + Date.now();

    // Encrypt the key
    const encrypted = securityManager.encryptAES256(
      keyValue,
      process.env.MASTER_KEY_SECRET
    );

    const encryptionKey = new EncryptionKey({
      userId,
      keyId,
      keyType,
      encryptedKey: encrypted,
      keyHash: securityManager.hashSHA256(keyValue),
      linkedContracts,
      permissions: {
        canEncrypt: true,
        canDecrypt: true,
        canSign: true,
        canVerify: true
      },
      auditLog: [{
        action: 'MANUAL_KEY_ADDED',
        timestamp: new Date(),
        details: `Added encryption key: ${keyName}`
      }]
    });

    await encryptionKey.save();

    // Save to .env if requested
    if (req.body.saveToEnv) {
      const envKey = `ENCRYPTION_KEY_${keyName.toUpperCase().replace(/\s+/g, '_')}`;
      const envValue = keyValue;
      updateEnvFile(envKey, envValue);
    }

    res.status(201).json({
      success: true,
      message: 'Encryption key added manually',
      data: {
        keyId,
        keyName,
        keyHash: encryptionKey.keyHash,
        linkedContracts,
        savedToEnv: req.body.saveToEnv || false,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get all manual entries
exports.getManualEntries = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type } = req.query; // 'wallets', 'contracts', 'keys'

    let data = {};

    if (!type || type === 'wallets') {
      data.wallets = await PrivateKey.find(
        { userId, keyType: 'CUSTOM' },
        { encryptedPrivateKey: 0 }
      );
    }

    if (!type || type === 'contracts') {
      data.contracts = await SmartContractLink.find({ userId });
    }

    if (!type || type === 'keys') {
      data.keys = await EncryptionKey.find(
        { userId, keyType: 'OPERATIONAL_KEY' },
        { encryptedKey: 0 }
      );
    }

    res.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Update .env file
function updateEnvFile(key, value) {
  try {
    const envPath = path.join(__dirname, '../../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');

    // Check if key exists
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      // Update existing
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new
      envContent += `\n${key}=${value}`;
    }

    fs.writeFileSync(envPath, envContent);
    return true;
  } catch (err) {
    console.error('Error updating .env file:', err);
    return false;
  }
}
