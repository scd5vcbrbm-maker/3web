/**
 * Data Migration Model
 * Track data migrations and backups
 */

const mongoose = require('mongoose');

const DataMigrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  migrationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  // Source
  sourceType: {
    type: String,
    enum: ['LOCAL_FILE', 'LOCAL_DATABASE', 'CLOUD_DATABASE'],
    required: true
  },
  sourceLocation: String,
  sourceFormat: String, // csv, json, xlsx, etc.
  // Destination
  destinationType: {
    type: String,
    enum: ['MONGODB', 'POSTGRESQL', 'MYSQL', 'FIREBASE'],
    required: true
  },
  destinationLocation: String,
  // Data Info
  dataInfo: {
    totalRecords: Number,
    totalSize: String,
    collections: [String],
    tables: [String]
  },
  // Migration Status
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'PAUSED'],
    default: 'PENDING'
  },
  progress: {
    type: Number,
    default: 0
  },
  // Error Handling
  errors: [{
    record: Number,
    error: String,
    timestamp: Date
  }],
  // Performance
  performance: {
    startTime: Date,
    endTime: Date,
    duration: Number, // milliseconds
    recordsPerSecond: Number
  },
  // Backup Info
  backup: {
    backupId: String,
    backupLocation: String,
    backupSize: String,
    createdAt: Date
  },
  // Rollback Info
  rollback: {
    enabled: Boolean,
    previousVersion: String,
    rollbackable: Boolean
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
  completedAt: Date
});

module.exports = mongoose.model('DataMigration', DataMigrationSchema);
