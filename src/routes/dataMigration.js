/**
 * Data Migration Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const dataMigrationController = require('../controllers/dataMigrationController');
const { authenticateMasterKey } = require('../middleware/auth');

const upload = multer({ dest: '/tmp/uploads/' });

router.use(authenticateMasterKey);

// Register local database
router.post('/databases/register', dataMigrationController.registerLocalDatabase);

// Get all local databases
router.get('/databases', dataMigrationController.getLocalDatabases);

// Upload CSV
router.post('/upload/csv', upload.single('file'), dataMigrationController.uploadCSVData);

// Upload JSON
router.post('/upload/json', upload.single('file'), dataMigrationController.uploadJSONData);

// Upload Excel
router.post('/upload/excel', upload.single('file'), dataMigrationController.uploadExcelData);

// Get migration history
router.get('/history', dataMigrationController.getMigrationHistory);

// Backup database
router.post('/databases/:dbId/backup', dataMigrationController.backupDatabase);

module.exports = router;
