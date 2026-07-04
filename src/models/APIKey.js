/**
 * API Key Model
 * Server authentication and management
 */

const mongoose = require('mongoose');

const APIKeySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  keyName: {
    type: String,
    required: true
  },
  keyType: {
    type: String,
    enum: ['SERVER', 'EXTERNAL', 'WEBHOOK', 'MOBILE'],
    default: 'SERVER'
  },
  keyValue: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  keySecret: String,
  // Server Info
  serverName: String,
  serverIP: String,
  serverLocation: String,
  // Permissions
  permissions: {
    canRead: Boolean,
    canWrite: Boolean,
    canDelete: Boolean,
    canMint: Boolean,
    canBurn: Boolean,
    canTransfer: Boolean,
    allowedEndpoints: [String]
  },
  // Rate Limiting
  rateLimits: {
    requestsPerMinute: Number,
    requestsPerHour: Number,
    requestsPerDay: Number
  },
  // Access Control
  ipWhitelist: [String],
  allowedOrigins: [String],
  // Encryption
  encryptedWithKey: String,
  // Usage Tracking
  usageStats: {
    totalRequests: Number,
    lastUsed: Date,
    createdRequests: Number,
    failedRequests: Number
  },
  // Active Status
  active: {
    type: Boolean,
    default: true
  },
  // Key Rotation
  rotationSchedule: {
    autoRotate: Boolean,
    rotationInterval: Number, // days
    nextRotation: Date,
    lastRotated: Date
  },
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
  expiresAt: Date
});

module.exports = mongoose.model('APIKey', APIKeySchema);
