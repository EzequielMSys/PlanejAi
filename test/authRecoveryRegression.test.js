const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const jwt = require('jsonwebtoken');
const secret = 'test-secret-for-password-change-regressions-only';
function service(appUrl) {
  const updated = { id_usuario: 7, tipo: 'aluno', email: 'test@example.invalid', versao_sessao: 3 };
  let mail;
  const dependencies = {
    bcrypt: { compare: async () => true, hash: async () => 'hash' }, jsonwebtoken: jwt, crypto: require('node:crypto'),
    '../models/usuarioModel': { buscarPorEmail: async () => updated, salvarTokenRecuperacao: async () => {},
      buscarPorIdCompleto: async () => ({ ...updated, versao_sessao: 2, senha: 'old-hash' }), alterarSenha: async () => updated },
    '../utils/authUtils': { validarSenhaForte: () => true, sanitizeUser: user => ({ id_usuario: user.id_usuario, tipo: user.tipo }), getBcryptRounds: () => 4 },
    '../config/jwtConfig': { getJwtSecret: () => secret },
    './emailService': { enviarRecuperacaoSenha: async data => { mail = data; } },
    './jobQueue': { enqueue: (type, task) => task() },
  };
  const context = { require: key => { if (!(key in dependencies)) throw new Error(key); return dependencies[key]; },
    module: { exports: {} }, process: { env: { APP_URL: appUrl } }, console };
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/authService'), 'utf8'), context);
  return { api: context.module.exports, mail: () => mail };
}
for (const base of ['https://example.invalid', 'https://example.invalid/PlanejAi/', 'https://example.invalid/PlanejAi/#/']) {
  test(`password recovery opens HashRouter and preserves app base: ${base}`, async () => {
    const s = service(base);
    await s.api.esqueciSenha('test@example.invalid');
    const url = new URL(s.mail().resetUrl);
    assert.match(url.hash, /^#\/redefinir-senha\?token=[a-f0-9]{64}$/);
    assert.equal(url.pathname, base.includes('PlanejAi') ? '/PlanejAi/' : '/');
  });
}
test('password change issues a token with the updated session version', async () => {
  const result = await service('https://example.invalid').api.alterarSenha(7, 'OldPassword1', 'NewPassword1');
  const decoded = jwt.verify(result.token, secret);
  assert.equal(decoded.id_usuario, 7);
  assert.equal(decoded.sv, 3);
  assert.equal(result.usuario.id_usuario, 7);
});
