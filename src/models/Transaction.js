/**
 * Transaction Model
 * Tracks all transactions across assets
 */

const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    enum: ['TRANSFER', 'MINT', 'BURN', 'FREEZE', 'UNFREEZE', 'APPROVE', 'SWAP'],
    required: true
  },
  network: {
    type: String,
    default: 'TRON'
  },
  fromAddress: {
    type: String,
    required: true,
    index: true
  },
  toAddress: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: String,
    required: true
  },
  tokenAddress: String,
  tokenSymbol: String,
  gasUsed: String,
  gasFee: String,
  status: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  blockNumber: Number,
  timestamp: Date,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
