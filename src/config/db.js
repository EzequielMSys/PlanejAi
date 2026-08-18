require('dotenv').config();
const mysql = require('mysql2/promise');
const getDatabaseOptions = require('./databaseOptions');

const pool = mysql.createPool(getDatabaseOptions({
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}));
module.exports = pool;
