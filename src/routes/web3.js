/**
 * Web3 Multi-Chain Routes
 * - Ethereum, Polygon, Arbitrum, Optimism
 * - Balance checks, transactions, gas prices
 * - Smart contract interactions
 */

const express = require('express');
const router = express.Router();
const ethers = require('ethers');

// Network configurations
const networks = {
  ethereum: {
    rpc: process.env.WEB3_PROVIDER_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    chainId: 1,
    name: 'Ethereum Mainnet',
    symbol: 'ETH'
  },
  polygon: {
    rpc: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
    chainId: 137,
    name: 'Polygon',
    symbol: 'MATIC'
  },
  arbitrum: {
    rpc: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    name: 'Arbitrum One',
    symbol: 'ETH'
  },
  optimism: {
    rpc: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    chainId: 10,
    name: 'Optimism',
    symbol: 'ETH'
  }
};

// Get provider for network
const getProvider = (network) => {
  if (!networks[network]) {
    throw new Error(`Unsupported network: ${network}`);
  }
  return new ethers.JsonRpcProvider(networks[network].rpc);
};

// GET /api/web3/balance/:network/:address
router.get('/balance/:network/:address', async (req, res) => {
  try {
    const { network, address } = req.params;
    const provider = getProvider(network);

    if (!ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }

    const balance = await provider.getBalance(address);
    const formattedBalance = ethers.formatEther(balance);

    res.json({
      success: true,
      network: networks[network].name,
      address,
      balance: {
        wei: balance.toString(),
        formatted: formattedBalance
      },
      symbol: networks[network].symbol,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/web3/gas-price/:network
router.get('/gas-price/:network', async (req, res) => {
  try {
    const { network } = req.params;
    const provider = getProvider(network);

    const feeData = await provider.getFeeData();

    res.json({
      success: true,
      network: networks[network].name,
      gasPrice: {
        gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei') + ' Gwei',
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') + ' Gwei' : 'N/A',
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') + ' Gwei' : 'N/A'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/web3/transaction/:network/:txHash
router.get('/transaction/:network/:txHash', async (req, res) => {
  try {
    const { network, txHash } = req.params;
    const provider = getProvider(network);

    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    res.json({
      success: true,
      network: networks[network].name,
      transaction: {
        hash: txHash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasPrice: ethers.formatUnits(tx.gasPrice, 'gwei') + ' Gwei',
        gasLimit: tx.gasLimit.toString(),
        nonce: tx.nonce,
        blockNumber: receipt?.blockNumber,
        confirmations: receipt ? await provider.getBlockNumber() - receipt.blockNumber : 0,
        status: receipt?.status === 1 ? 'Success' : 'Failed'
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// GET /api/web3/networks
router.get('/networks', (req, res) => {
  const networkList = Object.entries(networks).map(([key, value]) => ({
    id: key,
    name: value.name,
    chainId: value.chainId,
    symbol: value.symbol,
    rpcUrl: value.rpc
  }));

  res.json({
    success: true,
    networks: networkList,
    supportedNetworks: Object.keys(networks),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
