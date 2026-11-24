// Explicit, one-time production check. Creates a disposable student and deletes it.
// Run only against the intended PlanejAI production URL.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const base = 'https://planej-ai-dusky.vercel.app';
const email = `planejai-privacy-check-${crypto.randomBytes(6).toString('hex')}@example.invalid`;
const password = `Teste!${crypto.randomBytes(12).toString('hex')}`;
const changedPassword = `Novo!${crypto.randomBytes(12).toString('hex')}`;
let created = false, currentPassword = password, cookie = '', csrf = '';

async function request(path, method = 'GET', data, authenticated = false) {
  const headers = {};
  if (authenticated) { headers.Cookie = cookie; if (csrf) headers['X-CSRF-Token'] = csrf; }
  if (data && !(data instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers,
    body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function login(senha) {
  const result = await request('/api/auth/login', 'POST', { email, senha });
  assert.equal(result.response.status, 200, `login HTTP ${result.response.status}`);
  assert.equal('token' in result.body, false);
  const setCookie = result.response.headers.get('set-cookie') || '';
  assert.match(setCookie, /__Host-planejai_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /Secure/i);
  assert.match(setCookie, /SameSite=Lax/i);
  cookie = setCookie.split(';')[0]; csrf = result.body.csrfToken;
}

async function deleteAccount() {
  const result = await request('/api/usuarios/me', 'DELETE',
    { senha: currentPassword, confirmacao: 'EXCLUIR MINHA CONTA' }, true);
  if (result.response.status !== 200) throw new Error(`exclusão HTTP ${result.response.status}: ${result.body.error || 'falha'}`);
  created = false;
}

async function main() {
  try {
    const registered = await request('/api/auth/register', 'POST', {
      nome: 'Conta Descartavel', email, senha: password,
    });
    assert.equal(registered.response.status, 201, `cadastro HTTP ${registered.response.status}`);
    created = true;
    await login(password);
    const session = await request('/api/auth/session', 'GET', null, true);
    assert.equal(session.response.status, 200);
    assert.equal(session.body.usuario.email, email);
    csrf = session.body.csrfToken;
    const form = new FormData();
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlHjZkAAAAASUVORK5CYII=', 'base64');
    form.append('foto', new Blob([png], { type: 'image/png' }), 'teste.png');
    const uploaded = await request('/api/usuarios/me/foto', 'PATCH', form, true);
    assert.equal(uploaded.response.status, 200, `foto HTTP ${uploaded.response.status}`);
    const photoUrl = uploaded.body.usuario?.foto_url;
    assert.match(photoUrl || '', /^\/uploads\/perfis\//);
    const photo = await fetch(base + photoUrl);
    assert.equal(photo.status, 200);
    assert.match(photo.headers.get('cache-control') || '', /no-store/i);
    const changed = await request('/api/auth/alterar-senha', 'POST', {
      senhaAtual: password, novaSenha: changedPassword, confirmarSenha: changedPassword,
    }, true);
    assert.equal(changed.response.status, 200, `troca de senha HTTP ${changed.response.status}`);
    currentPassword = changedPassword;
    cookie = (changed.response.headers.get('set-cookie') || '').split(';')[0];
    csrf = changed.body.csrfToken;
    const logout = await request('/api/auth/logout', 'POST', {}, true);
    assert.equal(logout.response.status, 200);
    assert.equal((await request('/api/auth/session', 'GET', null, true)).response.status, 401);
    await login(changedPassword);
    await deleteAccount();
    assert.equal((await fetch(base + photoUrl)).status, 404);
    assert.equal((await fetch(base + photoUrl + `?deleted=${crypto.randomBytes(4).toString('hex')}`)).status, 404);
    assert.equal((await request('/api/auth/session', 'GET', null, true)).response.status, 401);
    console.log('Produção: cadastro, cookie, recarga, foto, troca de senha, logout e exclusão passaram.');
  } finally {
    if (created) {
      try { await login(currentPassword); await deleteAccount(); console.log('Conta descartável removida após falha de teste.'); }
      catch { console.error(`ATENÇÃO: conta descartável requer remoção manual: ${email}`); }
    }
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
