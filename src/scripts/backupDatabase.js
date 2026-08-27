require('dotenv').config();
const mysql = require('mysql2/promise');
const getDatabaseOptions = require('../config/databaseOptions');

function identity(options) {
  return `${options.host}:${options.port || 3306}/${options.database}`.toLowerCase();
}

async function listTables(connection) {
  const [rows] = await connection.query(
    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME"
  );
  return rows.map((row) => row.TABLE_NAME);
}

function temporaryTableName(table) {
  return `__planejai_next_${table}`
}

function previousTableName(table) {
  return `__planejai_previous_${table}`
}

async function copyTable(source, destination, table, target = table) {
  const [[definition]] = await source.query(`SHOW CREATE TABLE \`${table}\``);
  const createSql = definition['Create Table'].replace(/^CREATE TABLE `[^`]+`/, `CREATE TABLE \`${target}\``);
  await destination.query(createSql);

  const [rows, fields] = await source.query(`SELECT * FROM \`${table}\``);
  if (rows.length === 0) return 0;

  const columns = fields.map((field) => `\`${field.name}\``).join(', ');
  const batchSize = 250;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const values = batch.map((row) => fields.map((field) => row[field.name]));
    await destination.query(
      `INSERT INTO \`${target}\` (${columns}) VALUES ?`,
      [values]
    );
  }
  return rows.length;
}

async function backupDatabase() {
  if (!process.env.BACKUP_DATABASE_URL) {
    throw new Error('BACKUP_DATABASE_URL não foi configurada.');
  }

  const sourceOptions = getDatabaseOptions({ multipleStatements: true });
  const destinationOptions = getDatabaseOptions.fromDatabaseUrl(process.env.BACKUP_DATABASE_URL);
  if (identity(sourceOptions) === identity(destinationOptions)) {
    throw new Error('O banco de backup não pode ser o mesmo banco principal.');
  }

  const source = await mysql.createConnection(sourceOptions);
  const destination = await mysql.createConnection({ ...destinationOptions, multipleStatements: true });

  try {
    await source.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await source.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    const sourceTables = await listTables(source);
    const destinationTables = await listTables(destination);

    if (destinationTables.length > 0 && process.env.BACKUP_ALLOW_REPLACE !== 'true') {
      throw new Error(
        'O banco de backup já possui tabelas. Defina BACKUP_ALLOW_REPLACE=true para substituí-las.'
      );
    }

    await destination.query('SET FOREIGN_KEY_CHECKS = 0');
    const staleTables = destinationTables.filter((table) => table.startsWith('__planejai_'))
    for (const table of staleTables) await destination.query(`DROP TABLE \`${table}\``)

    let totalRows = 0;
    const expectedRows = new Map();
    for (const table of sourceTables) {
      const copied = await copyTable(source, destination, table, temporaryTableName(table));
      expectedRows.set(table, copied);
      totalRows += copied;
    }
    for (const table of sourceTables) {
      const [[count]] = await destination.query(`SELECT COUNT(*) AS total FROM \`${temporaryTableName(table)}\``);
      if (Number(count.total) !== expectedRows.get(table)) {
        throw new Error(`A verificação do backup encontrou divergência na tabela ${table}.`);
      }
    }

    const currentTables = destinationTables.filter((table) => !table.startsWith('__planejai_'))
    const renames = []
    for (const table of currentTables) renames.push(`\`${table}\` TO \`${previousTableName(table)}\``)
    for (const table of sourceTables) renames.push(`\`${temporaryTableName(table)}\` TO \`${table}\``)
    if (renames.length) await destination.query(`RENAME TABLE ${renames.join(', ')}`)
    for (const table of currentTables.reverse()) await destination.query(`DROP TABLE \`${previousTableName(table)}\``)
    await destination.query('SET FOREIGN_KEY_CHECKS = 1');

    const copiedTables = sourceTables;

    await source.commit();
    console.log(`[BACKUP] ${copiedTables.length} tabelas e ${totalRows} registros copiados.`);
    return { tables: copiedTables.length, rows: totalRows };
  } finally {
    await source.rollback().catch(() => {});
    await destination.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    await Promise.allSettled([source.end(), destination.end()]);
  }
}

module.exports = { backupDatabase, identity, temporaryTableName, previousTableName };

if (require.main === module) {
  backupDatabase().catch((error) => {
    console.error('[BACKUP] Falha:', error.message);
    process.exitCode = 1;
  });
}
