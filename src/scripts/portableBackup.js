// Cópia portátil criptografada. Nunca restaura sobre uma base da aplicação.
require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const mysql = require('mysql2/promise');
const options = require('../config/databaseOptions');

function key(value) {
  if (!/^[a-f0-9]{64}$/i.test(value || '')) throw new Error('BACKUP_ENCRYPTION_KEY precisa conter 64 caracteres hexadecimais. Guarde-a separada da cópia.');
  return Buffer.from(value, 'hex');
}
function seal(data, secret) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(secret), iv);
  const encrypted = Buffer.concat([cipher.update(zlib.gzipSync(JSON.stringify(data))), cipher.final()]);
  return Buffer.concat([Buffer.from('PNAI1'), iv, cipher.getAuthTag(), encrypted]);
}
function open(data, secret) {
  if (data.subarray(0, 5).toString() !== 'PNAI1') throw new Error('Formato de backup desconhecido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(secret), data.subarray(5, 17));
  decipher.setAuthTag(data.subarray(17, 33));
  const decoded = Buffer.concat([decipher.update(data.subarray(33)), decipher.final()]);
  return JSON.parse(zlib.gunzipSync(decoded).toString());
}
function assertRestoreTarget(config) {
  if (!/^planejai_restore_[a-z0-9_]+$/.test(config.database || '')) throw new Error('Restauração permitida apenas em uma base vazia com prefixo planejai_restore_.');
}
function identifier(value) { return `\`${String(value).replace(/`/g, '``')}\``; }
async function tables(connection) {
  const [rows] = await connection.query("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME");
  return rows.map(row => row.name);
}
async function exportBackup(sourceOptions, file, secret) {
  key(secret);
  const connection = await mysql.createConnection({ ...sourceOptions, dateStrings: true });
  try {
    await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
    await connection.query('START TRANSACTION WITH CONSISTENT SNAPSHOT');
    const dump = { version: 1, createdAt: new Date().toISOString(), tables: [] };
    for (const name of await tables(connection)) {
      const [[definition]] = await connection.query(`SHOW CREATE TABLE ${identifier(name)}`);
      const [rows, fields] = await connection.query(`SELECT * FROM ${identifier(name)}`);
      dump.tables.push({ name, sql: definition['Create Table'], columns: fields.map(field => field.name), rows });
    }
    await connection.commit();
    await fs.mkdir(path.dirname(path.resolve(file)), { recursive: true });
    const encoded = seal(dump, secret);
    await fs.writeFile(file, encoded, { flag: 'wx', mode: 0o600 });
    // Autentica e descomprime o arquivo realmente gravado.
    const verified = open(await fs.readFile(file), secret);
    return { createdAt: verified.createdAt, tables: verified.tables.length, rows: verified.tables.reduce((sum, table) => sum + table.rows.length, 0), bytes: encoded.length, sha256: crypto.createHash('sha256').update(encoded).digest('hex') };
  } finally { await connection.rollback().catch(() => {}); await connection.end(); }
}
async function restoreBackup(destinationOptions, file, secret) {
  assertRestoreTarget(destinationOptions);
  const dump = open(await fs.readFile(file), secret);
  if (dump.version !== 1 || !Array.isArray(dump.tables)) throw new Error('Conteúdo de backup inválido.');
  const connection = await mysql.createConnection({ ...destinationOptions, multipleStatements: false });
  try {
    if ((await tables(connection)).length) throw new Error('A base de verificação precisa estar vazia. Nenhuma tabela foi substituída.');
    // SHOW CREATE TABLE do Aiven usa aspas duplas quando ANSI_QUOTES está ativo.
    await connection.query("SET SESSION sql_mode = CONCAT(@@sql_mode, ',ANSI_QUOTES')");
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    let rows = 0;
    for (const table of dump.tables) {
      try { await connection.query(table.sql); } catch (error) { error.message = `Estrutura de ${table.name}: ${error.message}`; throw error; }
      for (let index = 0; index < table.rows.length; index += 250) {
        const values = table.rows.slice(index, index + 250).map(row => table.columns.map(column => {
          const value = row[column];
          return value?.type === 'Buffer' && Array.isArray(value.data) ? Buffer.from(value.data) : value;
        }));
        await connection.query(`INSERT INTO ${identifier(table.name)} (${table.columns.map(identifier).join(',')}) VALUES ?`, [values]);
      }
      const [[count]] = await connection.query(`SELECT COUNT(*) AS total FROM ${identifier(table.name)}`);
      if (Number(count.total) !== table.rows.length) throw new Error('Contagem divergente após restauração.');
      rows += table.rows.length;
    }
    return { tables: dump.tables.length, rows, restoredAt: new Date().toISOString(), verified: 'table_row_counts' };
  } finally { await connection.query('SET FOREIGN_KEY_CHECKS = 1').catch(() => {}); await connection.end(); }
}
module.exports = { seal, open, assertRestoreTarget, exportBackup, restoreBackup };
if (require.main === module) {
  const [command, file] = process.argv.slice(2);
  const run = async () => {
    if (!file || !['export', 'restore'].includes(command)) throw new Error('Uso: node src/scripts/portableBackup.js export|restore caminho.pnai');
    const config = command === 'restore' ? options.fromDatabaseUrl(process.env.RESTORE_DATABASE_URL || '') : options();
    const result = await (command === 'restore' ? restoreBackup : exportBackup)(config, file, process.env.BACKUP_ENCRYPTION_KEY);
    console.log(JSON.stringify(result));
  };
  run().catch(error => { console.error('[BACKUP] Operação não concluída:', error.code || error.message); process.exitCode = 1; });
}
