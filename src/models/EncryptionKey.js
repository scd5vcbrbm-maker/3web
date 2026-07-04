/**
 * Encryption Key Model
 * Manages encryption keys for contracts
 */

const mongoose = require('mongoose');

const EncryptionKeySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  keyId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keyType: {
    type: String,
    enum: ['MASTER_KEY', 'OPERATIONAL_KEY', 'EMERGENCY_KEY', 'TEMPORARY_KEY'],
    required: true
  },
  algorithm: {
    type: String,
    default: 'AES-256-GCM'
  },
  keyStrength: {
    type: Number,
    default: 256
  },
  // Encrypted key storage
  encryptedKey: {
    iv: String,
    encryptedData: String,
    authTag: String
  },
  // Key metadata
  keyHash: String,
  publicKeyHash: String,
  derivationSalt: String,
  // Usage tracking
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: Date,
  // Permissions
  permissions: {
    canEncrypt: Boolean,
    canDecrypt: Boolean,
    canSign: Boolean,
    canVerify: Boolean,
    canDelegate: Boolean
  },
  // Access control
  accessControl: {
    allowedIPs: [String],
    allowedDevices: [String],
    requiresMFA: Boolean,
    requiresApproval: Boolean
  },
  // Expiration
  expiresAt: Date,
  rotationRequired: Boolean,
  rotationScheduled: Date,
  // Associated contracts
  linkedContracts: [String],
  // Key backup
  backup: {
    hasBackup: Boolean,
    backupLocation: String,
    backupCreatedAt: Date,
    backupHash: String
  },
  // Audit
  auditLog: [{
    action: String,
    timestamp: Date,
    ipAddress: String,
    details: String
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('EncryptionKey', EncryptionKeySchema);
