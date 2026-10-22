const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function load(existing) {
  const context = { module: { exports: {} }, require: () => ({ execute: async sql => sql.includes('INSERT') ? [{ affectedRows: 0 }] : [[existing]] }) };
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/middlewares/idempotencyMiddleware'), 'utf8'), context);
  return context.module.exports.idempotency('TEST');
}
function response() {
  return { statusCode: 200, headers: {}, setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}
const req = { get: () => 'repeat-request-123', usuario: { id_usuario: 1 } };
test('idempotent replay decodes MariaDB JSON text as an object', async () => {
  const res = response();
  await load({ status: 'CONCLUIDA', codigo_http: 201, resposta: '{"id":42}' })(req, res, () => assert.fail('must not execute twice'));
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.id, 42);
  assert.equal(res.headers['Idempotency-Replayed'], 'true');
});
test('a running request has a retryable conflict code', async () => {
  const res = response();
  await load({ status: 'PROCESSANDO' })(req, res, () => assert.fail('must not execute twice'));
  assert.equal(res.statusCode, 409);
  assert.equal(res.body.code, 'IDEMPOTENCY_IN_PROGRESS');
});
