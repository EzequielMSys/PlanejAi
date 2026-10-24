const test = require('node:test');
const assert = require('node:assert/strict');
const { checkAvailability } = require('../src/scripts/checkAvailability');

test('health monitor retries transient failure and requires a connected database', async () => {
  let requests = 0, waits = 0;
  const result = await checkAvailability({ fetchImpl: async () => {
    requests++;
    if (requests === 1) throw new Error('timeout');
    return { ok: true, json: async () => ({ database: requests === 2 ? 'disconnected' : 'connected' }) };
  }, wait: async () => { waits++; } });
  assert.equal(result.available, true);
  assert.equal(requests, 3);
  assert.equal(waits, 2);
});
test('health monitor fails after bounded checks without exposing provider errors', async () => {
  let requests = 0;
  await assert.rejects(checkAvailability({ fetchImpl: async () => { requests++; throw new Error('private hostname'); }, wait: async () => {} }), /Aplicação ou banco indisponível/);
  assert.equal(requests, 3);
});
