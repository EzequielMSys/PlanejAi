const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire, Module } = require('node:module');
const frontend = path.resolve(__dirname, '../frontend');
const req = createRequire(path.join(frontend, 'package.json'));
const { JSDOM } = req('jsdom');
const dom = new JSDOM('<div id="root"></div>', { url: 'https://planejai.test/' });
for (const name of ['window', 'document', 'localStorage', 'HTMLElement', 'Node']) global[name] = dom.window[name];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = req('react');
const { createRoot } = req('react-dom/client');
const { MemoryRouter } = req('react-router-dom');
let api;
async function screen(cached, fetchProfile) {
  if (!api) {
    const built = await req('esbuild').build({
      stdin: { contents: "export { AuthProvider, useAuth } from './src/context/AuthContext.jsx'", resolveDir: frontend },
      bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic',
      define: { 'import.meta.env': '{}' },
    });
    const filename = path.join(frontend, '__profile_session_test.cjs');
    const mod = new Module(filename, module);
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(frontend);
    mod._compile(built.outputFiles[0].text, filename);
    api = mod.exports;
  }
  localStorage.clear();
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64url');
  localStorage.setItem('token', `test.${payload}.signature`);
  localStorage.setItem('user', JSON.stringify({ id_usuario: 101, tipo: 'aluno' }));
  localStorage.setItem('perfil_completo', String(cached));
  global.fetch = fetchProfile;
  function Status() {
    const auth = api.useAuth();
    return React.createElement('p', null, auth.loading ? 'loading' : auth.perfilCompleto ? 'complete' : 'incomplete');
  }
  const root = createRoot(document.getElementById('root'));
  await React.act(async () => root.render(React.createElement(MemoryRouter, null,
    React.createElement(api.AuthProvider, null, React.createElement(Status)))));
  return { text: () => document.querySelector('p').textContent, close: () => React.act(async () => root.unmount()) };
}
test('reopening the site recovers completed setup from the server despite stale local state', async () => {
  let calls = 0;
  const view = await screen(false, async (url, options) => {
    calls++;
    assert.equal(url, '/api/perfil');
    assert.match(options.headers.Authorization, /^Bearer /);
    return { ok: true, json: async () => ({ perfil: { areas_foco: 'Matemática' }, disponibilidade: [{ dia_semana: 'SEG' }] }) };
  });
  try {
    assert.equal(view.text(), 'complete');
    assert.equal(localStorage.getItem('perfil_completo'), 'true');
    assert.equal(calls, 1);
  } finally { await view.close(); }
});
test('temporary API failure does not erase previously confirmed setup', async () => {
  const view = await screen(true, async () => ({ ok: false, status: 503 }));
  try {
    assert.equal(view.text(), 'complete');
    assert.equal(localStorage.getItem('perfil_completo'), 'true');
  } finally { await view.close(); }
});
test('an actually incomplete profile still opens setup', async () => {
  const view = await screen(true, async () => ({ ok: true, json: async () => ({ perfil: null, disponibilidade: [] }) }));
  try { assert.equal(view.text(), 'incomplete'); } finally { await view.close(); }
});

test('a revoked server session clears cached authentication instead of trusting the local profile', async () => {
  const view = await screen(true, async () => ({ ok: false, status: 401 }));
  try {
    assert.equal(localStorage.getItem('token'), null);
    assert.equal(localStorage.getItem('user'), null);
    assert.equal(view.text(), 'incomplete');
  } finally { await view.close(); }
});
