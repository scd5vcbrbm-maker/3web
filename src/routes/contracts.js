/**
 * Smart Contracts Routes
 * Deploy, manage, and interact with smart contracts
 */

const express = require('express');
const router = express.Router();
const SmartContract = require('../models/SmartContract');
const { authenticateMasterKey } = require('../middleware/auth');
const TronWeb = require('tronweb');

const tronWeb = new TronWeb({
  fullHost: 'https://api.tronstack.com',
  privateKey: process.env.TRON_PRIVATE_KEY || ''
});

router.use(authenticateMasterKey);

// GET /api/contracts - Get all user contracts
router.get('/', async (req, res) => {
  try {
    const { userId } = req.user;
    const contracts = await SmartContract.find({ userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      contracts,
      count: contracts.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/contracts/:contractId - Get single contract
router.get('/:contractId', async (req, res) => {
  try {
    const contract = await SmartContract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      contract,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/contracts - Register existing contract
router.post('/', async (req, res) => {
  try {
    const { userId } = req.user;
    const { name, contractAddress, sourceCode, abi } = req.body;

    if (!name || !contractAddress || !abi) {
      return res.status(400).json({
        success: false,
        error: 'name, contractAddress, and abi are required'
      });
    }

    if (!tronWeb.isAddress(contractAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid TRON contract address'
      });
    }

    // Get contract info from chain
    const account = await tronWeb.trx.getAccount(contractAddress);
    const code = await tronWeb.trx.getContractInfo(contractAddress);

    const contract = new SmartContract({
      userId,
      name,
      contractAddress,
      owner: account.address,
      sourceCode,
      abi: Array.isArray(abi) ? abi : JSON.parse(abi),
      tronscanUrl: `https://tronscan.org/#/contract/${contractAddress}`
    });

    await contract.save();

    res.status(201).json({
      success: true,
      message: 'Contract registered successfully',
      contract,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/contracts/:contractId/call - Call contract function
router.post('/:contractId/call', async (req, res) => {
  try {
    const { functionName, parameters = [], value = 0 } = req.body;
    const contract = await SmartContract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    const tronContract = await tronWeb.contract().at(contract.contractAddress);

    let result;
    if (value > 0) {
      result = await tronContract[functionName](...parameters).send({ callValue: tronWeb.toSun(value) });
    } else {
      result = await tronContract[functionName](...parameters).call();
    }

    // Update contract state
    contract.state.totalCalls = (contract.state.totalCalls || 0) + 1;
    contract.state.lastCalled = new Date();
    await contract.save();

    res.json({
      success: true,
      function: functionName,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/contracts/:contractId/events - Get contract events
router.get('/:contractId/events', async (req, res) => {
  try {
    const contract = await SmartContract.findById(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      events: contract.events,
      count: contract.events.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// DELETE /api/contracts/:contractId - Remove contract from dashboard
router.delete('/:contractId', async (req, res) => {
  try {
    const contract = await SmartContract.findByIdAndDelete(req.params.contractId);

    if (!contract) {
      return res.status(404).json({
        success: false,
        error: 'Contract not found'
      });
    }

    res.json({
      success: true,
      message: 'Contract removed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
