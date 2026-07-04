/**
 * Private Key Model
 * Stores encrypted private keys
 */

const mongoose = require('mongoose');

const PrivateKeySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  label: {
    type: String,
    required: true
  },
  keyType: {
    type: String,
    enum: ['ETHEREUM', 'TRON', 'POLYGON', 'MASTER', 'CUSTOM'],
    required: true
  },
  network: {
    type: String,
    enum: ['ethereum', 'polygon', 'arbitrum', 'optimism', 'tron', 'custom'],
    required: true
  },
  publicAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  encryptedPrivateKey: {
    iv: String,
    encryptedData: String,
    authTag: String,
    algorithm: String
  },
  publicKey: String,
  masterKeyHash: String,
  keyDerivationSalt: String,
  // ECDSA Signature for verification
  signature: String,
  // Metadata
  active: {
    type: Boolean,
    default: true
  },
  lastUsed: Date,
  usageCount: {
    type: Number,
    default: 0
  },
  ipWhitelist: [String],
  permissions: {
    canSign: Boolean,
    canTransfer: Boolean,
    canDeploy: Boolean,
    canMint: Boolean,
    canBurn: Boolean,
    dailyLimit: Number
  },
  auditLog: [{
    action: String,
    timestamp: Date,
    ipAddress: String,
    userAgent: String,
    status: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: Date
});

module.exports = mongoose.model('PrivateKey', PrivateKeySchema);
