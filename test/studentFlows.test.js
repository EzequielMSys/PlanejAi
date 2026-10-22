const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire, Module } = require('node:module');
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const requireFrontend = createRequire(path.join(frontendDir, 'package.json'));
const { JSDOM, VirtualConsole } = requireFrontend('jsdom');
const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', { url: 'http://planejai.test/', virtualConsole: new VirtualConsole(), pretendToBeVisual: true });
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'MutationObserver', 'getComputedStyle']) global[key] = key === 'getComputedStyle' ? dom.window.getComputedStyle.bind(dom.window) : dom.window[key];
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true });
global.IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.scrollTo = () => {};
window.HTMLElement.prototype.scrollIntoView = () => {};
window.confirm = () => false;
global.requestAnimationFrame = window.requestAnimationFrame.bind(window);
global.cancelAnimationFrame = window.cancelAnimationFrame.bind(window);
global.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: 'OK', database: 'connected' }) });
const React = requireFrontend('react');
const { act } = React;
const { createRoot } = requireFrontend('react-dom/client');
const { MemoryRouter } = requireFrontend('react-router-dom');
const axios = requireFrontend('axios');
let bundle;
let requests = [];
let failChat = false;
const person = role => ({ id: 900001, id_usuario: 900001, nome: 'Estudante de teste', email: 'fixture@example.invalid', tipo: role, ativo: 1 });
function fixture(config) {
  const url = `${config.baseURL || ''}${config.url || ''}`.replace(/\/$/, '');
  requests.push({ url, method: config.method, data: config.data });
  if (url.endsWith('/inteligencia/chat')) {
    if (config.method === 'post') {
      if (failChat) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Lumi temporariamente indisponível.' } });
      return { mensagens: [{ role: 'user', conteudo: JSON.parse(config.data).mensagem }, { role: 'assistant', conteudo: '# Vamos entender\n\nUma **ideia** de cada vez.\n\n- Primeiro ponto\n- Segundo ponto\n\n<script>unsafe()</script>' }] };
    }
    return [];
  }
  if (url.endsWith('/aprendizagem/jornada')) return { blocks: [], plannedMinutes: 25, summary: { reviews: 0, errors: 0, weeklyMinutes: 0, weeklyGoal: 180, criticalDiscipline: null } };
  if (url.endsWith('/aprendizagem/resumo')) return { metaSemanal: 180, minutosSemana: 0, revisoesHoje: 0, errosPendentes: 0, porDisciplina: [], porDificuldade: [], recomendacoes: [], competenciasEnem: [] };
  if (url.endsWith('/perfil')) return { perfil: { areas_foco: 'Matemática', objetivo: 'ENEM', ano_escolar: '3', tempo_diario_min: 60 }, disponibilidade: [] };
  if (url.endsWith('/inteligencia/privacidade')) return { visibilidade: 'RESUMO' };
  if (url.endsWith('/usuarios/me')) return person('aluno');
  if (url.endsWith('/usuarios')) return { usuarios: [person('aluno')], pagina: 1, total_registros: 17, total_paginas: 2, stats: { total: 17, ativos: 15, inativos: 2, donos: 1, admins: 2, docentes: 3, alunos: 11 } };
  if (url.endsWith('/dashboard/estatisticas')) return { totalUsuarios: 17, totalAtividadesPublicadas: 0, totalEntregas: 0, totalCronogramasAtivos: 0 };
  if (url.endsWith('/turmas/minhas/1')) return { id_turma: 1, nome: 'Turma de teste', ano_letivo: 2026, pendentes: [], concluidas: [], avisos: [] };
  if (url.endsWith('/adaptativo/proxima-acao')) return { motivo: 'Uma sessão breve', titulo: 'Revisar' };
  if (url.endsWith('/adaptativo/sequencia')) return { semanas: 0 };
  return [];
}
axios.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data: fixture(config) });
async function getBundle() {
  if (bundle) return bundle;
  const esbuild = requireFrontend('esbuild');
  const result = await esbuild.build({
    stdin: { contents: `export { default as App } from './src/App'; export { ThemeProvider } from './src/context/ThemeContext'; export { AccessibilityProvider } from './src/context/AccessibilityContext'; export { default as ErrorBoundary } from './src/components/ErrorBoundary';`, resolveDir: frontendDir, loader: 'jsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', loader: { '.css': 'empty' },
    define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: 'http://fixture.invalid', BASE_URL: '/', DEV: true }) },
    plugins: [{ name: 'defer-nonessential-widgets', setup(build) { build.onResolve({ filter: /Deferred$/ }, () => ({ path: 'deferred-test', namespace: 'test' })); build.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents: 'export default function Deferred(){ return null }', loader: 'js' })); } }],
    logLevel: 'silent',
  });
  const filename = path.join(frontendDir, '__student_test_bundle.cjs');
  const compiled = new Module(filename, module);
  compiled.filename = filename; compiled.paths = Module._nodeModulePaths(frontendDir);
  compiled._compile(result.outputFiles[0].text, filename);
  bundle = compiled.exports;
  return bundle;
}
async function flush() { await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); }); }
async function renderRoute(route, role = 'aluno') {
  localStorage.clear();
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64'), Buffer.from(JSON.stringify({ id: 900001, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64'), 'fixture'].join('.');
  for (const [key, value] of Object.entries({ token, user: JSON.stringify(person(role)), perfil_completo: route === '/onboarding' ? 'false' : 'true', primeiro_acesso: route === '/primeiro-acesso' ? 'true' : 'false', theme: 'light' })) localStorage.setItem(key, value);
  requests = [];
  const { App, ThemeProvider, AccessibilityProvider, ErrorBoundary } = await getBundle();
  const container = document.getElementById('root');
  const root = createRoot(container);
  await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(ThemeProvider, null, React.createElement(AccessibilityProvider, null, React.createElement(ErrorBoundary, null, React.createElement(App)))))));
  await flush(); await flush();
  if (route === '/usuarios' || route === '/dono/usuarios') await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
  return { root, container, async close() { await act(async () => root.unmount()); } };
}
function button(text) { return [...document.querySelectorAll('button')].find(node => node.textContent.trim() === text); }
async function inputValue(element, value) { await act(async () => { const setter = Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set; setter.call(element, value); element.dispatchEvent(new window.Event('input', { bubbles: true })); }); }

