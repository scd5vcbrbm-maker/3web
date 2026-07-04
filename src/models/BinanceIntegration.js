/**
 * Binance Integration Model
 */

const mongoose = require('mongoose');

const BinanceIntegrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  binanceApiKey: {
    type: String,
    required: true
  },
  binanceApiSecret: {
    type: String,
    required: true
  },
  // Wallet Mapping
  walletMappings: [{
    walletAddress: String,
    binanceUserId: String,
    binanceEmail: String,
    syncedAt: Date,
    lastUpdate: Date
  }],
  // Contract Mapping
  contractMappings: [{
    contractAddress: String,
    binanceTokenId: String,
    binanceSymbol: String,
    syncedAt: Date
  }],
  // Settings
  settings: {
    autoSync: Boolean,
    syncInterval: Number,
    enablePriceUpdates: Boolean,
    enableTransactionTracking: Boolean
  },
  // Sync Status
  syncStatus: {
    lastSync: Date,
    nextSync: Date,
    syncInProgress: Boolean,
    lastSyncStatus: String
  },
  // Audit
  auditLog: [{
    action: String,
    timestamp: Date,
    details: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('BinanceIntegration', BinanceIntegrationSchema);
