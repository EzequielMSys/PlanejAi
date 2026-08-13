require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const connection = await mysql.createConnection({ host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 3306, user: process.env.DB_USER || 'root', password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'tcc', multipleStatements: true });
  try { await connection.query(fs.readFileSync(path.join(__dirname, '../../migrations/add_content_materials.sql'), 'utf8')); console.log('Migração de materiais aplicada com sucesso.'); } finally { await connection.end(); }
}
run().catch((error) => { console.error('Erro ao aplicar migração de materiais:', error.message); process.exitCode = 1; });
