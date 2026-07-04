/**
 * Contract Linking Controller
 * Handles contract linking and verification
 */

const SmartContractLink = require('../models/SmartContractLink');
const EncryptionKey = require('../models/EncryptionKey');
const PrivateKey = require('../models/PrivateKey');
const securityManager = require('../utils/securityManager');
const TronWeb = require('tronweb');
const ethers = require('ethers');

const tronWeb = new TronWeb({
  fullHost: 'https://api.tronstack.com',
  privateKey: process.env.TRON_PRIVATE_KEY || ''
});

// Initiate contract linking
exports.initiateContractLink = async (req, res) => {
  try {
    const { userId } = req.user;
    const {
      contractAddress,
      contractName,
      contractType,
      linkedWallet,
      keyStrength = 256
    } = req.body;

    if (!contractAddress || !contractName || !linkedWallet) {
      return res.status(400).json({
        success: false,
        error: 'contractAddress, contractName, and linkedWallet are required'
      });
    }

    // Verify contract exists on TRON
    if (!tronWeb.isAddress(contractAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TRON contract address'
      });
    }

    if (!tronWeb.isAddress(linkedWallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address'
      });
    }

    // Get contract info
    const contractInfo = await tronWeb.trx.getContractInfo(contractAddress);
    if (!contractInfo) {
      return res.status(400).json({
        success: false,
        error: 'Contract not found on TRON network'
      });
    }

    // Create encryption key for this contract
    const keyId = 'key_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const masterKeySecret = securityManager.generateMasterKey();

    const encryptionKey = new EncryptionKey({
      userId,
      keyId,
      keyType: 'MASTER_KEY',
      algorithm: 'AES-256-GCM',
      keyStrength,
      keyHash: securityManager.hashSHA256(masterKeySecret),
      permissions: {
        canEncrypt: true,
        canDecrypt: true,
        canSign: true,
        canVerify: true
      },
      linkedContracts: [contractAddress]
    });

    // Encrypt the key
    const encrypted = securityManager.encryptAES256(
      masterKeySecret,
      process.env.MASTER_KEY_SECRET
    );
    encryptionKey.encryptedKey = encrypted;

    await encryptionKey.save();

    // Create contract link
    const contractLink = new SmartContractLink({
      userId,
      contractAddress,
      contractName,
      contractType: contractType || 'TRC20',
      linkedWallet,
      encryptionKey: {
        keyId,
        algorithm: 'AES-256-GCM',
        strength: keyStrength
      },
      linkingStatus: 'PENDING',
      state: {
        currentBalance: '0'
      },
      auditLog: [{
        action: 'LINK_INITIATED',
        performer: userId,
        timestamp: new Date(),
        ipAddress: req.ip,
        status: 'SUCCESS'
      }]
    });

    await contractLink.save();

    res.status(201).json({
      success: true,
      message: 'Contract linking initiated',
      data: {
        linkId: contractLink._id,
        contractAddress,
        status: contractLink.linkingStatus,
        nextStep: 'Verify ownership by signing transaction',
        keyId: keyId,
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

// Verify contract ownership
exports.verifyOwnership = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.user;
    const { signature, message, keyId } = req.body;

    if (!signature || !message || !keyId) {
      return res.status(400).json({
        success: false,
        error: 'signature, message, and keyId are required'
      });
    }

    const contractLink = await SmartContractLink.findOne({ _id: linkId, userId });
    if (!contractLink) {
      return res.status(404).json({
        success: false,
        error: 'Contract link not found'
      });
    }

    // Get the private key
    const privateKey = await PrivateKey.findOne({
      userId,
      publicAddress: contractLink.linkedWallet
    });

    if (!privateKey) {
      return res.status(400).json({
        success: false,
        error: 'Linked wallet private key not found'
      });
    }

    // Verify signature
    const verificationHash = securityManager.hashSHA256(message + signature);
    const isValid = securityManager.verifyECDSA(
      message,
      signature,
      privateKey.publicKey
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Signature verification failed'
      });
    }

    // Update contract link
    contractLink.ownershipVerification = {
      verified: true,
      verificationMethod: 'signature',
      verificationHash,
      verificationTimestamp: new Date(),
      verificationExpires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
    contractLink.linkingStatus = 'VERIFIED';

    contractLink.auditLog.push({
      action: 'OWNERSHIP_VERIFIED',
      performer: userId,
      timestamp: new Date(),
      ipAddress: req.ip,
      status: 'SUCCESS'
    });

    await contractLink.save();

    res.json({
      success: true,
      message: 'Contract ownership verified successfully',
      data: {
        linkId: contractLink._id,
        verified: true,
        verificationHash,
        nextStep: 'Link contract to wallet',
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

// Complete contract linking
exports.completeContractLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.user;

    const contractLink = await SmartContractLink.findOne({ _id: linkId, userId });
    if (!contractLink) {
      return res.status(404).json({
        success: false,
        error: 'Contract link not found'
      });
    }

    if (!contractLink.ownershipVerification.verified) {
      return res.status(400).json({
        success: false,
        error: 'Contract ownership not verified'
      });
    }

    // Get current contract balance
    const contract = await tronWeb.contract().at(contractLink.contractAddress);
    const balance = await contract.balanceOf(contractLink.linkedWallet).call();
    const decimals = await contract.decimals().call();
    const symbol = await contract.symbol().call();

    const balanceValue = balance / Math.pow(10, decimals);

    // Update contract link
    contractLink.linkingStatus = 'LINKED';
    contractLink.state = {
      currentBalance: balanceValue.toString(),
      decimals: decimals.toNumber(),
      symbol: symbol.toString()
    };
    contractLink.linkedAt = new Date();

    contractLink.auditLog.push({
      action: 'CONTRACT_LINKED',
      performer: userId,
      timestamp: new Date(),
      ipAddress: req.ip,
      details: `Linked to wallet ${contractLink.linkedWallet}`,
      status: 'SUCCESS'
    });

    await contractLink.save();

    res.json({
      success: true,
      message: 'Contract linked successfully',
      data: {
        linkId: contractLink._id,
        contractAddress: contractLink.contractAddress,
        linkedWallet: contractLink.linkedWallet,
        status: contractLink.linkingStatus,
        balance: {
          raw: balance.toString(),
          formatted: balanceValue,
          symbol: symbol.toString()
        },
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

// Get all linked contracts
exports.getLinkedContracts = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50, status } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId };

    if (status) {
      query.linkingStatus = status;
    }

    const contracts = await SmartContractLink.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await SmartContractLink.countDocuments(query);

    res.json({
      success: true,
      contracts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
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

// Get single contract link
exports.getContractLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.user;

    const contractLink = await SmartContractLink.findOne({ _id: linkId, userId });
    if (!contractLink) {
      return res.status(404).json({
        success: false,
        error: 'Contract link not found'
      });
    }

    res.json({
      success: true,
      contract: contractLink,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Update contract permissions
exports.updateContractPermissions = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.user;
    const { permissions } = req.body;

    if (!permissions) {
      return res.status(400).json({
        success: false,
        error: 'permissions are required'
      });
    }

    const contractLink = await SmartContractLink.findOneAndUpdate(
      { _id: linkId, userId },
      {
        permissions,
        updatedAt: new Date(),
        $push: {
          auditLog: {
            action: 'PERMISSIONS_UPDATED',
            performer: userId,
            timestamp: new Date(),
            ipAddress: req.ip,
            status: 'SUCCESS'
          }
        }
      },
      { new: true }
    );

    if (!contractLink) {
      return res.status(404).json({
        success: false,
        error: 'Contract link not found'
      });
    }

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      contract: contractLink,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Create backup
exports.createBackup = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { userId } = req.user;

    const contractLink = await SmartContractLink.findOne({ _id: linkId, userId });
    if (!contractLink) {
      return res.status(404).json({
        success: false,
        error: 'Contract link not found'
      });
    }

    // Create encrypted backup
    const backupData = JSON.stringify({
      contractAddress: contractLink.contractAddress,
      linkedWallet: contractLink.linkedWallet,
      encryptionKey: contractLink.encryptionKey,
      permissions: contractLink.permissions,
      metadata: contractLink.metadata
    });

    const backupEncrypted = securityManager.encryptAES256(
      backupData,
      process.env.MASTER_KEY_SECRET
    );

    const backupHash = securityManager.hashSHA256(backupData);

    contractLink.backup = {
      encryptedBackup: JSON.stringify(backupEncrypted),
      backupCreatedAt: new Date(),
      backupHash
    };

    await contractLink.save();

    res.json({
      success: true,
      message: 'Backup created successfully',
      data: {
        backupHash,
        backupCreatedAt: contractLink.backup.backupCreatedAt,
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
