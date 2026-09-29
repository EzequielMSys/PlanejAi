require('dotenv').config();
const mysql = require('mysql2/promise');
const getDatabaseOptions = require('./databaseOptions');

const pool = mysql.createPool(getDatabaseOptions({
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  maxIdle: Number(process.env.DB_MAX_IDLE || 10),
  idleTimeout: Number(process.env.DB_IDLE_TIMEOUT_MS || 60000),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT || 50),
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10000),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
}));
module.exports = pool;
