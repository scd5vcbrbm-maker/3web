const express = require('express');
const router = express.Router();
const ethers = require('ethers');
const logger = require('../utils/logger');

/**
 * GET /api/web3/balance/:address
 * Get balance of an Ethereum address
 */
router.get('/balance/:address', async (req, res) => {
  try {
    const { address, network = 'mainnet' } = req.query;
    const addressParam = req.params.address || address;

    if (!addressParam) {
      return res.status(400).json({
        status: 'error',
        message: 'Address is required',
        code: 'INVALID_INPUT'
      });
    }

    // Validate address
    if (!ethers.isAddress(addressParam)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid Ethereum address',
        code: 'INVALID_ADDRESS'
      });
    }

    // Get provider based on network
    const provider = new ethers.JsonRpcProvider(
      network === 'polygon' ? process.env.POLYGON_RPC_URL :
      network === 'arbitrum' ? process.env.ARBITRUM_RPC_URL :
      network === 'optimism' ? process.env.OPTIMISM_RPC_URL :
      process.env.WEB3_PROVIDER_URL
    );

    const balance = await provider.getBalance(addressParam);
    const balanceInEth = ethers.formatEther(balance);

    logger.info(`Balance fetched for ${addressParam}: ${balanceInEth} ETH`);

    res.status(200).json({
      status: 'success',
      data: {
        address: addressParam,
        balance: balance.toString(),
        balanceInEth,
        network,
        timestamp: new Date().toISOString()
      },
      message: 'Balance retrieved successfully'
    });
  } catch (error) {
    logger.error(`Balance fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch balance',
      code: 'BALANCE_ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/web3/transaction/:txHash
 * Get transaction details
 */
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const { network = 'mainnet' } = req.query;

    if (!txHash) {
      return res.status(400).json({
        status: 'error',
        message: 'Transaction hash is required',
        code: 'INVALID_INPUT'
      });
    }

    // Get provider
    const provider = new ethers.JsonRpcProvider(
      network === 'polygon' ? process.env.POLYGON_RPC_URL :
      network === 'arbitrum' ? process.env.ARBITRUM_RPC_URL :
      network === 'optimism' ? process.env.OPTIMISM_RPC_URL :
      process.env.WEB3_PROVIDER_URL
    );

    const transaction = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    res.status(200).json({
      status: 'success',
      data: {
        hash: transaction?.hash,
        from: transaction?.from,
        to: transaction?.to,
        value: transaction?.value?.toString(),
        gasPrice: transaction?.gasPrice?.toString(),
        gasLimit: transaction?.gasLimit?.toString(),
        status: receipt?.status,
        blockNumber: receipt?.blockNumber,
        confirmations: receipt?.confirmations,
        timestamp: new Date().toISOString()
      },
      message: 'Transaction retrieved successfully'
    });
  } catch (error) {
    logger.error(`Transaction fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch transaction',
      code: 'TRANSACTION_ERROR',
      error: error.message
    });
  }
});

/**
 * POST /api/web3/send-transaction
 * Send a transaction (requires signing key)
 */
router.post('/send-transaction', async (req, res) => {
  try {
    const { to, amount, network = 'mainnet' } = req.body;

    if (!to || !amount) {
      return res.status(400).json({
        status: 'error',
        message: 'To address and amount are required',
        code: 'INVALID_INPUT'
      });
    }

    // Get provider
    const provider = new ethers.JsonRpcProvider(
      network === 'polygon' ? process.env.POLYGON_RPC_URL :
      network === 'arbitrum' ? process.env.ARBITRUM_RPC_URL :
      network === 'optimism' ? process.env.OPTIMISM_RPC_URL :
      process.env.WEB3_PROVIDER_URL
    );

    logger.info(`Transaction prepared: ${amount} ETH to ${to}`);

    res.status(200).json({
      status: 'success',
      data: {
        to,
        amount,
        network,
        message: 'Transaction prepared. Sign and send via web3 wallet.'
      }
    });
  } catch (error) {
    logger.error(`Transaction send error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to send transaction',
      code: 'TRANSACTION_ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/web3/gas-price
 * Get current gas price
 */
router.get('/gas-price', async (req, res) => {
  try {
    const { network = 'mainnet' } = req.query;

    const provider = new ethers.JsonRpcProvider(
      network === 'polygon' ? process.env.POLYGON_RPC_URL :
      network === 'arbitrum' ? process.env.ARBITRUM_RPC_URL :
      network === 'optimism' ? process.env.OPTIMISM_RPC_URL :
      process.env.WEB3_PROVIDER_URL
    );

    const gasPrice = await provider.getGasPrice();
    const gasPriceInGwei = ethers.formatUnits(gasPrice, 'gwei');

    res.status(200).json({
      status: 'success',
      data: {
        gasPrice: gasPrice.toString(),
        gasPriceInGwei,
        network,
        timestamp: new Date().toISOString()
      },
      message: 'Gas price retrieved successfully'
    });
  } catch (error) {
    logger.error(`Gas price fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch gas price',
      code: 'GAS_PRICE_ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/web3/networks
 * Get list of supported networks
 */
router.get('/networks', (req, res) => {
  const networks = [
    {
      name: 'Ethereum Mainnet',
      chain: 'ethereum',
      id: 1,
      rpc: process.env.WEB3_PROVIDER_URL
    },
    {
      name: 'Polygon',
      chain: 'polygon',
      id: 137,
      rpc: process.env.POLYGON_RPC_URL
    },
    {
      name: 'Arbitrum One',
      chain: 'arbitrum',
      id: 42161,
      rpc: process.env.ARBITRUM_RPC_URL
    },
    {
      name: 'Optimism',
      chain: 'optimism',
      id: 10,
      rpc: process.env.OPTIMISM_RPC_URL
    }
  ];

  res.status(200).json({
    status: 'success',
    data: networks,
    total: networks.length,
    message: 'Supported networks'
  });
});

module.exports = router;
