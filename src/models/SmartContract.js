/**
 * Smart Contract Model
 * Manages deployed contracts on TRON
 */

const mongoose = require('mongoose');

const SmartContractSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  contractAddress: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  owner: {
    type: String,
    required: true
  },
  bytecode: String,
  abi: mongoose.Schema.Types.Mixed,
  sourceCode: String,
  version: String,
  verified: {
    type: Boolean,
    default: false
  },
  functions: [{
    name: String,
    type: String, // read, write, payable
    inputs: mongoose.Schema.Types.Mixed,
    outputs: mongoose.Schema.Types.Mixed
  }],
  state: {
    isPaused: Boolean,
    totalCalls: Number,
    lastCalled: Date
  },
  events: [{
    name: String,
    indexed: [String],
    transactionHash: String,
    blockNumber: Number,
    timestamp: Date,
    data: mongoose.Schema.Types.Mixed
  }],
  deploymentInfo: {
    transactionHash: String,
    blockNumber: Number,
    gasUsed: String,
    deploymentCost: String
  },
  tronscanUrl: String,
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

module.exports = mongoose.model('SmartContract', SmartContractSchema);
