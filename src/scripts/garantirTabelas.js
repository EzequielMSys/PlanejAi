const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { isAlreadyAppliedError, readStatements, sortMigrations } = require('./migrationUtils');
const getDatabaseOptions = require('../config/databaseOptions');

async function garantirTabelas() {
  const connection = await mysql.createConnection(getDatabaseOptions({ multipleStatements: true }));

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
  const files = sortMigrations(
    fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
  );

  let migrationFailed = false;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const statements = readStatements(filePath);

    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (error) {
        const msg = String(error.message || '');
        if (isAlreadyAppliedError(error)) {
          continue;
        }
        migrationFailed = true;
        console.error(`[MIGRATION] Erro em ${file}:`, msg);
      }
    }
  }

  if (migrationFailed) {
    await connection.end();
    throw new Error('Uma ou mais migrations não puderam ser aplicadas.');
  }

  console.log('[MIGRATION] Migrations aplicadas com sucesso.');
  await connection.end();
}

module.exports = garantirTabelas;
