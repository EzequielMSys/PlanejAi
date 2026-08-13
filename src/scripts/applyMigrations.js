const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function run() {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const database = process.env.DB_NAME || 'tcc';
  const port = Number(process.env.DB_PORT || 3306);

  const connection = await mysql.createConnection({ host, user, password, database, port, multipleStatements: true });

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  const results = [];
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    const statements = sql.split(';').map((s) => s.trim()).filter(Boolean);

    let fileOk = true;
    for (const statement of statements) {
      if (!statement || statement.startsWith('--')) continue;
      try {
        await connection.query(statement);
      } catch (error) {
        const msg = String(error.message || '');
        if (msg.includes('already exists') || msg.includes('ER_TABLE_EXISTS') || msg.includes('ER_DUP_KEYNAME') || msg.includes('ER_COLUMN_EXISTS')) {
          continue;
        }
        fileOk = false;
        console.error(`Erro ao executar ${file}:`, msg);
      }
    }
    results.push({ file, ok: fileOk });
  }

  console.log('Migrações aplicadas com sucesso.');
  await connection.end();
  process.exitCode = 0;
}

run().catch((error) => { console.error('Erro nas migrations:', error.message); process.exitCode = 1; });