/**
 * Asset Model
 * Stores all user assets and contracts on TRON
 */

const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['TRX', 'TRC20', 'TRC10', 'NFT', 'SMART_CONTRACT'],
    required: true
  },
  contractAddress: {
    type: String,
    required: true,
    index: true
  },
  ownerAddress: {
    type: String,
    required: true,
    index: true
  },
  symbol: String,
  decimals: Number,
  totalSupply: String,
  currentSupply: String,
  balance: String,
  tronscanUrl: String,
  metadata: {
    logoUrl: String,
    description: String,
    website: String,
    github: String
  },
  settings: {
    isPaused: Boolean,
    isMintable: Boolean,
    isBurnable: Boolean,
    isTransferable: Boolean,
    frozenBalance: String
  },
  transactions: [{
    hash: String,
    type: String,
    from: String,
    to: String,
    amount: String,
    timestamp: Date,
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
  }
});

module.exports = mongoose.model('Asset', AssetSchema);
