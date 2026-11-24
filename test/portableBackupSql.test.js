const test = require('node:test');
const assert = require('node:assert/strict');
const { sqlValue, renderSql } = require('../src/scripts/portableBackupSql');

test('SQL de backup escapa texto, JSON e bytes sem alterar valores', () => {
  assert.equal(sqlValue(null), 'NULL');
  assert.equal(sqlValue({ type: 'Buffer', data: [0, 255] }), "X'00ff'");
  const jsonSql = sqlValue({ title: "O'Neil", items: [1, 2] });
  assert.ok(jsonSql.includes(String.raw`\"title\"`));
  assert.ok(jsonSql.includes(String.raw`O\'Neil`));
  assert.doesNotMatch(jsonSql, /title\s*=/);
  assert.match(sqlValue('linha\nseguinte'), /\\n/);
  assert.throws(() => sqlValue(undefined));
});

test('SQL contém estrutura e cada registro sem criar banco de dados', () => {
  const dump = { version: 1, createdAt: '2026-11-24T00:00:00Z', tables: [
    { name: 'exemplo', sql: 'CREATE TABLE `exemplo` (`id` int PRIMARY KEY, `dados` json)', columns: ['id', 'dados'], rows: [{ id: 1, dados: { ok: true } }, { id: 2, dados: [1, 2] }] }
  ] };
  const result = renderSql(dump, 'planejai_tcc_online');
  assert.equal(result.tables, 1); assert.equal(result.rows, 2);
  assert.equal((result.sql.match(/^INSERT INTO /gm) || []).length, 2);
  assert.match(result.sql, /SET FOREIGN_KEY_CHECKS = 0;/);
  assert.doesNotMatch(result.sql, /^(?:CREATE|DROP) DATABASE /m);
});
