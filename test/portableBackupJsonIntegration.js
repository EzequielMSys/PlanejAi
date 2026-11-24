// Explicit local integration test; creates and drops only its own random schemas.
require('dotenv').config();
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2/promise');
const config = require('../src/config/databaseOptions')();
const { exportBackup, restoreBackup } = require('../src/scripts/portableBackup');
const suffix = crypto.randomBytes(5).toString('hex');
const sourceName = `planejai_backup_source_${suffix}`;
const targetName = `planejai_restore_${suffix}`;
const file = path.resolve('backups', `integration-${suffix}.pnai`);

async function main() {
  if (!['localhost', '127.0.0.1'].includes(config.host)) throw new Error('O teste exige MySQL local.');
  const connection = await mysql.createConnection({ ...config, database: undefined });
  try {
    await connection.query(`CREATE DATABASE \`${sourceName}\``);
    await connection.query(`CREATE DATABASE \`${targetName}\``);
    await connection.query(`CREATE TABLE \`${sourceName}\`.samples (id INT PRIMARY KEY, dados JSON NOT NULL, resumo JSON NOT NULL)`);
    const data = { title: 'Teste', steps: [1, { ok: true }] };
    await connection.query(`INSERT INTO \`${sourceName}\`.samples VALUES (1, ?, ?)`, [JSON.stringify(data), JSON.stringify({ count: 2 })]);
    const secret = crypto.randomBytes(32).toString('hex');
    const exported = await exportBackup({ ...config, database: sourceName }, file, secret);
    const restored = await restoreBackup({ ...config, database: targetName }, file, secret);
    assert.equal(exported.tables, 1); assert.equal(exported.rows, 1);
    assert.equal(restored.tables, 1); assert.equal(restored.rows, 1);
    const [[row]] = await connection.query(`SELECT dados, resumo FROM \`${targetName}\`.samples WHERE id=1`);
    assert.deepEqual(typeof row.dados === 'string' ? JSON.parse(row.dados) : row.dados, data);
    assert.deepEqual(typeof row.resumo === 'string' ? JSON.parse(row.resumo) : row.resumo, { count: 2 });
    console.log('Backup JSON local: exportação e restauração verificadas.');
  } finally {
    await connection.query(`DROP DATABASE IF EXISTS \`${targetName}\``);
    await connection.query(`DROP DATABASE IF EXISTS \`${sourceName}\``);
    await connection.end();
    await fs.rm(file, { force: true });
  }
}
main().catch(error => { console.error(error.code || error.message); process.exitCode = 1; });
