// Converts a verified, encrypted PlanejAI snapshot to a local MySQL SQL dump.
// The output contains personal data in plaintext; keep it outside Git.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const mysql = require('mysql2');
const { open } = require('./portableBackup');

function identifier(value) {
  if (typeof value !== 'string' || !value || value.includes('\0')) throw new Error('Identificador SQL inválido.');
  return `\`${value.replace(/`/g, '``')}\``;
}

function sqlValue(value) {
  if (value === null) return 'NULL';
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) return `X'${Buffer.from(value.data).toString('hex')}'`;
  if (typeof value === 'object') return mysql.escape(JSON.stringify(value));
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Número SQL inválido.');
  if (typeof value === 'undefined') throw new Error('Coluna ausente no backup.');
  return mysql.escape(value);
}

function renderSql(dump, sourceDatabase) {
  assert.equal(dump.version, 1);
  assert.ok(Array.isArray(dump.tables));
  const lines = [
    '-- PlanejAI: cópia MySQL com dados pessoais. Mantenha este arquivo privado.',
    `-- Banco de origem: ${sourceDatabase}; captura UTC: ${dump.createdAt}`,
    '-- Selecione um banco de destino vazio antes de importar. Este arquivo não cria nem apaga bancos.',
    'SET NAMES utf8mb4;',
    "SET SESSION sql_mode = 'ANSI_QUOTES';",
    'SET FOREIGN_KEY_CHECKS = 0;',
    ''
  ];
  let totalRows = 0;
  for (const table of dump.tables) {
    identifier(table.name);
    assert.equal(typeof table.sql, 'string');
    assert.ok(/^CREATE TABLE\s/i.test(table.sql), `Estrutura inválida: ${table.name}`);
    assert.ok(Array.isArray(table.columns) && Array.isArray(table.rows));
    const columns = table.columns.map(identifier).join(', ');
    lines.push(`-- ${table.name}: ${table.rows.length} registros`);
    lines.push(`${table.sql.replace(/;\s*$/, '')};`);
    for (const row of table.rows) {
      const values = table.columns.map(column => sqlValue(row[column])).join(', ');
      lines.push(`INSERT INTO ${identifier(table.name)} (${columns}) VALUES (${values});`);
      totalRows += 1;
    }
    lines.push('');
  }
  lines.push('SET FOREIGN_KEY_CHECKS = 1;', '');
  return { sql: lines.join('\n'), tables: dump.tables.length, rows: totalRows };
}

async function convert(input, output, keyFile) {
  const encoded = await fs.readFile(input);
  const manifest = JSON.parse(await fs.readFile(path.join(path.dirname(input), 'manifest.json'), 'utf8'));
  const sha256 = crypto.createHash('sha256').update(encoded).digest('hex');
  assert.equal(sha256, manifest.sha256, 'Hash do backup não confere.');
  assert.equal(manifest.restoreVerified, true, 'Backup não passou pela restauração de teste.');
  assert.match(manifest.sourceDatabase, /^[a-zA-Z0-9_]+$/);
  const dump = open(encoded, (await fs.readFile(keyFile, 'utf8')).trim());
  const rendered = renderSql(dump, manifest.sourceDatabase);
  assert.equal(rendered.tables, manifest.tables);
  assert.equal(rendered.rows, manifest.rows);
  await fs.writeFile(output, rendered.sql, { flag: 'wx', mode: 0o600 });
  return { sourceDatabase: manifest.sourceDatabase, createdAt: dump.createdAt, tables: rendered.tables, rows: rendered.rows,
    bytes: Buffer.byteLength(rendered.sql), sha256: crypto.createHash('sha256').update(rendered.sql).digest('hex') };
}

module.exports = { sqlValue, renderSql, convert };
if (require.main === module) {
  const [input, output, keyFile] = process.argv.slice(2);
  if (!input || !output || !keyFile) {
    console.error('Uso: node src/scripts/portableBackupSql.js backup.pnai saida.sql chave.txt');
    process.exitCode = 1;
  } else {
    convert(input, output, keyFile).then(result => console.log(JSON.stringify(result))).catch(error => {
      console.error('[SQL BACKUP] Falha:', error.code || error.message);
      process.exitCode = 1;
    });
  }
}
