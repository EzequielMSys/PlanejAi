// Run explicitly: `node test/sessionIntegration.js`.
// Uses a random local MariaDB schema and an ephemeral HTTP port.
require('dotenv').config();
process.env.NODE_ENV = 'production';
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const getDatabaseOptions = require('../src/config/databaseOptions');

async function main() {
  const original = getDatabaseOptions();
  if (!['localhost', '127.0.0.1', '::1'].includes(original.host)) throw new Error('Teste exige MariaDB local.');
  const schema = `planejai_session_test_${crypto.randomBytes(5).toString('hex')}`;
  process.env.DB_NAME = schema;
  const { database: ignored, ...serverOptions } = original;
  const admin = await mysql.createConnection(serverOptions);
  let pool, server;
  try {
    await require('../src/scripts/garantirTabelas')();
    pool = require('../src/config/db');
    const password = 'SenhaDescartavel2026!';
    const hash = await bcrypt.hash(password, 10);
    await pool.execute('INSERT INTO usuarios (nome,email,senha,tipo,ativo) VALUES (?,?,?,?,1)',
      ['Sessao Descartavel', `${schema}@example.invalid`, hash, 'aluno']);
    const app = require('../src/server');
    server = await new Promise(resolve => { const candidate = app.listen(0, '127.0.0.1', () => resolve(candidate)); });
    const base = `http://127.0.0.1:${server.address().port}`;
    const post = (path, body, cookie, csrf) => fetch(base + path, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}),
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: JSON.stringify(body),
    });
    const credentials = { email: `${schema}@example.invalid`, senha: password };
    const login = await post('/api/auth/login', credentials);
    assert.equal(login.status, 200);
    const loginBody = await login.json();
    assert.equal('token' in loginBody, false, 'JWT não pode estar no JSON');
    const setCookie = login.headers.get('set-cookie') || '';
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /Secure/i);
    assert.match(setCookie, /__Host-planejai_session=/);
    assert.match(setCookie, /SameSite=Lax/i);
    const cookie = setCookie.split(';')[0];
    const session = await fetch(base + '/api/auth/session', { headers: { Cookie: cookie } });
    assert.equal(session.status, 200);
    const current = await session.json();
    assert.equal(current.usuario.email, credentials.email);
    assert.match(current.csrfToken, /^[a-f0-9]{64}$/);
    const change = { senhaAtual: password, novaSenha: 'OutraSenhaDescartavel2026!', confirmarSenha: 'OutraSenhaDescartavel2026!' };
    assert.equal((await post('/api/auth/alterar-senha', change, cookie)).status, 403);
    const updated = await post('/api/auth/alterar-senha', change, cookie, current.csrfToken);
    assert.equal(updated.status, 200);
    const newCookie = (updated.headers.get('set-cookie') || '').split(';')[0];
    assert.ok(newCookie && newCookie !== cookie);
    assert.equal((await fetch(base + '/api/auth/session', { headers: { Cookie: cookie } })).status, 401);
    const restored = await fetch(base + '/api/auth/session', { headers: { Cookie: newCookie } });
    assert.equal(restored.status, 200);
    const restoredBody = await restored.json();
    assert.equal((await post('/api/auth/logout', {}, newCookie)).status, 403);
    const logout = await post('/api/auth/logout', {}, newCookie, restoredBody.csrfToken);
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get('set-cookie') || '', /Expires=Thu, 01 Jan 1970/i);
    assert.equal((await fetch(base + '/api/auth/session', { headers: { Cookie: newCookie } })).status, 401);
    const relogin = await post('/api/auth/login', { email: credentials.email, senha: change.novaSenha });
    assert.equal(relogin.status, 200);
    const deleteCookie = (relogin.headers.get('set-cookie') || '').split(';')[0];
    const deleteCsrf = (await relogin.json()).csrfToken;
    const remove = (csrf, body) => fetch(base + '/api/usuarios/me', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json', Cookie: deleteCookie,
        ...(csrf ? { 'X-CSRF-Token': csrf } : {}) }, body: JSON.stringify(body),
    });
    assert.equal((await remove(null, { senha: change.novaSenha, confirmacao: 'EXCLUIR MINHA CONTA' })).status, 403);
    assert.equal((await remove(deleteCsrf, { senha: change.novaSenha })).status, 400);
    assert.equal((await remove(deleteCsrf, { senha: 'errada', confirmacao: 'EXCLUIR MINHA CONTA' })).status, 403);
    assert.equal((await remove(deleteCsrf, { senha: change.novaSenha, confirmacao: 'EXCLUIR MINHA CONTA' })).status, 200);
    const [[remaining]] = await pool.execute('SELECT COUNT(*) AS total FROM usuarios WHERE email = ?', [credentials.email]);
    assert.equal(remaining.total, 0);
    assert.equal((await fetch(base + '/api/auth/session', { headers: { Cookie: deleteCookie } })).status, 401);
    console.log('Login, recarga, CSRF, troca de senha, logout e exclusão passaram por HTTP no banco isolado.');
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    if (pool) await pool.end();
    if (!/^planejai_session_test_[a-f0-9]{10}$/.test(schema)) throw new Error('Nome de teste inválido.');
    await admin.query(`DROP DATABASE IF EXISTS \`${schema}\``);
    await admin.end();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
