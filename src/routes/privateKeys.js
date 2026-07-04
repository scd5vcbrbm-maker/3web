/**
 * Private Key Settings Routes
 * Secure management of private keys
 */

const express = require('express');
const router = express.Router();
const privateKeyController = require('../controllers/privateKeyController');
const { authenticateMasterKey } = require('../middleware/auth');

router.use(authenticateMasterKey);

// Add new private key
router.post('/', privateKeyController.addPrivateKey);

// Get all keys
router.get('/', privateKeyController.getAllKeys);

// Get key info
router.get('/:keyId', privateKeyController.getKeyInfo);

// Update key permissions
router.put('/:keyId/permissions', privateKeyController.updateKeyPermissions);

// Deactivate key
router.post('/:keyId/deactivate', privateKeyController.deactivateKey);

// Get audit log
router.get('/:keyId/audit-log', privateKeyController.getAuditLog);

// Delete key (requires confirmation)
router.delete('/:keyId', privateKeyController.deleteKey);

module.exports = router;
