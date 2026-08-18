require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { isAlreadyAppliedError, readStatements, sortMigrations } = require('./migrationUtils');
const getDatabaseOptions = require('../config/databaseOptions');

async function run() {
  const connection = await mysql.createConnection(getDatabaseOptions({ multipleStatements: true }));

  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  const files = sortMigrations(
    fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
  );

  const results = [];
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const statements = readStatements(filePath);

    let fileOk = true;
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (error) {
        const msg = String(error.message || '');
        if (isAlreadyAppliedError(error)) {
          continue;
        }
        fileOk = false;
        console.error(`Erro ao executar ${file}:`, msg);
      }
    }
    results.push({ file, ok: fileOk });
  }

  const failedFiles = results.filter(({ ok }) => !ok);
  if (failedFiles.length > 0) {
    await connection.end();
    throw new Error(`Falha ao aplicar ${failedFiles.length} arquivo(s) de migração.`);
  }

  console.log('Migrações aplicadas com sucesso.');
  await connection.end();
}

run().catch((error) => { console.error('Erro nas migrations:', error.message); process.exitCode = 1; });
