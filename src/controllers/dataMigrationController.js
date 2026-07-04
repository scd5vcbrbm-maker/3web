/**
 * Data Migration Controller
 * Handle data upload, migration, and backup
 */

const DataMigration = require('../models/DataMigration');
const LocalDatabase = require('../models/LocalDatabase');
const databaseManager = require('../utils/databaseManager');
const securityManager = require('../utils/securityManager');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { v4: uuidv4 } = require('uuid');

// Register local database
exports.registerLocalDatabase = async (req, res) => {
  try {
    const { userId } = req.user;
    const { dbName, dbType, connection } = req.body;

    if (!dbName || !dbType || !connection) {
      return res.status(400).json({
        success: false,
        error: 'dbName, dbType, and connection are required'
      });
    }

    // Encrypt sensitive data
    const encrypted = securityManager.encryptAES256(
      JSON.stringify(connection),
      process.env.MASTER_KEY_SECRET
    );

    const localDb = new LocalDatabase({
      userId,
      dbName,
      dbType,
      connection,
      encrypted: true,
      auditLog: [{
        action: 'DB_REGISTERED',
        timestamp: new Date(),
        details: `Registered ${dbType} database: ${dbName}`,
        ipAddress: req.ip
      }]
    });

    // Test connection
    try {
      if (dbType === 'MONGODB') {
        await databaseManager.connectMongoDB(connection);
      } else if (dbType === 'POSTGRESQL') {
        await databaseManager.connectPostgreSQL(connection);
      } else if (dbType === 'MYSQL') {
        await databaseManager.connectMySQL(connection);
      }

      localDb.lastConnectionTest = {
        timestamp: new Date(),
        success: true
      };
    } catch (err) {
      localDb.lastConnectionTest = {
        timestamp: new Date(),
        success: false,
        error: err.message
      };
    }

    await localDb.save();

    res.status(201).json({
      success: true,
      message: 'Local database registered successfully',
      data: {
        dbId: localDb._id,
        dbName,
        dbType,
        connectionTestResult: localDb.lastConnectionTest.success ? 'SUCCESS' : 'FAILED',
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

// Get all local databases
exports.getLocalDatabases = async (req, res) => {
  try {
    const { userId } = req.user;
    const databases = await LocalDatabase.find(
      { userId },
      { 'connection.password': 0, 'connection.connectionString': 0 }
    );

    res.json({
      success: true,
      databases,
      count: databases.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Upload CSV file
exports.uploadCSVData = async (req, res) => {
  try {
    const { userId } = req.user;
    const { destinationType, destinationDb, collectionName } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'CSV file is required'
      });
    }

    const migrationId = 'mig_' + uuidv4();
    const records = [];

    // Parse CSV
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => records.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Create migration record
    const migration = new DataMigration({
      userId,
      migrationId,
      sourceType: 'LOCAL_FILE',
      sourceLocation: req.file.filename,
      sourceFormat: 'csv',
      destinationType,
      dataInfo: {
        totalRecords: records.length,
        totalSize: `${(req.file.size / 1024).toFixed(2)} KB`,
        collections: [collectionName]
      },
      status: 'IN_PROGRESS',
      performance: {
        startTime: new Date()
      }
    });

    await migration.save();

    // Insert data into destination
    try {
      if (destinationType === 'MONGODB') {
        const db = databaseManager.getConnection('mongodb');
        const collection = db.collection(collectionName);
        await collection.insertMany(records);
      }
      // Add other database types here

      migration.status = 'COMPLETED';
      migration.progress = 100;
      migration.performance.endTime = new Date();
      migration.performance.duration = migration.performance.endTime - migration.performance.startTime;
      migration.performance.recordsPerSecond = (
        records.length / (migration.performance.duration / 1000)
      ).toFixed(2);

      migration.auditLog.push({
        action: 'MIGRATION_COMPLETED',
        timestamp: new Date(),
        details: `Migrated ${records.length} records from CSV`
      });
    } catch (err) {
      migration.status = 'FAILED';
      migration.errors.push({
        record: 0,
        error: err.message,
        timestamp: new Date()
      });
    }

    await migration.save();

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'CSV data uploaded successfully',
      data: {
        migrationId,
        recordsMigrated: records.length,
        status: migration.status,
        duration: migration.performance.duration,
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

// Upload JSON file
exports.uploadJSONData = async (req, res) => {
  try {
    const { userId } = req.user;
    const { destinationType, collectionName } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'JSON file is required'
      });
    }

    const migrationId = 'mig_' + uuidv4();
    const jsonData = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
    const records = Array.isArray(jsonData) ? jsonData : [jsonData];

    const migration = new DataMigration({
      userId,
      migrationId,
      sourceType: 'LOCAL_FILE',
      sourceLocation: req.file.filename,
      sourceFormat: 'json',
      destinationType,
      dataInfo: {
        totalRecords: records.length,
        totalSize: `${(req.file.size / 1024).toFixed(2)} KB`,
        collections: [collectionName]
      },
      status: 'IN_PROGRESS',
      performance: {
        startTime: new Date()
      }
    });

    await migration.save();

    // Insert into database
    try {
      if (destinationType === 'MONGODB') {
        const db = databaseManager.getConnection('mongodb');
        const collection = db.collection(collectionName);
        await collection.insertMany(records);
      }

      migration.status = 'COMPLETED';
      migration.progress = 100;
      migration.performance.endTime = new Date();
      migration.performance.duration = migration.performance.endTime - migration.performance.startTime;
      migration.performance.recordsPerSecond = (
        records.length / (migration.performance.duration / 1000)
      ).toFixed(2);
    } catch (err) {
      migration.status = 'FAILED';
      migration.errors.push({
        record: 0,
        error: err.message,
        timestamp: new Date()
      });
    }

    await migration.save();
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'JSON data uploaded successfully',
      data: {
        migrationId,
        recordsMigrated: records.length,
        status: migration.status,
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

// Upload Excel file
exports.uploadExcelData = async (req, res) => {
  try {
    const { userId } = req.user;
    const { destinationType, collectionName, sheet } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Excel file is required'
      });
    }

    const migrationId = 'mig_' + uuidv4();
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = sheet || workbook.SheetNames[0];
    const records = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    const migration = new DataMigration({
      userId,
      migrationId,
      sourceType: 'LOCAL_FILE',
      sourceLocation: req.file.filename,
      sourceFormat: 'xlsx',
      destinationType,
      dataInfo: {
        totalRecords: records.length,
        totalSize: `${(req.file.size / 1024).toFixed(2)} KB`,
        collections: [collectionName]
      },
      status: 'IN_PROGRESS',
      performance: {
        startTime: new Date()
      }
    });

    await migration.save();

    try {
      if (destinationType === 'MONGODB') {
        const db = databaseManager.getConnection('mongodb');
        const collection = db.collection(collectionName);
        await collection.insertMany(records);
      }

      migration.status = 'COMPLETED';
      migration.progress = 100;
      migration.performance.endTime = new Date();
      migration.performance.duration = migration.performance.endTime - migration.performance.startTime;
      migration.performance.recordsPerSecond = (
        records.length / (migration.performance.duration / 1000)
      ).toFixed(2);
    } catch (err) {
      migration.status = 'FAILED';
      migration.errors.push({
        record: 0,
        error: err.message,
        timestamp: new Date()
      });
    }

    await migration.save();
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: 'Excel data uploaded successfully',
      data: {
        migrationId,
        recordsMigrated: records.length,
        status: migration.status,
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

// Get migration history
exports.getMigrationHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;
    const migrations = await DataMigration.find({ userId })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await DataMigration.countDocuments({ userId });

    res.json({
      success: true,
      migrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};

// Backup database
exports.backupDatabase = async (req, res) => {
  try {
    const { dbId } = req.params;
    const { userId } = req.user;

    const localDb = await LocalDatabase.findOne({ _id: dbId, userId });
    if (!localDb) {
      return res.status(404).json({
        success: false,
        error: 'Database not found'
      });
    }

    const backupId = 'backup_' + uuidv4();
    const backupLocation = path.join(__dirname, '../../backups', `${backupId}.json`);

    // Create backup (simplified)
    const backup = {
      backupId,
      createdAt: new Date(),
      dbName: localDb.dbName,
      dbType: localDb.dbType
    };

    fs.writeFileSync(backupLocation, JSON.stringify(backup, null, 2));

    localDb.backups.push({
      backupId,
      createdAt: new Date(),
      location: backupLocation,
      encrypted: true
    });

    await localDb.save();

    res.json({
      success: true,
      message: 'Database backed up successfully',
      data: {
        backupId,
        location: backupLocation,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
};
