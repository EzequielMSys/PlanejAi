const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function garantirTabelas() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'tcc';
  const port = Number(process.env.DB_PORT || 3306);

  const connection = await mysql.createConnection({ host, user, password, database, port, multipleStatements: true });

  const tabelasParaVerificar = ['avisos', 'conteudos', 'atividades', 'respostas_usuario', 'cronogramas', 'cronograma_dias', 'cronograma_conteudos'];
  const faltantes = [];

  for (const tabela of tabelasParaVerificar) {
    try {
      await connection.query(`SELECT 1 FROM ${tabela} LIMIT 1`);
    } catch {
      faltantes.push(tabela);
    }
  }

  if (faltantes.length === 0) {
    console.log('[MIGRATION] Tabelas base já existem. Nenhuma ação necessária.');
    await connection.end();
    return;
  }

  console.log('[MIGRATION] Tabelas faltantes detectadas:', faltantes.join(', '));
  console.log('[MIGRATION] Aplicando migrations automaticamente...');

  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);

    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue;
      try {
        await connection.query(statement);
      } catch (error) {
        const msg = String(error.message || '');
        if (msg.includes('already exists') || msg.includes('ER_TABLE_EXISTS') || msg.includes('ER_DUP_KEYNAME') || msg.includes('ER_COLUMN_EXISTS')) {
          continue;
        }
        console.error(`[MIGRATION] Erro em ${file}:`, msg);
      }
    }
  }

  console.log('[MIGRATION] Migrations aplicadas com sucesso.');
  await connection.end();
}

module.exports = garantirTabelas;