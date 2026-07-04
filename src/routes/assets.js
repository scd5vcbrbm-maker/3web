/**
 * Assets Routes
 * Complete asset management system
 */

const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const { authenticateMasterKey } = require('../middleware/auth');

// Middleware: Authenticate all routes
router.use(authenticateMasterKey);

// Asset Management
router.get('/', assetController.getAllAssets);
router.get('/:assetId', assetController.getAsset);
router.post('/', assetController.addAsset);
router.put('/:assetId', assetController.updateAsset);
router.delete('/:assetId', assetController.deleteAsset);

// Asset Balance and Info
router.get('/:contractAddress/balance/:ownerAddress', assetController.getAssetBalance);
router.get('/:assetId/transactions', assetController.getAssetTransactions);

// Token Operations
router.post('/:contractAddress/mint', assetController.mintTokens);
router.post('/:contractAddress/burn', assetController.burnTokens);
router.post('/:contractAddress/freeze', assetController.freezeAccount);

module.exports = router;
