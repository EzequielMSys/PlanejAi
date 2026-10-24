const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { EventEmitter } = require('node:events');
const { safeRoute, requestId } = require('../src/utils/operationContext');

test('operational paths and request references cannot carry arbitrary user content', () => {
  assert.equal(safeRoute({ originalUrl: '/api/auth/redefinir-senha?token=private', route: { path: '/redefinir-senha' } }), '/api/auth/redefinir-senha');
  assert.equal(safeRoute({ originalUrl: '/api/aprendizagem/conteudos/private-token/anotacao', route: { path: '/conteudos/:idConteudo/anotacao' } }), '/api/aprendizagem/conteudos/:idConteudo/anotacao');
  assert.equal(safeRoute({ originalUrl: '/api/auth/private-email@example.test' }), '/api/auth/:unmatched');
  assert.equal(safeRoute({ originalUrl: '/private-secret' }), '/other');
  assert.match(requestId('private@example.test'), /^[a-f0-9-]{36}$/);
});
test('a failed read is audited without storing body, query, raw identifiers or error text', async () => {
  let parameters;
  const context = { module: { exports: {} }, require: name => ({
    crypto: require('node:crypto'), '../config/db': { execute: async (sql, values) => { parameters = values; } },
    '../services/metricsService': { beginRequest() {}, finishRequest() {} }, '../utils/operationContext': { safeRoute },
  })[name], process: { hrtime: process.hrtime, env: {} }, console };
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/middlewares/operationsMiddleware'), 'utf8'), context);
  const req = { method: 'GET', originalUrl: '/api/aprendizagem/conteudos/123/anotacao?token=private', route: { path: '/conteudos/:idConteudo/anotacao' }, body: { texto: 'private-essay', senha: 'private-password' }, ip: '127.0.0.1', requestId: requestId() };
  const res = new EventEmitter(); res.statusCode = 503;
  context.module.exports.operationsMonitor(req, res, () => {});
  res.emit('finish');
  assert.ok(parameters);
  assert.equal(parameters[2], '/api/aprendizagem/conteudos/:idConteudo/anotacao');
  assert.ok(!JSON.stringify(parameters).includes('private'));
});

test('serverless audit registers background completion before responding and waits for the database', async () => {
  let background, finishWrite;
  const context = { module: { exports: {} }, require: name => ({
    crypto: require('node:crypto'), '../config/db': { execute: () => new Promise(resolve => { finishWrite = resolve; }) },
    '../services/metricsService': { beginRequest() {}, finishRequest() {} }, '../utils/operationContext': { safeRoute },
    '@vercel/functions': { waitUntil: promise => { background = promise; } },
  })[name], process: { hrtime: process.hrtime, env: { VERCEL: '1' } }, console };
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/middlewares/operationsMiddleware'), 'utf8'), context);
  const res = new EventEmitter(); res.statusCode = 400;
  context.module.exports.operationsMonitor({ method: 'POST', originalUrl: '/api/auth/login', route: { path: '/login' }, ip: '127.0.0.1' }, res, () => {});
  assert.ok(background);
  let completed = false; background.then(() => { completed = true; });
  res.emit('finish'); await Promise.resolve();
  assert.equal(completed, false);
  finishWrite(); await background;
  assert.equal(completed, true);
});
