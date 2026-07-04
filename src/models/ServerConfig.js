/**
 * Server Configuration Model
 * Manage server-to-server communication
 */

const mongoose = require('mongoose');

const ServerConfigSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  serverId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  serverName: {
    type: String,
    required: true
  },
  serverType: {
    type: String,
    enum: ['MAIN', 'BACKUP', 'WORKER', 'GATEWAY'],
    default: 'WORKER'
  },
  // Server Details
  ipAddress: String,
  port: Number,
  baseUrl: String,
  // Authentication
  apiKey: String,
  apiSecret: String,
  encryptionKey: String,
  // Configuration
  config: {
    maxConnections: Number,
    timeout: Number,
    retryAttempts: Number,
    retryDelay: Number
  },
  // Environment Variables (Encrypted)
  envVariables: [
    {
      key: String,
      value: String, // Encrypted
      encrypted: Boolean,
      lastUpdated: Date
    }
  ],
  // Health Check
  healthCheck: {
    enabled: Boolean,
    interval: Number,
    lastCheck: Date,
    status: String,
    uptime: Number
  },
  // Capabilities
  capabilities: [String], // 'tron', 'ethereum', 'binance', etc.
  // Status
  active: {
    type: Boolean,
    default: true
  },
  online: {
    type: Boolean,
    default: false
  },
  // Audit
  auditLog: [{
    action: String,
    timestamp: Date,
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

module.exports = mongoose.model('ServerConfig', ServerConfigSchema);