test('all student, teacher and owner pages render without runtime failures', async t => {
  const routes = ['/', '/login', '/register', '/primeiro-acesso', '/onboarding', '/esqueci-senha', '/redefinir-senha', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/minha-jornada', '/minhas-atividades', '/minhas-turmas', '/minhas-turmas/1', '/avisos', '/perfil', '/alterar-senha', '/planejamento-inteligente', '/estudar', '/status', '/lumi', '/chat', '/preferencias', '/pagina-inexistente'];
  for (const route of routes) await t.test(route, async () => { const screen = await renderRoute(route); try { assert.ok(document.querySelector('h1'), 'page must have a visible title'); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.'), 'error boundary should not be shown'); } finally { await screen.close(); } });
  for (const [route, role] of [['/dashboard-gestor', 'docente'], ['/turmas', 'docente'], ['/atividades', 'docente'], ['/materiais', 'docente'], ['/usuarios', 'admin'], ['/dono', 'dono'], ['/dono/usuarios', 'dono']]) await t.test(`${role}: ${route}`, async () => { const screen = await renderRoute(route, role); try { assert.ok(document.querySelector('h1')); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.')); } finally { await screen.close(); } });
});
test('reading controls apply, persist and reset preferences', async () => {
  const screen = await renderRoute('/preferencias');
  try {
    const focus = [...document.querySelectorAll('label')].find(node => node.textContent.includes('Modo foco')).querySelector('input');
    await act(async () => focus.click());
    assert.ok(document.documentElement.classList.contains('a11y-focus'));
    assert.equal(JSON.parse(localStorage.getItem('planejai:accessibility')).focusMode, true);
    await act(async () => button('Restaurar preferências de leitura').click());
    assert.ok(!document.documentElement.classList.contains('a11y-focus'));
    assert.equal(document.documentElement.style.getPropertyValue('--a11y-line-height'), '1.75');
    const input = document.getElementById('custom-color-hex');
    await inputValue(input, '#52796F');
    await act(async () => input.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.equal(localStorage.getItem('planejai:cor-custom'), '#52796F');
    assert.ok(document.documentElement.style.getPropertyValue('--pn-primaria'));
    for (const [kebab, camel] of [['primaria-suave', 'primariaSuave'], ['primaria-borda', 'primariaBorda'], ['texto-suave', 'textoSuave'], ['superficie-alt', 'superficieAlt'], ['borda-forte', 'bordaForte'], ['on-primaria', 'onPrimaria']]) {
      const value = document.documentElement.style.getPropertyValue(`--pn-${kebab}`);
      assert.match(value, /^#[0-9a-f]{6}$/i, `theme must publish ${kebab}`);
      assert.equal(value, document.documentElement.style.getPropertyValue(`--pn-${camel}`));
      assert.match(document.documentElement.style.getPropertyValue(`--pn-${kebab}-rgb`), /^\d+ \d+ \d+$/);
    }
  } finally { await screen.close(); }
});
test('Lumi starters prepare a question, then send one request and render safe structured text', async () => {
  failChat = false;
  const screen = await renderRoute('/lumi');
  try {
    const starter = [...document.querySelectorAll('.lumi-starters button')][0];
    await act(async () => starter.click());
    const textarea = document.getElementById('lumi-message');
    assert.match(textarea.value, /assunto/);
    assert.equal(requests.filter(request => request.method === 'post').length, 0, 'a suggestion must not send without confirmation');
    await act(async () => textarea.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(requests.filter(request => request.method === 'post').length, 1);
    assert.ok(document.querySelector('.lumi-prose strong'));
    assert.equal(document.querySelectorAll('.lumi-feed script').length, 0);
    assert.ok(document.querySelector('.lumi-feed').textContent.includes('<script>unsafe()</script>'));
  } finally { await screen.close(); }
});
test('a provider failure leaves the question available to retry', async () => {
  failChat = true;
  const screen = await renderRoute('/lumi');
  try {
    const textarea = document.getElementById('lumi-message');
    await inputValue(textarea, 'Como estudar frações?');
    await act(async () => textarea.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(textarea.value, 'Como estudar frações?');
    assert.ok(screen.container.textContent.includes('Lumi temporariamente indisponível.'));
    assert.equal(document.querySelectorAll('.lumi-message--user').length, 0);
  } finally { await screen.close(); failChat = false; }
});

test('a student cannot open management pages through a direct URL', async () => {
  const screen = await renderRoute('/usuarios', 'aluno');
  try {
    assert.ok(!screen.container.textContent.includes('Painel de Usuários'));
    assert.ok(!requests.some(request => request.url.endsWith('/usuarios')));
    assert.ok(screen.container.textContent.includes('Bom dia') || screen.container.textContent.includes('Boa tarde') || screen.container.textContent.includes('Boa noite'));
  } finally { await screen.close(); }
});
test('owner counters use totals instead of the paginated user slice', async () => {
  const screen = await renderRoute('/dono', 'dono');
  try { assert.ok(screen.container.textContent.includes('17')); assert.ok(screen.container.textContent.includes('15')); }
  finally { await screen.close(); }
});

test('focus mode always offers a direct way back to navigation', async () => {
  const screen = await renderRoute('/preferencias');
  try {
    const focus = [...document.querySelectorAll('label')].find(node => node.textContent.includes('Modo foco')).querySelector('input');
    await act(async () => focus.click());
    assert.ok(document.documentElement.classList.contains('a11y-focus'));
    await act(async () => button('Sair do modo foco').click());
    assert.ok(!document.documentElement.classList.contains('a11y-focus'));
    assert.equal(JSON.parse(localStorage.getItem('planejai:accessibility')).focusMode, false);
  } finally { await screen.close(); }
});

test('mobile menu traps keyboard focus, closes with Escape and restores the page', async () => {
  const originalMedia = window.matchMedia;
  window.matchMedia = query => ({ ...originalMedia(query), matches: query.includes('max-width: 1023px') });
  const screen = await renderRoute('/inicio');
  try {
    const trigger = document.querySelector('.sd-mobile-menu');
    trigger.focus();
    await act(async () => trigger.click());
    const sidebar = document.getElementById('app-sidebar');
    assert.ok(sidebar.classList.contains('is-open'));
    assert.equal(document.body.style.overflow, 'hidden');
    assert.equal(document.querySelector('.app-workspace').inert, true);
    const links = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
    links.at(-1).focus();
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Tab', cancelable: true })));
    assert.equal(document.activeElement, links[0]);
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', cancelable: true })));
    assert.ok(!sidebar.classList.contains('is-open'));
    assert.equal(document.querySelector('.app-workspace').inert, false);
    assert.equal(document.body.style.overflow, '');
    assert.equal(document.activeElement, trigger);
  } finally { await screen.close(); window.matchMedia = originalMedia; }
});

test('search trigger focuses the page search input', async () => {
  const screen = await renderRoute('/inicio');
  try {
    await act(async () => document.querySelector('.sd-search-trigger').click());
    assert.equal(document.activeElement, document.querySelector('.sd-search input'));
    assert.ok(document.getElementById('page-search-results'));
  } finally { await screen.close(); }
});


test('an empty Lumi conversation starts at the welcome section rather than the bottom', async () => {
  const old = Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, 'scrollHeight');
  Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', { configurable: true, get() { return this.classList.contains('lumi-feed') ? 1000 : 0; } });
  const screen = await renderRoute('/lumi');
  try { assert.equal(document.querySelector('.lumi-feed').scrollTop, 0); }
  finally {
    await screen.close();
    if (old) Object.defineProperty(window.HTMLElement.prototype, 'scrollHeight', old);
    else delete window.HTMLElement.prototype.scrollHeight;
  }
});
