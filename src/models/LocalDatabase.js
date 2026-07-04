/**
 * Local Database Configuration Model
 * Store local database credentials
 */

const mongoose = require('mongoose');
const securityManager = require('../utils/securityManager');

const LocalDatabaseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  dbName: {
    type: String,
    required: true
  },
  dbType: {
    type: String,
    enum: ['MONGODB', 'POSTGRESQL', 'MYSQL', 'SQLITE', 'OTHER'],
    required: true
  },
  // Connection Details (Encrypted)
  connection: {
    host: String,
    port: Number,
    database: String,
    username: String,
    password: String, // Encrypted
    connectionString: String // Encrypted
  },
  // Encryption
  encrypted: {
    type: Boolean,
    default: true
  },
  encryptionMethod: String,
  // Status
  active: {
    type: Boolean,
    default: true
  },
  // Connection Test
  lastConnectionTest: {
    timestamp: Date,
    success: Boolean,
    error: String
  },
  // Data Info
  dataInfo: {
    totalCollections: Number,
    totalRecords: Number,
    totalSize: String,
    lastIndexedAt: Date
  },
  // Backup Info
  backups: [{
    backupId: String,
    createdAt: Date,
    size: String,
    location: String,
    encrypted: Boolean
  }],
  // Migration History
  migrationHistory: [{
    migrationId: String,
    timestamp: Date,
    status: String,
    recordsMigrated: Number
  }],
  // Sync Settings
  syncSettings: {
    autoSync: Boolean,
    syncInterval: Number, // seconds
    lastSyncAt: Date,
    nextSyncAt: Date
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
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LocalDatabase', LocalDatabaseSchema);
