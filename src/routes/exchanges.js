const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * POST /api/exchanges/buy-card
 * Purchase prepaid cards (Binance, Visa, etc.)
 */
router.post('/buy-card', async (req, res) => {
  try {
    const { cardType, amount, currency = 'USD', paymentMethod = 'crypto' } = req.body;
    const userId = req.userId;

    // Supported card types
    const supportedCards = [
      'binance_card', 'visa_debit', 'mastercard_debit', 
      'crypto_visa', 'payoneer_card', 'wise_card'
    ];

    if (!supportedCards.includes(cardType)) {
      return res.status(400).json({
        status: 'error',
        message: `Card type not supported. Supported: ${supportedCards.join(', ')}`,
        code: 'INVALID_CARD_TYPE'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid amount',
        code: 'INVALID_AMOUNT'
      });
    }

    const cardOrder = {
      id: `card_${uuidv4()}`,
      userId,
      cardType,
      amount,
      currency,
      paymentMethod,
      status: 'pending_payment',
      cardNumber: `****-****-****-${Math.random().toString().substring(2, 6)}`,
      expiryDate: '12/26',
      cvv: '[ENCRYPTED]',
      fees: (amount * 0.02).toFixed(2),
      totalAmount: (amount * 1.02).toFixed(2),
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    logger.info(`Card purchase initiated: ${cardType} - ${amount} ${currency}`);

    res.status(201).json({
      status: 'success',
      data: cardOrder,
      message: 'Card purchase order created'
    });
  } catch (error) {
    logger.error(`Card purchase error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Card purchase failed',
      code: 'CARD_ERROR'
    });
  }
});

/**
 * GET /api/exchanges/cards
 * List all purchased cards
 */
router.get('/cards', async (req, res) => {
  try {
    const userId = req.userId;

    const cards = [
      {
        id: 'card_1',
        userId,
        cardType: 'binance_card',
        amount: 500,
        currency: 'USD',
        balance: 450,
        status: 'active',
        cardNumber: '****-****-****-1234',
        expiryDate: '12/26',
        created_at: new Date().toISOString()
      },
      {
        id: 'card_2',
        userId,
        cardType: 'crypto_visa',
        amount: 1000,
        currency: 'USD',
        balance: 250,
        status: 'active',
        cardNumber: '****-****-****-5678',
        expiryDate: '06/27',
        created_at: new Date().toISOString()
      }
    ];

    res.status(200).json({
      status: 'success',
      data: cards,
      total: cards.length,
      message: 'Cards retrieved successfully'
    });
  } catch (error) {
    logger.error(`Cards fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch cards',
      code: 'CARD_ERROR'
    });
  }
});

/**
 * POST /api/exchanges/trade
 * Trade cryptocurrencies on major exchanges
 */
router.post('/trade', async (req, res) => {
  try {
    const { exchange = 'binance', fromToken, toToken, amount } = req.body;
    const userId = req.userId;

    // Supported exchanges
    const supportedExchanges = ['binance', 'coinbase', 'kraken', 'huobi', 'kucoin', 'bybit'];

    if (!supportedExchanges.includes(exchange)) {
      return res.status(400).json({
        status: 'error',
        message: `Exchange not supported. Supported: ${supportedExchanges.join(', ')}`,
        code: 'INVALID_EXCHANGE'
      });
    }

    // Mock trade execution
    const trade = {
      id: `trade_${uuidv4()}`,
      userId,
      exchange,
      fromToken,
      toToken,
      amount,
      rate: Math.random() * 50000, // Mock rate
      receiveAmount: (amount * Math.random() * 50000).toFixed(8),
      status: 'completed',
      fee: (amount * 0.001).toFixed(8),
      hash: `0x${uuidv4().replace(/-/g, '').substring(0, 64)}`,
      created_at: new Date().toISOString()
    };

    logger.info(`Trade executed: ${amount} ${fromToken} to ${toToken} on ${exchange}`);

    res.status(201).json({
      status: 'success',
      data: trade,
      message: 'Trade executed successfully'
    });
  } catch (error) {
    logger.error(`Trade error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Trade failed',
      code: 'TRADE_ERROR'
    });
  }
});

/**
 * GET /api/exchanges/rates
 * Get real-time exchange rates
 */
router.get('/rates', async (req, res) => {
  try {
    const { pairs = ['BTC/USD', 'ETH/USD', 'BNB/USD'] } = req.query;

    const rates = [
      { pair: 'BTC/USD', price: 37500.50, change24h: 2.5, volume: '28.5B' },
      { pair: 'ETH/USD', price: 1875.25, change24h: -1.2, volume: '14.2B' },
      { pair: 'BNB/USD', price: 612.80, change24h: 3.1, volume: '1.8B' },
      { pair: 'SOL/USD', price: 125.50, change24h: -0.5, volume: '890M' },
      { pair: 'XRP/USD', price: 2.45, change24h: 1.8, volume: '1.2B' },
      { pair: 'ADA/USD', price: 0.95, change24h: -2.3, volume: '380M' }
    ];

    res.status(200).json({
      status: 'success',
      data: rates,
      timestamp: new Date().toISOString(),
      message: 'Exchange rates retrieved'
    });
  } catch (error) {
    logger.error(`Rates fetch error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch rates',
      code: 'RATES_ERROR'
    });
  }
});

/**
 * GET /api/exchanges/market
 * Get global market data
 */
router.get('/market', async (req, res) => {
  try {
    const marketData = {
      globalMarketCap: '1.25T',
      btcDominance: '47.8%',
      ethDominance: '18.2%',
      top24hGainers: [
        { symbol: 'DOGE', change: '+15.2%' },
        { symbol: 'XRP', change: '+12.5%' },
        { symbol: 'SOL', change: '+8.3%' }
      ],
      top24hLosers: [
        { symbol: 'SHIB', change: '-8.2%' },
        { symbol: 'PEPE', change: '-5.1%' },
        { symbol: 'FLOKI', change: '-3.7%' }
      ],
      totalVolume24h: '75.2B',
      fearGreedIndex: 65,
      timestamp: new Date().toISOString()
    };

    res.status(200).json({
      status: 'success',
      data: marketData,
      message: 'Market data retrieved'
    });
  } catch (error) {
    logger.error(`Market data error: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch market data',
      code: 'MARKET_ERROR'
    });
  }
});

module.exports = router;
