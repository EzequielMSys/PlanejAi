const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('chat history formats MySQL LIMIT values and returns chronological messages', async () => {
  const calls = [];
  const pool = {
    query: async (sql, params) => {
      calls.push({ sql, params });
      return [[{ role: 'assistant', conteudo: 'Resposta' }, { role: 'user', conteudo: 'Pergunta' }]];
    },
    execute: () => { throw new Error('MySQL 8.4 rejects a DOUBLE parameter for LIMIT'); },
  };
  const context = { module: { exports: {} }, require: key => {
    if (key === '../config/db') return pool;
    return require(require.resolve(key, { paths: [require('node:path').resolve(__dirname, '../src/models')] }));
  } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/models/inteligenciaModel'), 'utf8'), context);
  const model = context.module.exports;
  const rows = await model.listarMensagensChat(101, 12);
  assert.equal(rows[0].role, 'user');
  assert.equal(calls[0].params[0], 101);
  assert.equal(calls[0].params[1], 12);
  assert.match(calls[0].sql, /WHERE id_usuario = \?.*LIMIT \?/);
  for (const limit of [NaN, -1, 201, 'invalid']) {
    await model.listarMensagensChat(101, limit);
    assert.equal(calls.at(-1).params[1], 20);
  }
});
