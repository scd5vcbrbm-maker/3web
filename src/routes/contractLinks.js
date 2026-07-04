/**
 * Contract Linking Routes
 * Link and manage contracts with encryption
 */

const express = require('express');
const router = express.Router();
const contractLinkController = require('../controllers/contractLinkController');
const { authenticateMasterKey } = require('../middleware/auth');

router.use(authenticateMasterKey);

// Initiate contract linking
router.post('/initiate', contractLinkController.initiateContractLink);

// Verify ownership
router.post('/:linkId/verify-ownership', contractLinkController.verifyOwnership);

// Complete linking
router.post('/:linkId/complete', contractLinkController.completeContractLink);

// Get all linked contracts
router.get('/', contractLinkController.getLinkedContracts);

// Get single contract link
router.get('/:linkId', contractLinkController.getContractLink);

// Update permissions
router.put('/:linkId/permissions', contractLinkController.updateContractPermissions);

// Create backup
router.post('/:linkId/backup', contractLinkController.createBackup);

module.exports = router;
