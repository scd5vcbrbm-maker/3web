/**
 * Master Key Model
 * Manages encryption master keys
 */

const mongoose = require('mongoose');

const MasterKeySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Hashed master key (never store plaintext)
  masterKeyHash: {
    type: String,
    required: true
  },
  // For key derivation
  salt: String,
  // Encryption settings
  encryptionAlgorithm: {
    type: String,
    default: 'aes-256-gcm'
  },
  keyDerivationFunction: {
    type: String,
    default: 'pbkdf2'
  },
  iterations: {
    type: Number,
    default: 100000
  },
  // Security settings
  mfaEnabled: Boolean,
  mfaMethod: String,
  requiresApprovalForHighRiskOperations: Boolean,
  approvalThreshold: Number,
  // Recovery
  recoveryPhrase: String, // Encrypted recovery phrase
  backupCreatedAt: Date,
  // Access control
  allowedIPs: [String],
  sessionTimeout: Number, // in minutes
  maxSessions: Number,
  // Audit
  auditLog: [{
    action: String,
    timestamp: Date,
    details: String,
    ipAddress: String
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
  lastRotatedAt: Date,
  nextRotationDue: Date
});

module.exports = mongoose.model('MasterKey', MasterKeySchema);
