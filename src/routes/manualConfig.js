/**
 * Manual Configuration Routes
 */

const express = require('express');
const router = express.Router();
const manualConfigController = require('../controllers/manualConfigController');
const apiKeyController = require('../controllers/apiKeyController');
const binanceController = require('../controllers/binanceController');
const { authenticateMasterKey } = require('../middleware/auth');

router.use(authenticateMasterKey);

// Manual Configuration
router.post('/wallet/manual', manualConfigController.addManualWallet);
router.post('/contract/manual', manualConfigController.addManualContract);
router.post('/key/manual', manualConfigController.addManualEncryptionKey);
router.get('/entries', manualConfigController.getManualEntries);

// API Key Management
router.post('/api-keys/generate', apiKeyController.generateAPIKey);
router.get('/api-keys', apiKeyController.getAllAPIKeys);
router.post('/api-keys/:keyId/rotate', apiKeyController.rotateAPIKey);
router.post('/api-keys/:keyId/disable', apiKeyController.disableAPIKey);

// Binance Integration
router.post('/binance/setup', binanceController.setupBinanceIntegration);
router.get('/binance/account-info', binanceController.getBinanceAccountInfo);
router.post('/binance/transfer', binanceController.binanceTransfer);
router.post('/binance/link-wallet', binanceController.linkWalletToBinance);

module.exports = router;
