const test = require('node:test');
const assert = require('node:assert/strict');
const authService = require('../src/services/authService');
const { permitirTipos } = require('../src/middlewares/authMiddleware');

function executeMiddleware(middleware, usuario) {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  let nextCalled = false;
  middleware({ usuario }, response, () => { nextCalled = true; });
  return { response, nextCalled };
}

test('autorização permite apenas os perfis declarados', () => {
  const middleware = permitirTipos('admin', 'dono');
  assert.equal(executeMiddleware(middleware, { tipo: 'admin' }).nextCalled, true);
  assert.equal(executeMiddleware(middleware, { tipo: 'dono' }).nextCalled, true);
  const aluno = executeMiddleware(middleware, { tipo: 'aluno' });
  assert.equal(aluno.nextCalled, false);
  assert.equal(aluno.response.statusCode, 403);
});

test('autorização recusa requisição sem usuário autenticado', () => {
  const result = executeMiddleware(permitirTipos('dono'), null);
  assert.equal(result.response.statusCode, 401);
  assert.equal(result.nextCalled, false);
});

test('redefinição rejeita token malformado antes de consultar o banco', async () => {
  await assert.rejects(
    authService.redefinirSenha('token-inseguro', 'SenhaForte1'),
    /Token inválido ou expirado/
  );
});
