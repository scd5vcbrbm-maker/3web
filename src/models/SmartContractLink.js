/**
 * Smart Contract Link Model
 * Links contracts to wallets with encryption keys
 */

const mongoose = require('mongoose');

const SmartContractLinkSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  // Contract Information
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  contractName: {
    type: String,
    required: true
  },
  contractType: {
    type: String,
    enum: ['TRC20', 'TRC10', 'CUSTOM', 'NFT', 'STAKING'],
    required: true
  },
  // Wallet Information
  linkedWallet: {
    type: String,
    required: true,
    index: true
  },
  // Encryption Keys
  encryptionKey: {
    keyId: String,
    algorithm: String,
    strength: Number // 256
  },
  // Multi-Signature Support
  multiSigConfig: {
    enabled: Boolean,
    threshold: Number, // M of N signatures required
    signers: [{
      walletAddress: String,
      keyId: String,
      signed: Boolean
    }]
  },
  // Ownership Verification
  ownershipVerification: {
    verified: {
      type: Boolean,
      default: false
    },
    verificationMethod: String, // 'signature', 'transaction', 'ownership_check'
    verificationHash: String,
    verificationTimestamp: Date,
    verificationExpires: Date
  },
  // Contract State
  state: {
    totalSupply: String,
    currentBalance: String,
    decimals: Number,
    symbol: String,
    isPaused: Boolean,
    isFrozen: Boolean
  },
  // Control Permissions
  permissions: {
    canMint: Boolean,
    canBurn: Boolean,
    canTransfer: Boolean,
    canFreeze: Boolean,
    canUpgrade: Boolean,
    canPause: Boolean,
    dailyTransactionLimit: String,
    monthlyTransactionLimit: String
  },
  // Multi-Key Management
  keyHierarchy: {
    masterKey: {
      keyId: String,
      hasAccess: Boolean
    },
    operationalKeys: [{
      keyId: String,
      permissions: [String],
      dailyLimit: String
    }],
    emergencyKey: {
      keyId: String,
      hasAccess: Boolean
    }
  },
  // Linked Assets
  linkedAssets: [{
    assetId: String,
    type: String,
    address: String
  }],
  // Backup & Recovery
  backup: {
    encryptedBackup: String,
    backupCreatedAt: Date,
    backupHash: String
  },
  // Audit Trail
  auditLog: [{
    action: String,
    performer: String,
    timestamp: Date,
    ipAddress: String,
    details: String,
    status: String
  }],
  // Linking Status
  linkingStatus: {
    type: String,
    enum: ['PENDING', 'VERIFYING', 'VERIFIED', 'LINKED', 'REVOKED'],
    default: 'PENDING'
  },
  // Contract Metadata
  metadata: {
    deploymentBlock: Number,
    deploymentTransaction: String,
    tronscanUrl: String,
    sourceCode: String,
    verifiedOnTronscan: Boolean
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  linkedAt: Date
});

module.exports = mongoose.model('SmartContractLink', SmartContractLinkSchema);
