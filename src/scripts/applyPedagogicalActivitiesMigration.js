require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const sql = fs.readFileSync(path.join(__dirname, '../../migrations/add_pedagogical_activities.sql'), 'utf8');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tcc',
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  });
  try {
    await connection.query(sql);
    console.log('Migração de atividades pedagógicas aplicada com sucesso.');
  } finally {
    await connection.end();
  }
}

run().catch((error) => { console.error('Erro ao aplicar migração de atividades:', error.message); process.exitCode = 1; });
