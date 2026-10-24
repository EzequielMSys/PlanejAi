const test = require('node:test');
const assert = require('node:assert/strict');
const { postpone } = require('../src/services/reviewPlanningService');
test('review postponement changes only its date and scopes the write to the owner and due review', async () => {
  let statement, values;
  const result = await postpone(8, 19, 3, { execute: async (sql, params) => { statement = sql; values = params; return [{ affectedRows: 1 }]; } });
  assert.equal(result.days, 3);
  assert.deepEqual(values, [3, 19, 8]);
  assert.match(statement, /id_revisao = \? AND id_usuario = \? AND proxima_revisao <= CURRENT_DATE/);
  assert.ok(!statement.includes('nivel_dominio ='));
  assert.ok(!statement.includes('ultimo_resultado ='));
});
test('review postponement rejects invalid intervals before database access', async () => {
  for (const [id, days] of [[0, 1], ['sql', 1], [1, 2], [1, '3'], [1, -1]]) {
    await assert.rejects(postpone(8, id, days, { execute: () => { throw new Error('unexpected query'); } }), error => error.status === 400);
  }
});
test('another owner or a review no longer due cannot be rescheduled', async () => {
  await assert.rejects(postpone(8, 19, 1, { execute: async () => [{ affectedRows: 0 }] }), error => error.status === 404);
});
