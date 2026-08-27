const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { isAlreadyAppliedError, readStatements, sortMigrations } = require('./migrationUtils');
const getDatabaseOptions = require('../config/databaseOptions');

async function garantirTabelas() {
  const options = getDatabaseOptions({ multipleStatements: true });
  let connection;
  try {
    connection = await mysql.createConnection(options);
  } catch (error) {
    if (error.code !== 'ER_BAD_DB_ERROR') throw error;
    const database = String(options.database || '');
    if (!/^[A-Za-z0-9_]+$/.test(database)) {
      throw new Error('Nome de banco inválido para criação automática.');
    }
    const { database: ignored, ...serverOptions } = options;
    const serverConnection = await mysql.createConnection(serverOptions);
    try {
      await serverConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } finally {
      await serverConnection.end();
    }
    connection = await mysql.createConnection(options);
  }
  let lockObtained = false;

  try {
    const [[lock]] = await connection.query(
      "SELECT GET_LOCK('planejai_schema_migrations', 30) AS acquired"
    );
    lockObtained = Number(lock.acquired) === 1;
    if (!lockObtained) {
      throw new Error('Não foi possível obter o bloqueio para preparar o banco de dados.');
    }

    // Uma lista fixa não comprova que o schema está atualizado. Uma base antiga
    // pode conter as tabelas iniciais e ainda não possuir os recursos novos.
    const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
    const files = sortMigrations(
      fs.readdirSync(migrationsDir).filter((file) => file.endsWith('.sql'))
    );

    await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      nome VARCHAR(255) PRIMARY KEY,
      hash_sha256 CHAR(64) NOT NULL,
      aplicada_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      duracao_ms INT UNSIGNED NOT NULL DEFAULT 0
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
    const [appliedRows] = await connection.query(
      'SELECT nome, hash_sha256 FROM schema_migrations'
    );
    const applied = new Map(appliedRows.map((row) => [row.nome, row.hash_sha256]));

    let migrationFailed = false;
    let appliedNow = 0;
    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const contents = fs.readFileSync(filePath, 'utf8');
      const hash = crypto.createHash('sha256').update(contents).digest('hex');
      if (applied.has(file)) {
        if (applied.get(file) !== hash) {
          throw new Error(`A migration já aplicada foi alterada: ${file}`);
        }
        continue;
      }

      const startedAt = Date.now();
      const statements = readStatements(filePath);
      let fileFailed = false;
      for (const statement of statements) {
        try {
          await connection.query(statement);
        } catch (error) {
          if (isAlreadyAppliedError(error)) continue;
          migrationFailed = true;
          fileFailed = true;
          console.error(`[MIGRATION] Erro em ${file}:`, error.message);
        }
      }
      if (!fileFailed) {
        await connection.execute(
          'INSERT INTO schema_migrations (nome, hash_sha256, duracao_ms) VALUES (?, ?, ?)',
          [file, hash, Date.now() - startedAt]
        );
        appliedNow += 1;
      }
    }

    if (migrationFailed) {
      throw new Error('Uma ou mais migrations não puderam ser aplicadas.');
    }
    console.log(`[MIGRATION] Banco preparado: ${appliedNow} novas, ${files.length - appliedNow} já aplicadas.`);
  } finally {
    if (lockObtained) {
      await connection.query("SELECT RELEASE_LOCK('planejai_schema_migrations')");
    }
    await connection.end();
  }
}

module.exports = garantirTabelas;
