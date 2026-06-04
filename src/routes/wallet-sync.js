const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

/**
 * POST /api/wallet-sync/import
 * Import wallet from external sources (Binance, Trust Wallet, MetaMask, etc.)
 */
router.post('/import', async (req, res) => {
  try {
    const { source, apiKey, apiSecret } = req.body;
    const userId = req.userId;

    if (!source || !apiKey) {
      return res.status(400).json({
        status: 'error',
        message: 'source and apiKey are required',
        code: 'INVALID_INPUT'
      });
    }

    // Supported wallet sources
    const supportedSources = [
      'Binance', 'Trust Wallet', 'MetaMask', 'Coinbase', 'Kraken',
      'Ledger', 'Trezor', 'Phantom', 'OKEx', 'Huobi', 'Kucoin', 'Bybit'
    ];

    if (!supportedSources.includes(source)) {
      return res.status(400).json({
        status: 'error',
        message: `Source not supported. Supported: ${supportedSources.join(', ')}`,
        code: 'INVALID_SOURCE'
      });
    }

    // Fetch wallet data from external source
    let walletData = {};

    switch (source.toLowerCase()) {
      case 'binance':
        walletData = await fetchBinanceWallets(apiKey, apiSecret);
        break;
      case 'coinbase':
        walletData = await fetchCoinbaseWallets(apiKey, apiSecret);
        break;
      case 'kraken':
        walletData = await fetchKrakenWallets(apiKey, apiSecret);
        break;
      case 'trust wallet':
      case 'metamask':
      case 'ledger':
      case 'trezor':
      case 'phantom':
        walletData = await fetchBlockchainWallet(apiKey);
        break;
      default:
        walletData = await fetchBlockchainWallet(apiKey);
    }

    const connection = {
      id: `sync_${uuidv4()}`,
      userId,
      source,
      status: 'connected',
      balance: walletData.balance || '0',
      address: walletData.address || apiKey.substring(0, 20) + '...',
      walletCount: walletData.walletCount || 1,
      lastSync: new Date().toISOString(),
      nextSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      apiKeyEncrypted: '[ENCRYPTED]',
      autoSync: true,
      syncInterval: 5
    };

    logger.info(`Wallet imported from ${source}: ${connection.id}`);

    res.status(201).json({
      status: 'success',
      data: connection,
      message: `Wallet from ${source} imported successfully`
    });
  } catch (error) {
    logger.error(`Wallet import error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Wallet import failed',
      code: 'IMPORT_ERROR',
      error: error.message
    });
  }
});

/**
 * GET /api/wallet-sync/connected
 * Get all connected external wallets
 */
router.get('/connected', async (req, res) => {
  try {
    const userId = req.userId;

    // Mock connected wallets data
    const connectedWallets = [
      {
        id: 'conn_1',
        userId,
        source: 'Binance',
        status: 'connected',
        balance: '15.5',
        balanceUsd: '32500.00',
        address: 'bnb1234567890....',
        walletCount: 5,
        lastSync: new Date(Date.now() - 60000).toISOString(),
        nextSync: new Date(Date.now() + 4 * 60000).toISOString(),
        autoSync: true
      },
      {
        id: 'conn_2',
        userId,
        source: 'Trust Wallet',
        status: 'connected',
        balance: '8.25',
        balanceUsd: '15200.50',
        address: '0x742d35Cc6634C0532925a3b844Bc04e979E0E5c3',
        walletCount: 3,
        lastSync: new Date(Date.now() - 120000).toISOString(),
        nextSync: new Date(Date.now() + 3 * 60000).toISOString(),
        autoSync: true
      },
      {
        id: 'conn_3',
        userId,
        source: 'MetaMask',
        status: 'connected',
        balance: '12.75',
        balanceUsd: '23875.25',
        address: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
        walletCount: 2,
        lastSync: new Date(Date.now() - 180000).toISOString(),
        nextSync: new Date(Date.now() + 2 * 60000).toISOString(),
        autoSync: true
      },
      {
        id: 'conn_4',
        userId,
        source: 'Coinbase',
        status: 'syncing',
        balance: '5.5',
        balanceUsd: '10200.00',
        address: 'cb_wallet_xxx...',
        walletCount: 4,
        lastSync: new Date(Date.now() - 300000).toISOString(),
        nextSync: new Date(Date.now() + 1 * 60000).toISOString(),
        autoSync: true
      }
    ];

    res.status(200).json({
      status: 'success',
      data: connectedWallets,
      total: connectedWallets.length,
      message: 'Connected wallets retrieved'
    });
  } catch (error) {
    logger.error(`Connected wallets error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch connected wallets',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * POST /api/wallet-sync/sync-all
 * Sync all connected wallets
 */
router.post('/sync-all', async (req, res) => {
  try {
    const userId = req.userId;

    const syncResults = {
      id: `sync_all_${uuidv4()}`,
      userId,
      status: 'completed',
      startedAt: new Date(Date.now() - 30000).toISOString(),
      completedAt: new Date().toISOString(),
      totalWallets: 4,
      successfulSyncs: 4,
      failedSyncs: 0,
      results: [
        {
          source: 'Binance',
          status: 'success',
          walletsImported: 5,
          balanceUpdated: '15.5 BNB',
          syncTime: '1.2s'
        },
        {
          source: 'Trust Wallet',
          status: 'success',
          walletsImported: 3,
          balanceUpdated: '8.25 ETH',
          syncTime: '0.8s'
        },
        {
          source: 'MetaMask',
          status: 'success',
          walletsImported: 2,
          balanceUpdated: '12.75 ETH',
          syncTime: '0.9s'
        },
        {
          source: 'Coinbase',
          status: 'success',
          walletsImported: 4,
          balanceUpdated: '5.5 BTC',
          syncTime: '1.5s'
        }
      ],
      totalBalanceBefore: '38.0 BTC',
      totalBalanceAfter: '42.05 BTC',
      newWalletsAdded: 14
    };

    logger.info(`All wallets synced for user: ${userId}`);

    res.status(200).json({
      status: 'success',
      data: syncResults,
      message: 'All wallets synced successfully'
    });
  } catch (error) {
    logger.error(`Sync all error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Sync all failed',
      code: 'SYNC_ERROR'
    });
  }
});

/**
 * POST /api/wallet-sync/sync/:source
 * Sync specific wallet source
 */
router.post('/sync/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const userId = req.userId;

    const syncResult = {
      id: `sync_${uuidv4()}`,
      userId,
      source,
      status: 'success',
      startedAt: new Date(Date.now() - 15000).toISOString(),
      completedAt: new Date().toISOString(),
      walletsImported: Math.floor(Math.random() * 10) + 1,
      balanceUpdated: '10.5 ETH',
      transactionsImported: Math.floor(Math.random() * 50) + 1,
      newTransactions: Math.floor(Math.random() * 5),
      syncTime: (Math.random() * 2 + 0.5).toFixed(1) + 's'
    };

    logger.info(`${source} wallet synced for user: ${userId}`);

    res.status(200).json({
      status: 'success',
      data: syncResult,
      message: `${source} wallet synced successfully`
    });
  } catch (error) {
    logger.error(`Sync error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Sync failed',
      code: 'SYNC_ERROR'
    });
  }
});

/**
 * GET /api/wallet-sync/history
 * Get sync history
 */
router.get('/history', async (req, res) => {
  try {
    const history = [
      {
        id: 'hist_1',
        source: 'Binance',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        status: 'success',
        walletsCount: 5,
        transactionsCount: 12
      },
      {
        id: 'hist_2',
        source: 'Trust Wallet',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'success',
        walletsCount: 3,
        transactionsCount: 8
      },
      {
        id: 'hist_3',
        source: 'MetaMask',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'success',
        walletsCount: 2,
        transactionsCount: 15
      },
      {
        id: 'hist_4',
        source: 'All Wallets',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        status: 'success',
        walletsCount: 14,
        transactionsCount: 38
      }
    ];

    res.status(200).json({
      status: 'success',
      data: history,
      message: 'Sync history retrieved'
    });
  } catch (error) {
    logger.error(`History fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch history',
      code: 'FETCH_ERROR'
    });
  }
});

/**
 * DELETE /api/wallet-sync/:connectionId
 * Remove wallet connection
 */
router.delete('/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;
    const userId = req.userId;

    logger.info(`Wallet connection removed: ${connectionId} for user: ${userId}`);

    res.status(200).json({
      status: 'success',
      message: 'Wallet connection removed successfully'
    });
  } catch (error) {
    logger.error(`Removal error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove connection',
      code: 'REMOVAL_ERROR'
    });
  }
});

// Helper functions to fetch from external sources
async function fetchBinanceWallets(apiKey, apiSecret) {
  try {
    // In production, use actual Binance API
    // const response = await axios.get('https://api.binance.com/api/v3/account', {...});
    return {
      balance: '15.5',
      address: 'bnb1234567890',
      walletCount: 5
    };
  } catch (error) {
    logger.error(`Binance fetch error: ${error.message}`);
    throw error;
  }
}

async function fetchCoinbaseWallets(apiKey, apiSecret) {
  try {
    return {
      balance: '5.5',
      address: 'cb_wallet_xxx',
      walletCount: 4
    };
  } catch (error) {
    logger.error(`Coinbase fetch error: ${error.message}`);
    throw error;
  }
}

async function fetchKrakenWallets(apiKey, apiSecret) {
  try {
    return {
      balance: '10.25',
      address: 'kraken_wallet_xxx',
      walletCount: 3
    };
  } catch (error) {
    logger.error(`Kraken fetch error: ${error.message}`);
    throw error;
  }
}

async function fetchBlockchainWallet(address) {
  try {
    return {
      balance: '8.25',
      address: address,
      walletCount: 1
    };
  } catch (error) {
    logger.error(`Blockchain wallet fetch error: ${error.message}`);
    throw error;
  }
}

module.exports = router;
