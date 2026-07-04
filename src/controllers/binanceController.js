/**
 * Binance Integration Controller
 */

const axios = require('axios');
const BinanceIntegration = require('../models/BinanceIntegration');
const securityManager = require('../utils/securityManager');

const BINANCE_API_URL = 'https://api.binance.com';

// Setup Binance integration
exports.setupBinanceIntegration = async (req, res) => {
  try {
    const { userId } = req.user;
    const { binanceApiKey, binanceApiSecret } = req.body;

    if (!binanceApiKey || !binanceApiSecret) {
      return res.status(400).json({
        success: false,
        error: 'binanceApiKey and binanceApiSecret are required'
      });
    }

    // Verify API keys by making a test request
    try {
      await axios.get(`${BINANCE_API_URL}/api/v3/account`, {
        headers: {
          'X-MBX-APIKEY': binanceApiKey
        }
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Binance API credentials'
      });
    }

    // Encrypt API secret
    const encrypted = securityManager.encryptAES256(
      binanceApiSecret,
      process.env.MASTER_KEY_SECRET
    );

    let integration = await BinanceIntegration.findOne({ userId });

    if (!integration) {
      integration = new BinanceIntegration({
        userId,
        binanceApiKey,
        binanceApiSecret: encrypted,
        settings: {
          autoSync: true,
          syncInterval: 3600, // 1 hour
          enablePriceUpdates: true,
          enableTransactionTracking: true
        }
      });
    } else {
      integration.binanceApiKey = binanceApiKey;
      integration.binanceApiSecret = encrypted;
    }

    integration.auditLog.push({
      action: 'BINANCE_SETUP',
      timestamp: new Date(),
      details: 'Binance integration setup'
    });

    await integration.save();

    res.json({
      success: true,
      message: 'Binance integration setup successfully',
      data: {
        integrationId: integration._id,
        binanceApiKey,
        autoSync: integration.settings.autoSync,
        syncInterval: integration.settings.syncInterval,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Get Binance account info
exports.getBinanceAccountInfo = async (req, res) => {
  try {
    const { userId } = req.user;

    const integration = await BinanceIntegration.findOne({ userId });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Binance integration not configured'
      });
    }

    // Get account info
    const response = await axios.get(`${BINANCE_API_URL}/api/v3/account`, {
      headers: {
        'X-MBX-APIKEY': integration.binanceApiKey
      }
    });

    res.json({
      success: true,
      accountInfo: response.data,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Transfer by address or ID
exports.binanceTransfer = async (req, res) => {
  try {
    const { userId } = req.user;
    const { type, value, amount, coin } = req.body; // type: 'address' or 'id'

    if (!type || !value || !amount || !coin) {
      return res.status(400).json({
        success: false,
        error: 'type, value, amount, and coin are required'
      });
    }

    const integration = await BinanceIntegration.findOne({ userId });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Binance integration not configured'
      });
    }

    let transferData = {
      coin,
      amount,
      timestamp: Date.now()
    };

    if (type === 'address') {
      transferData.address = value;
    } else if (type === 'id') {
      transferData.toUid = value;
    }

    // Make withdrawal or transfer request
    try {
      const response = await axios.post(
        `${BINANCE_API_URL}/sapi/v1/capital/withdraw/apply`,
        transferData,
        {
          headers: {
            'X-MBX-APIKEY': integration.binanceApiKey
          }
        }
      );

      res.json({
        success: true,
        message: 'Transfer initiated successfully',
        data: {
          transferId: response.data.id,
          coin,
          amount,
          recipient: type === 'address' ? value : `UID: ${value}`,
          status: 'PENDING',
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: `Binance transfer failed: ${err.response?.data?.msg || err.message}`
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Link wallet to Binance
exports.linkWalletToBinance = async (req, res) => {
  try {
    const { userId } = req.user;
    const { walletAddress, binanceUserId } = req.body;

    if (!walletAddress || !binanceUserId) {
      return res.status(400).json({
        success: false,
        error: 'walletAddress and binanceUserId are required'
      });
    }

    const integration = await BinanceIntegration.findOne({ userId });
    if (!integration) {
      return res.status(404).json({
        success: false,
        error: 'Binance integration not configured'
      });
    }

    // Add wallet mapping
    integration.walletMappings.push({
      walletAddress,
      binanceUserId,
      syncedAt: new Date()
    });

    await integration.save();

    res.json({
      success: true,
      message: 'Wallet linked to Binance successfully',
      data: {
        walletAddress,
        binanceUserId,
        linkedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
