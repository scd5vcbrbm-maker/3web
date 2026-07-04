/**
 * Database Connection Manager
 * Support multiple database providers
 */

const mongoose = require('mongoose');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const admin = require('firebase-admin');

class DatabaseManager {
  constructor() {
    this.connections = {};
  }

  /**
   * Connect to MongoDB
   */
  async connectMongoDB(config) {
    try {
      const conn = await mongoose.connect(config.url, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      this.connections.mongodb = conn;
      console.log('✅ MongoDB connected');
      return conn;
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err.message);
      throw err;
    }
  }

  /**
   * Connect to PostgreSQL
   */
  async connectPostgreSQL(config) {
    try {
      const pool = new Pool({
        host: config.host,
        port: config.port || 5432,
        database: config.database,
        user: config.user,
        password: config.password
      });

      await pool.query('SELECT NOW()');
      this.connections.postgresql = pool;
      console.log('✅ PostgreSQL connected');
      return pool;
    } catch (err) {
      console.error('❌ PostgreSQL connection failed:', err.message);
      throw err;
    }
  }

  /**
   * Connect to MySQL
   */
  async connectMySQL(config) {
    try {
      const pool = mysql.createPool({
        host: config.host,
        port: config.port || 3306,
        database: config.database,
        user: config.user,
        password: config.password,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      this.connections.mysql = pool;
      console.log('✅ MySQL connected');
      return pool;
    } catch (err) {
      console.error('❌ MySQL connection failed:', err.message);
      throw err;
    }
  }

  /**
   * Connect to Firebase
   */
  async connectFirebase(config) {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(config.serviceAccount),
          databaseURL: config.databaseURL
        });
      }
      this.connections.firebase = admin.firestore();
      console.log('✅ Firebase connected');
      return this.connections.firebase;
    } catch (err) {
      console.error('❌ Firebase connection failed:', err.message);
      throw err;
    }
  }

  /**
   * Get connection by type
   */
  getConnection(type) {
    return this.connections[type.toLowerCase()];
  }

  /**
   * Get all connections
   */
  getAllConnections() {
    return this.connections;
  }

  /**
   * Close all connections
   */
  async closeAll() {
    try {
      if (this.connections.mongodb) {
        await mongoose.disconnect();
      }
      if (this.connections.postgresql) {
        await this.connections.postgresql.end();
      }
      if (this.connections.mysql) {
        await this.connections.mysql.end();
      }
      if (this.connections.firebase) {
        // Firebase doesn't need explicit closing
      }
      console.log('✅ All database connections closed');
    } catch (err) {
      console.error('❌ Error closing connections:', err.message);
    }
  }
}

module.exports = new DatabaseManager();
