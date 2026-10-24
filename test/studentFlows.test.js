const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { createRequire, Module } = require('node:module');
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const requireFrontend = createRequire(path.join(frontendDir, 'package.json'));
const { JSDOM, VirtualConsole } = requireFrontend('jsdom');
const dom = new JSDOM('<!doctype html><html lang="pt-BR"><head><title>PlanejAI</title></head><body><div id="root"></div></body></html>', { url: 'http://planejai.test/', virtualConsole: new VirtualConsole(), pretendToBeVisual: true });
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
let setupCompleteFixture = true;
global.fetch = async url => ({ ok: true, status: 200, json: async () => String(url).endsWith('/api/perfil')
  ? { perfil: setupCompleteFixture ? { areas_foco: 'Matemática' } : null, disponibilidade: setupCompleteFixture ? [{ dia_semana: 'SEG' }] : [] }
  : { status: 'OK', database: 'connected' } });
const React = requireFrontend('react');
const { act } = React;
const { createRoot } = requireFrontend('react-dom/client');
const { MemoryRouter } = requireFrontend('react-router-dom');
const axios = requireFrontend('axios');
const axe = requireFrontend('axe-core');
let bundle;
let requests = [];
let failChat = false;
let failScheduleLoad = false;
let failExamLoad = false;
let supportMode = '';
let materialCatalogFixture = false;
let dashboardLearningFixture = null;
let dailySchedulesFixture = [];
let evolutionFixture = [];
let continuityFixture = null;
let onboardingProfileFixture = null;
let incompleteAccount = false;
let failLearningLoad = false;
let essayMode = '';
let deferredEssay;
const person = role => ({ id: 900001, id_usuario: 900001, nome: 'Estudante de teste', email: 'fixture@example.invalid', tipo: role, ativo: 1 });
function fixture(config) {
  const url = `${config.baseURL || ''}${config.url || ''}`.replace(/\/$/, '');
  requests.push({ url, method: config.method, data: config.data });
    if ((failScheduleLoad && url.endsWith('/cronograma')) || (failExamLoad && url.endsWith('/inteligencia/catalogo-provas'))) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (essayMode === 'workshopFailure' && config.method === 'post' && url.endsWith('/redacao/projetos')) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (failLearningLoad && url.endsWith('/aprendizagem/resumo')) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (url.endsWith('/redacao') && config.method === 'post') {
    if (essayMode === 'deferred') return new Promise(resolve => { deferredEssay = resolve; });
    if (essayMode === 'failure') throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Envio temporariamente indisponível.' } });
    if (essayMode === 'queued') return { offline: true, queued: true, queueId: 123 };
  }
  if (url.endsWith('/aprendizagem/estudo-em-andamento')) return config.method === 'get' ? continuityFixture : { salvo: true };
  if (url.endsWith('/cronograma')) return dailySchedulesFixture;
  if (url.endsWith('/aprendizagem/evolucao')) return evolutionFixture;
  if (/\/dias\/\d+\/ajustar$/.test(url)) return { message: 'Seu dia foi ajustado e salvo.' };
  if (url.endsWith('/inteligencia/chat')) {
    if (config.method === 'post') {
      if (failChat) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Lumi temporariamente indisponível.' } });
      return { mensagens: [{ role: 'user', conteudo: JSON.parse(config.data).mensagem }, { role: 'assistant', conteudo: '# Vamos entender\n\nUma **ideia** de cada vez.\n\n- Primeiro ponto\n- Segundo ponto\n\n<script>unsafe()</script>' }] };
    }
    return [];
  }
  if (url.endsWith('/aprendizagem/jornada')) return { blocks: [], plannedMinutes: 25, summary: { reviews: 0, errors: 0, weeklyMinutes: 0, weeklyGoal: 180, criticalDiscipline: null } };
  if (url.endsWith('/aprendizagem/resumo')) return dashboardLearningFixture || { metaSemanal: 180, minutosSemana: 0, revisoesHoje: 0, errosPendentes: 0, porDisciplina: [], porDificuldade: [], recomendacoes: [], competenciasEnem: [] };
  if (url.endsWith('/perfil')) return { perfil: onboardingProfileFixture || (setupCompleteFixture ? { areas_foco: 'Matemática', objetivo: 'ENEM', ano_escolar: '3', tempo_diario_min: 60 } : null), disponibilidade: [] };
  if (url.endsWith('/inteligencia/privacidade')) return { visibilidade: 'RESUMO' };
  if (url.endsWith('/operacoes/suporte')) {
    if (config.method === 'post') {
      if (supportMode === 'failed') throw Object.assign(new Error('Falha no atendimento.'), { config, response: { status: 503, data: { message: 'Atendimento indisponível.' } } });
      return { id: 81 };
    }
    return supportMode === 'saved' ? [{ id: 81, categoria: 'PROBLEMA', mensagem: 'Minha mensagem de ajuda.', status: 'ABERTO', criado_em: '2026-10-24T12:00:00Z' }] : [];
  }
  if (url.endsWith('/usuarios/me')) return person('aluno');
  if (url.endsWith('/usuarios')) return { usuarios: [person('aluno')], pagina: 1, total_registros: 17, total_paginas: 2, stats: { total: 17, ativos: 15, inativos: 2, donos: 1, admins: 2, docentes: 3, alunos: 11 } };
  if (url.endsWith('/dashboard/estatisticas')) return { totalUsuarios: 17, totalAtividadesPublicadas: 0, totalEntregas: 0, totalCronogramasAtivos: 0 };
  if (url.endsWith('/colaborativo/gestao/alertas')) return [{ id_usuario: 31, nome: 'Aluno de teste', motivos: ['Revisões atrasadas'] }];
  if (url.endsWith('/colaborativo/gestao/grupos/sugestoes')) return [{ disciplina: 'Matemática', competencia: 'Razão e proporção', aprendizes: [31], mentores: [] }];
  if (url.endsWith('/turmas/minhas/1')) return { id_turma: 1, nome: 'Turma de teste', ano_letivo: 2026, pendentes: [], concluidas: [], avisos: [] };
  if (url.endsWith('/turmas')) return [{ id_turma: 2, nome: 'Terceiro A', codigo: '3A', ano_letivo: 2026, total_alunos: 3, disciplinas: [{ disciplina: 'Matemática' }] }];
  if (url.endsWith('/turmas/2')) return { id_turma: 2, nome: 'Terceiro A', codigo: '3A', docentes: [], alunos: [] };
  if (materialCatalogFixture && url.endsWith('/conteudos')) return [{ id_conteudo: 7, titulo: 'Leis de Newton', disciplina: 'Física', nivel: 'BASICO', materiais: '[]', link: '' }];
  if (url.endsWith('/adaptativo/proxima-acao')) return { motivo: 'Uma sessão breve', titulo: 'Revisar' };
  if (url.endsWith('/adaptativo/sequencia')) return { semanas: 0 };
  return [];
}
axios.defaults.adapter = async config => ({ status: 200, statusText: 'OK', headers: {}, config, data: await fixture(config) });
async function getBundle() {
  if (bundle) return bundle;
  const esbuild = requireFrontend('esbuild');
  const result = await esbuild.build({
    stdin: { contents: `export { default as App } from './src/App'; export { default as RouteLoading } from './src/components/RouteLoading'; export { default as PageExperience } from './src/components/PageExperience'; export { ThemeProvider } from './src/context/ThemeContext'; export { AccessibilityProvider } from './src/context/AccessibilityContext'; export { default as ErrorBoundary } from './src/components/ErrorBoundary';`, resolveDir: frontendDir, loader: 'jsx' },
    bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', loader: { '.css': 'empty' },
    define: { 'import.meta.env': JSON.stringify({ VITE_API_URL: 'http://fixture.invalid', BASE_URL: '/', DEV: true }) },
    plugins: [{ name: 'defer-nonessential-widgets', setup(build) { build.onResolve({ filter: /LumiMessage$/ }, () => ({ path: 'lumi-message-test', namespace: 'test' })); build.onResolve({ filter: /Deferred$/ }, () => ({ path: 'deferred-test', namespace: 'test' })); build.onLoad({ filter: /lumi-message-test/, namespace: 'test' }, () => ({ contents: "import React from 'react'; export default function LumiMessage({ content }) { return React.createElement('div', { className: 'lumi-message' }, content) }", loader: 'js', resolveDir: frontendDir })); build.onLoad({ filter: /deferred-test/, namespace: 'test' }, () => ({ contents: 'export default function Deferred(){ return null }', loader: 'js' })); } }],
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
async function renderRoute(route, role = 'aluno', userOverrides = {}) {
  setupCompleteFixture = route !== '/onboarding' && !incompleteAccount;
  localStorage.clear();
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64'), Buffer.from(JSON.stringify({ id: 900001, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64'), 'fixture'].join('.');
  for (const [key, value] of Object.entries({ token, user: JSON.stringify({ ...person(role), ...userOverrides }), perfil_completo: route === '/onboarding' ? 'false' : 'true', primeiro_acesso: route === '/primeiro-acesso' ? 'true' : 'false', theme: 'light' })) localStorage.setItem(key, value);
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

test('today highlights the pending lesson and saves a routine adjustment only after confirmation', async () => {
  dailySchedulesFixture = [{ id_cronograma: 11, status: 'ATIVO', dias: [{ id_dia: 51, data_estudo: new Intl.DateTimeFormat("en-CA", {timeZone:"America/Sao_Paulo"}).format(new Date()), tempo_previsto: 60, concluido: 0, conteudos: [{ id: 70, titulo: 'Concluído', concluido: 1 }, { id: 71, id_conteudo: 7, titulo: 'Funções na prática', disciplina: 'Matemática', concluido: 0 }, { id: 72, titulo: 'Revisar equações', concluido: 0 }] }] }];
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Funções na prática'));
    assert.ok(screen.container.textContent.includes('30 min previstos para esta sessão'));
    assert.ok([...document.querySelectorAll('button')].some(node => node.textContent.includes('Continuar meus estudos')));
    const adjust = [...document.querySelectorAll('button')].find(node => node.textContent.includes('Hoje só tenho 20 minutos'));
    await act(async () => adjust.click());
    assert.ok(document.querySelector('[aria-label="Conferir ajuste"]'));
    assert.equal(requests.filter(req => req.url.endsWith('/ajustar')).length, 0);
    await act(async () => button('Cancelar').click());
    assert.equal(document.querySelector('[aria-label="Conferir ajuste"]'), null);
    await act(async () => adjust.click());
    await act(async () => button('Confirmar ajuste').click());
    await flush();
    const saved = requests.find(req => req.url.endsWith('/dias/51/ajustar'));
    assert.equal(saved.method, 'post');
    assert.equal(JSON.parse(saved.data).acao, 'REDUZIR');
    assert.ok(screen.container.textContent.includes('Seu dia foi ajustado e salvo.'));
  } finally { await screen.close(); dailySchedulesFixture = []; }
});

test('landing menu separates account access and closes with Escape or section navigation', async () => {
  const screen = await renderRoute('/');
  try {
    const menu = document.querySelector('.study-menu');
    const toggle = menu.querySelector('summary');
    await act(async () => toggle.click());
    assert.equal(menu.open, true);
    assert.equal(menu.querySelector('a[href="/register"]').textContent, 'Criar minha conta ↗');
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(menu.open, false);
    assert.equal(document.activeElement, toggle);
    await act(async () => toggle.click());
    await act(async () => button('Conheça a Lumi').click());
    assert.equal(menu.open, false);
    assert.equal(document.activeElement.id, 'lumi');
    assert.equal(document.querySelector('form'), null);
    assert.ok(document.querySelector('.study-actions a[href="/register"]'));
  } finally { await screen.close(); }
});
async function inputValue(element, value) { await act(async () => { const setter = Object.getOwnPropertyDescriptor(element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype, 'value').set; setter.call(element, value); element.dispatchEvent(new window.Event('input', { bubbles: true })); }); }

test('class management opens details and reveals creation on demand', async () => {
  const screen = await renderRoute('/turmas', 'dono');
  try {
    assert.equal(document.querySelectorAll('.class-card').length, 1);
    assert.equal(document.querySelector('.class-form'), null);
    await act(async () => document.querySelector('.class-card').click());
    assert.equal(document.querySelector('.class-details h2').textContent, 'Terceiro A');
    await act(async () => button('Criar turma ↗').click());
    assert.ok(document.querySelector('.class-form'));
  } finally { await screen.close(); }
});

test('activity management guides the first creation into the editor', async () => {
  const screen = await renderRoute('/atividades', 'docente');
  try {
    assert.ok(screen.container.textContent.includes('Sua primeira atividade, passo a passo.'));
    await act(async () => button('Montar primeira atividade →').click());
    assert.ok(screen.container.textContent.includes('Nova atividade'));
    assert.ok(document.querySelector('.activity-question-editor'));
  } finally { await screen.close(); }
});

test('materials library opens a missing resource and allows adding a reference', async () => {
  materialCatalogFixture = true;
  const screen = await renderRoute('/materiais', 'docente');
  try {
    assert.ok(screen.container.textContent.includes('Precisa de material'));
    await act(async () => document.querySelector('.materials-card').click());
    assert.equal(document.querySelector('[role="dialog"] h2').textContent, 'Leis de Newton');
    await act(async () => [...document.querySelectorAll('.materials-dialog button')].find(node => node.textContent.includes('Adicionar recurso')).click());
    assert.equal(document.querySelectorAll('.materials-extra').length, 1);
  } finally { await screen.close(); materialCatalogFixture = false; }
});

test('people directory groups account actions without changing permissions', async () => {
  const screen = await renderRoute('/usuarios', 'dono');
  try {
    assert.ok(screen.container.textContent.includes('Pessoas e acessos'));
    const menu = document.querySelector('.users-actions');
    assert.ok(menu);
    await act(async () => menu.querySelector('summary').click());
    assert.equal(menu.open, true);
    assert.ok([...menu.querySelectorAll('button')].some(node => node.textContent.trim() === 'Definir senha'));
    assert.ok(menu.querySelector('button').disabled);
  } finally { await screen.close(); }
});

test('all student, teacher and owner pages render without runtime failures', async t => {
  const routes = ['/', '/login', '/register', '/primeiro-acesso', '/onboarding', '/esqueci-senha', '/redefinir-senha', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/minha-jornada', '/minhas-atividades', '/minhas-turmas', '/minhas-turmas/1', '/avisos', '/perfil', '/alterar-senha', '/planejamento-inteligente', '/estudar', '/status', '/lumi', '/chat', '/preferencias', '/pagina-inexistente'];
  for (const route of routes) await t.test(route, async () => { const screen = await renderRoute(route); try { assert.ok(document.querySelector('h1'), 'page must have a visible title'); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.'), 'error boundary should not be shown'); } finally { await screen.close(); } });
  for (const [route, role] of [['/dashboard-gestor', 'docente'], ['/turmas', 'docente'], ['/atividades', 'docente'], ['/materiais', 'docente'], ['/usuarios', 'admin'], ['/dono', 'dono'], ['/dono/usuarios', 'dono']]) await t.test(`${role}: ${route}`, async () => { const screen = await renderRoute(route, role); try { assert.ok(document.querySelector('h1')); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.')); } finally { await screen.close(); } });
  for (const route of ['/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/planejamento-inteligente', '/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono', '/lumi', '/preferencias', '/perfil']) await t.test(`dono: ${route}`, async () => { const screen = await renderRoute(route, 'dono'); try { assert.ok(document.querySelector('h1')); assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.')); } finally { await screen.close(); } });
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
test('login and registration previews switch study stages without submitting forms', async () => {
  for (const route of ['/login', '/register']) {
    const screen = await renderRoute(route);
    try {
      const tabs = [...document.querySelectorAll('.auth-journey-tabs button')];
      assert.equal(tabs.length, 3);
      assert.equal(tabs[0].getAttribute('aria-pressed'), 'true');
      await act(async () => tabs[1].click());
      assert.equal(tabs[1].getAttribute('aria-pressed'), 'true');
      assert.match(document.querySelector('.auth-journey-copy h2').textContent, /Prática/);
      assert.equal(requests.filter(request => request.method === 'post').length, 0);
    } finally { await screen.close(); }
  }
});
test('owner can navigate through the main study and management links', async () => {
  const screen = await renderRoute('/inicio', 'dono');
  try {
    for (const path of ['/cronograma', '/aprendizagem', '/provas', '/redacoes', '/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono']) {
      const link = document.querySelector(`#app-sidebar a[href="${path}"]`);
      assert.ok(link, `missing navigation link ${path}`);
      await act(async () => link.click());
      await flush();
      if (path === '/usuarios') await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
      assert.ok(document.querySelector('h1'), `missing title at ${path}: ${screen.container.textContent.slice(0, 300)}`);
      assert.ok(!screen.container.textContent.includes('Algo não carregou como deveria.'), `error boundary at ${path}`);
    }
  } finally { await screen.close(); }
});
test('writing guidance opens Lumi with an editable question about ENEM essays', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    const link = [...document.querySelectorAll('a')].find(item => item.textContent.includes('Destrave seu argumento'));
    assert.ok(link, 'writing guidance should link to Lumi');
    await act(async () => link.click());
    await flush();
    const input = document.querySelector('.lumi-chat-body textarea, .lumi-chat-body input[type="text"]');
    assert.ok(input, 'Lumi should show a message field');
    assert.match(input.value, /tese.*argumentos/i);
  } finally { await screen.close(); }
});
test('writing workshop opens staged fields without hiding the essay history', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    const open = button('Abrir oficina →');
    assert.ok(open);
    await act(async () => open.click());
    assert.ok(document.querySelector('input[placeholder*="inclusão digital"]'));
    const argumentsStep = [...document.querySelectorAll('.writing-workshop-body nav button')].find(item => item.textContent.includes('Argumentos'));
    await act(async () => argumentsStep.click());
    assert.ok(document.querySelector('textarea[placeholder*="primeira causa"]'));
    assert.ok(document.getElementById('redacoes-historico'));
  } finally { await screen.close(); }
});
test('legacy progress link opens study tools with goals, cards and trails intact', async () => {
  const screen = await renderRoute('/planejamento-inteligente');
  try {
    assert.ok(screen.container.textContent.includes('Prepare o jeito de aprender'));
    await act(async () => button('Metas e diagnóstico').click());
    assert.ok(screen.container.textContent.includes('Diagnóstico inicial'));
    assert.ok(screen.container.textContent.includes('Meta por matéria'));
    await act(async () => button('Cartões e pesquisa').click());
    assert.ok(document.getElementById('progress-search-input'));
    assert.ok(screen.container.textContent.includes('Flashcards'));
    await act(async () => button('Trilhas e recomendações').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Progresso que vira ação'));
  } finally { await screen.close(); }
});

test('secondary study tools are reachable from their parent and loaded on demand', async () => {
  const screen = await renderRoute('/inicio');
  try {
    assert.equal(document.querySelector('.sd-navigation a[href="/sessao-guiada"]'), null);
    await act(async () => button('Montar sessão guiada').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Quanto tempo você tem'));
    assert.equal(document.querySelector('.sd-navigation a[aria-current="page"]')?.textContent, 'Hoje');
    await act(async () => button('← Voltar para Hoje').click());
    await flush();
    assert.ok(screen.container.textContent.includes('HOJE · UM PASSO DE CADA VEZ'));
    await act(async () => document.querySelector('.sd-navigation a[href="/aprendizagem"]').click());
    await flush();
    await act(async () => document.querySelector('a[href="/ferramentas-estudo"]').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Prepare o jeito de aprender'));
    assert.equal(document.querySelector('.sd-navigation a[aria-current="page"]')?.textContent, 'Praticar e revisar');
    const count = () => requests.filter(request => /\/inteligencia\/(flashcards|provas)$/.test(request.url)).length;
    assert.equal(count(), 0);
    await act(async () => button('Cartões e pesquisa').click());
    await flush();
    assert.equal(count(), 2);
    await act(async () => button('Metas e diagnóstico').click());
    await act(async () => button('Cartões e pesquisa').click());
    await flush();
    assert.equal(count(), 2, 'loaded tools are not fetched repeatedly');
  } finally { await screen.close(); }
});
test('pedagogical view presents actionable alerts and prevents duplicate intervention', async () => {
  const screen = await renderRoute('/dashboard-gestor', 'docente');
  try {
    assert.ok(screen.container.textContent.includes('Estudantes que pedem atenção'));
    assert.ok(screen.container.textContent.includes('Aluno de teste'));
    const action = button('Criar plano de intervenção →');
    assert.ok(action);
    await act(async () => action.click());
    await flush();
    assert.ok(button('Plano registrado →')?.disabled);
    assert.ok(requests.some(item => item.url.endsWith('/colaborativo/gestao/intervencoes') && item.method === 'post'));
  } finally { await screen.close(); }
});
test('Lumi starters prepare a question, then send one request and render safe structured text', async () => {
  failChat = false;
  const screen = await renderRoute('/lumi');
  try {
    assert.ok(screen.container.textContent.includes('EXPLORAR UMA DÚVIDA'));
    assert.equal(document.querySelectorAll('.lumi-starters button').length, 4);
    const starter = [...document.querySelectorAll('.lumi-starters button')][0];
    await act(async () => starter.click());
    const textarea = document.getElementById('lumi-message');
    assert.match(textarea.value, /funções do 2º grau/);
    assert.equal(requests.filter(request => request.method === 'post').length, 0, 'a suggestion must not send without confirmation');
    await act(async () => textarea.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(requests.filter(request => request.method === 'post').length, 1);
    assert.ok(document.querySelector('.lumi-message').textContent.includes('Uma **ideia** de cada vez.'));
    assert.equal(document.querySelectorAll('.lumi-feed script').length, 0);
    assert.ok(document.querySelector('.lumi-feed').textContent.includes('<script>unsafe()</script>'));
  } finally { await screen.close(); }
});
test('Lumi keeps the original portrait without reactions or a floating button', async () => {
  const screen = await renderRoute('/lumi');
  try {
    assert.equal(button('Pergunte à Lumi'), undefined);
    assert.ok(document.querySelector('.lumi-portrait img[src$="images/lumi-transparent.png"]'));
    assert.equal(document.querySelector('.lumi-mood'), null);
    assert.equal(document.querySelector('[class*="lumi-cat--feliz"], [class*="lumi-cat--raiva"]'), null);
  } finally { await screen.close(); }
});
test('chat adapts its wording to the chosen pronoun and stays neutral without a preference', async () => {
  for (const [pronome, frase] of [[undefined, 'Vamos pensar nisso?'], ['ela_dela', 'Vamos pensar juntas?'], ['ele_dele', 'Vamos pensar juntos?'], ['elu_delu', 'Vamos pensar juntes?'], ['nome_proprio', 'Vamos pensar nisso?']]) {
    const screen = await renderRoute('/lumi', 'aluno', { pronome });
    try { assert.ok(screen.container.textContent.includes(frase), `pronome ${pronome || 'não informado'}`); }
    finally { await screen.close(); }
  }
});
test('profile saves the optional pronoun preference to the signed-in account', async () => {
  const screen = await renderRoute('/perfil');
  try {
    const pronounSelect = [...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Pronomes'));
    assert.ok(pronounSelect);
    const preview = document.querySelector('.profile-pronoun-preview');
    assert.ok(preview?.textContent.includes('Vamos pensar nisso?'));
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(pronounSelect, 'elu_delu'); pronounSelect.dispatchEvent(new window.Event('change', { bubbles: true })); });
    assert.ok(preview.textContent.includes('Vamos pensar juntes?'));
    assert.ok(preview.textContent.includes('A preferência só muda no perfil quando você salvar'));
    await act(async () => button('Salvar alterações').click());
    await flush();
    assert.equal(JSON.parse(localStorage.getItem('user')).pronome, 'elu_delu');
    assert.ok(requests.some(request => request.method === 'put' && request.url.endsWith('/usuarios/900001')));
  } finally { await screen.close(); }
});
test('profile accepts custom pronouns without making the field required', async () => {
  const screen = await renderRoute('/perfil');
  try {
    const pronounSelect = [...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Pronomes'));
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, 'value').set;
    await act(async () => { setter.call(pronounSelect, 'personalizado'); pronounSelect.dispatchEvent(new window.Event('change', { bubbles: true })); });
    const customInput = document.querySelector('input[placeholder="Ex.: they/them, xe/xem ou ela/elu"]');
    assert.ok(customInput);
    assert.ok(screen.container.textContent.includes('Vamos pensar nisso?'));
    await inputValue(customInput, 'they/them');
    assert.ok(screen.container.textContent.includes('Preferência informada: they/them.'));
    await act(async () => button('Salvar alterações').click());
    await flush();
    assert.equal(JSON.parse(localStorage.getItem('user')).pronome, 'they/them');
    assert.ok(requests.some(request => request.method === 'put' && request.url.endsWith('/usuarios/900001') && JSON.parse(request.data).pronome === 'they/them'));
    assert.ok(document.querySelector('.save-feedback[data-state="saved"]'));
  } finally { await screen.close(); }
});
test('study room teaches the scheduled topic and gives Lumi its subject context', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' }, dia: { data_estudo: '2026-10-22' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('O que você precisa aprender'));
    assert.ok(screen.container.textContent.includes('Roteiro de estudo'));
    assert.ok(screen.container.querySelector('.session-lumi'));
    assert.equal(screen.container.querySelector('.session-timer'), null);
    const message = document.getElementById('lumi-message');
    await inputValue(message, 'Não entendi a primeira lei.');
    await act(async () => message.closest('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    const request = requests.find(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat'));
    assert.deepEqual(JSON.parse(request.data).estudoAtual, { titulo: 'Leis de Newton', disciplina: 'Física', data: '2026-10-22' });
    assert.equal(JSON.parse(request.data).disciplina, 'Física');
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
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

test('session Lumi shortcuts stay available and send the current topic exactly once', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' }, dia: { data_estudo: '2026-10-22' } }));
  const screen = await renderRoute('/estudar');
  try {
    for (const label of ['Explique de outro jeito', 'Dê um exemplo', 'Confira se entendi']) {
      const before = requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).length;
      await act(async () => button(label).click());
      await flush();
      const sent = requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat'));
      assert.equal(sent.length, before + 1);
      const payload = JSON.parse(sent.at(-1).data);
      assert.ok(payload.mensagem.includes('Leis de Newton'));
      assert.equal(payload.disciplina, 'Física');
      assert.equal(payload.estudoAtual.titulo, 'Leis de Newton');
      if (label === 'Confira se entendi') assert.ok(payload.mensagem.includes('Não revele a resposta agora'));
      assert.ok(button(label), 'shortcuts remain after a reply');
    }
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
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

test('schedule keeps the planned calendar date instead of moving it to the previous day', async () => {
  dailySchedulesFixture = [{ id_cronograma: 11, status: 'ATIVO', dias: [{ id_dia: 51, data_estudo: '2026-10-24', tempo_previsto: 25, concluido: 0, conteudos: [{ id: 71, titulo: 'Leitura de gráficos', disciplina: 'Matemática', concluido: 0 }] }] }];
  const screen = await renderRoute('/cronograma');
  try {
    assert.ok(document.querySelector('.schedule-journey-card').textContent.includes('24/10'));
    assert.ok(document.querySelector('.schedule-day').textContent.includes('24/10'));
  } finally { dailySchedulesFixture = []; await screen.close(); }
});

test('a schedule load failure cannot pretend the saved plan is empty and offers recovery', async () => {
  failScheduleLoad = true;
  const screen = await renderRoute('/cronograma');
  try {
    assert.ok(document.querySelector('.recovery-state'));
    assert.equal(document.querySelector('.schedule-page .empty-workspace'), null);
    assert.equal(button('Montar meu cronograma'),undefined);
    assert.ok(button('Tentar novamente'));
  } finally { failScheduleLoad=false;await screen.close(); }
});

test('a failed exam history is an error rather than an empty history', async () => {
  failExamLoad = true;
  const screen = await renderRoute('/provas');
  try {
    assert.ok(document.querySelector('.recovery-state'));
    assert.ok(screen.container.textContent.includes('suas tentativas não puderam ser carregados'));
    assert.ok(button('Tentar novamente'));
  } finally { failExamLoad=false;await screen.close(); }
});

test('today does not report zero progress or reviews up to date when the summary fails',async()=>{
  failLearningLoad=true;
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Seu progresso não pôde ser consultado.'));
    assert.ok(!document.querySelector('[aria-label="Progresso da meta semanal"]'));
    assert.ok(!screen.container.textContent.includes('Revisões em dia'));
  } finally {failLearningLoad=false;await screen.close();}
});

test('in-page study links keep the router address and move keyboard focus to the requested section', async () => {
  for (const [route,role,target] of [['/provas','aluno','laboratorio-provas'],['/redacoes','aluno','redacoes-historico'],['/dashboard-gestor','dono','pedagogy-priorities']]) {
    const screen=await renderRoute(route,role);
    try {
      const section=document.getElementById(target);
      const link=[...document.querySelectorAll('a')].find(node=>node.getAttribute('href')===`#${route}`);
      assert.ok(link);
      await act(async()=>link.click());
      assert.equal(document.activeElement.id,target);
      assert.equal(section.getAttribute('tabindex'),'-1');
      assert.ok(!screen.container.textContent.includes('Página não encontrada'));
    } finally {await screen.close();}
  }
});

test('owner operations panel opens the people directory', async () => {
  const screen = await renderRoute('/dono', 'dono');
  try {
    assert.ok(screen.container.textContent.includes('Operação da plataforma'));
    await act(async () => button('Abrir pessoas e acessos ↗').click());
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 350)); });
    assert.ok(screen.container.textContent.includes('Diretório de pessoas'));
  } finally { await screen.close(); }
});

test('support preserves a failed message and confirms receipt only after server success', async () => {
  supportMode = 'failed';
  const screen = await renderRoute('/preferencias');
  try {
    const panel = document.querySelector('.support-panel');
    const input = panel.querySelector('textarea');
    await inputValue(input, 'Minha mensagem de ajuda.');
    await act(async () => panel.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(input.value, 'Minha mensagem de ajuda.');
    assert.ok(panel.textContent.includes('Atendimento indisponível.'));
    assert.ok(!panel.textContent.includes('recebido'));
    supportMode = 'saved';
    await act(async () => panel.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    assert.equal(input.value, '');
    assert.ok(panel.textContent.includes('Pedido #81 recebido'));
    assert.ok(panel.textContent.includes('Minha mensagem de ajuda.'));
  } finally { supportMode = ''; await screen.close(); }
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

test('daily panel explains a practice recommendation using recorded attempts', async () => {
  dashboardLearningFixture = { metaSemanal: 180, minutosSemana: 0, revisoesHoje: 0, errosPendentes: 0, porDisciplina: [{ disciplina: 'Matemática', tentativas: 5, acerto: 40 }] };
  const screen = await renderRoute('/inicio');
  try {
    assert.equal(document.querySelector('.dash-v2-focus h2')?.textContent, 'Praticar Matemática');
    assert.ok(document.querySelector('.dash-v2-reason')?.textContent.includes('40% de acerto em 5 tentativas'));
    assert.ok(button('Praticar agora →'));
    assert.ok(button('Planejar com a Lumi'));
    await act(async () => button('Praticar agora →').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Simulado sob medida'));
    assert.equal(document.querySelector('.learning-tabs button[aria-pressed="true"]')?.textContent.trim(), 'Simulado');
    assert.equal([...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Disciplina'))?.value, 'Matemática');
  } finally { await screen.close(); dashboardLearningFixture = null; }
});

test('learning progress shows supported improvement and opens practice in the selected subject', async () => {
  dashboardLearningFixture = { porDisciplina: [{ disciplina: 'Física', tentativas: 5, acerto: 40 }], revisoesHoje: 0 };
  evolutionFixture = [{ disciplina: 'Biologia', anterior: 40, atual: 75, variacao: 35, comparavel: true, amostra_atual: 4, amostra_anterior: 5 }];
  const screen = await renderRoute('/aprendizagem');
  try {
    assert.ok(screen.container.textContent.includes('Mais acertos em Biologia'));
    assert.ok(screen.container.textContent.includes('4 respostas nos últimos 30 dias'));
    await act(async () => button('Praticar Física →').click());
    assert.equal(document.querySelector('.learning-tabs button[aria-pressed="true"]').textContent, 'Simulado');
    assert.equal([...document.querySelectorAll('select')].find(node => node.parentElement?.textContent.includes('Disciplina'))?.value, 'Física');
  } finally { await screen.close(); dashboardLearningFixture = null; evolutionFixture = []; }
});

test('main routes expose labels and landmarks to assistive technology', async () => {
  const routes = ['/', '/login', '/register', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/lumi', '/perfil', '/planejamento-inteligente', '/minha-jornada', '/preferencias', '/minhas-atividades', '/minhas-turmas', '/avisos', '/status'];
  const management = ['/dashboard-gestor', '/turmas', '/atividades', '/materiais', '/usuarios', '/dono', '/dono/usuarios'];
  for (const route of [...routes, ...management]) {
    const screen = await renderRoute(route, management.includes(route) ? 'dono' : 'aluno');
    try {
      const results = await axe.run(document, { rules: { 'color-contrast': { enabled: false } } });
      const failures = results.violations.map((item) => `${item.id}: ${item.nodes.map((node) => node.target.join(' ')).join(', ')}`);
      assert.deepEqual(failures, [], `${route}: ${failures.join('; ')}`);
    } finally { await screen.close(); }
  }
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

test('curated sources filter free access and keep the original providers visible', async () => {
  const screen = await renderRoute('/fontes-estudo');
  try {
    assert.ok(screen.container.textContent.includes('Fonte oficial'));
    assert.ok(document.querySelector('a[href="https://vestibular.fgv.br/provas-gabaritos"]'));
    const free = document.querySelector('.sources-check input');
    await act(async () => free.click());
    assert.equal(document.querySelector('a[href="https://aprovatotal.com.br/"]'), null);
    assert.ok(document.querySelector('a[href="https://cursoenemgratuito.com.br/"]'));
    await inputValue(document.querySelector('.sources-controls input[type="search"]'), 'zzzz');
    assert.ok(screen.container.textContent.includes('Nenhuma fonte neste filtro'));
    assert.equal(document.querySelectorAll('.sources-grid article').length, 0);
  } finally { await screen.close(); }
});

test('a quiz carries the selected answer into Lumi without sending a message or a hidden answer key', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('Repouso ou velocidade vetorial constante'));
    const option = document.querySelector('.study-guide-options button');
    const answerText = option.querySelector('span').textContent;
    await act(async () => option.click());
    await act(async () => button('Pensar nesta questão com a Lumi').click());
    assert.equal(requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).length, 0);
    assert.equal(document.querySelector('.lumi-practice label:last-of-type textarea').value, answerText);
    assert.equal(button('Ver resolução comentada'), undefined);
    await act(async () => button('Conferir minha tentativa').click());
    await flush();
    const request = requests.find(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat'));
    const { pratica } = JSON.parse(request.data);
    assert.equal(pratica.modo, 'feedback');
    assert.equal(pratica.tentativa, answerText);
    assert.equal(pratica.respostaCorreta, undefined);
    assert.ok(button('Ver resolução comentada'));
    await act(async () => button('Ver resolução comentada').click());
    await flush();
    assert.equal(JSON.parse(requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).at(-1).data).pratica.modo, 'resolucao');
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('a failed tutoring request preserves the attempt and never unlocks the full solution', async () => {
  const screen = await renderRoute('/lumi');
  failChat = true;
  try {
    await act(async () => document.querySelector('.lumi-practice summary').click());
    const fields = document.querySelectorAll('.lumi-practice textarea');
    await inputValue(fields[0], 'Resolva 3x = 12');
    await inputValue(fields[1], 'Dividi por 3 e achei x = 4.');
    await act(async () => button('Conferir minha tentativa').click());
    await flush();
    assert.equal(fields[1].value, 'Dividi por 3 e achei x = 4.');
    assert.equal(button('Ver resolução comentada'), undefined);
  } finally { await screen.close(); failChat = false; }
});

test('unsupported subjects are clearly labelled as general study methods', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, titulo: 'Tema ainda sem aula', disciplina: 'Geral' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('ROTEIRO GERAL DE ESTUDO'));
    assert.ok(screen.container.textContent.includes('ainda não há uma aula específica'));
    assert.ok(screen.container.textContent.includes('não o domínio do tema indicado'));
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('external reading opens at the original source instead of an iframe that may be blocked', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, titulo: 'Ecologia', disciplina: 'Biologia', link: 'https://brasilescola.uol.com.br/biologia/cadeia-alimentar.htm' } }));
  const screen = await renderRoute('/estudar');
  try {
    await act(async () => button('Fonte principal').click());
    await flush();
    assert.equal(document.querySelectorAll('.session-canvas iframe').length, 0);
    const source = [...document.querySelectorAll('.session-canvas a')].find(link => link.textContent.includes('Abrir material na fonte original'));
    assert.equal(source?.target, '_blank');
    assert.ok(source?.href.includes('/biologia/cadeia-alimentar.htm'));
    assert.ok(screen.container.textContent.includes('do organismo que serve de alimento para quem o consome'));
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('an incomplete account can explore sources without marking setup complete', async () => {
  incompleteAccount = true;
  const screen = await renderRoute('/fontes-estudo');
  try {
    assert.ok(screen.container.textContent.includes('Uma boa pergunta'));
    assert.ok(screen.container.textContent.includes('Preparar meu plano'));
    assert.equal(localStorage.getItem('perfil_completo'), 'false');
    assert.equal(requests.some(request => request.method === 'post' && request.url.endsWith('/cronograma/gerar')), false);
  } finally { incompleteAccount = false; await screen.close(); }
});

test('first setup makes school year optional and offers exploration before generating anything', async () => {
  const screen = await renderRoute('/onboarding');
  try {
    assert.equal(document.getElementById('setup-year').required, false);
    assert.equal(document.getElementById('setup-goal').value, 'ENEM');
    assert.ok(button('Explorar primeiro →'));
    await act(async () => button('Explorar primeiro →').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Seu primeiro passo pode ser pequeno'));
    assert.equal(localStorage.getItem('perfil_completo'), 'false');
  } finally { await screen.close(); }
});

test('a new student sees useful first steps without an empty progress dashboard', async () => {
  incompleteAccount = true;
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(document.querySelector('.first-study'));
    assert.equal(document.querySelector('.dash-v2-score'), null);
    assert.ok(document.querySelector('.first-study a[href="/onboarding"]'));
    await act(async () => document.querySelector('.first-study a[href="/lumi"]').click());
    await flush();
    assert.ok(document.querySelector('#lumi-message'));
    assert.equal(requests.filter(item=>item.method==='post' && item.url.includes('/chat')).length,0);
  } finally { incompleteAccount=false;await screen.close(); }
});

test('first steps respect an already saved study profile', async () => {
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(document.querySelector('.first-study a[href="/cronograma"]'));
    assert.equal(document.querySelector('.first-study a[href="/onboarding"]'),null);
    assert.ok(screen.container.textContent.includes('Seu perfil já está preparado.'));
  } finally { await screen.close(); }
});

test('returning to an unfinished setup recovers the server profile instead of requesting subjects again', async () => {
  onboardingProfileFixture = { areas_foco: 'Física', objetivo: 'VESTIBULAR', tempo_diario_min: 45, ano_escolar: '', prazo_estimado: 30 };
  const screen = await renderRoute('/onboarding');
  try {
    assert.ok(screen.container.textContent.includes('Etapa 2 de 2'));
    await act(async () => button('Voltar').click());
    assert.equal(document.getElementById('setup-minutes').value, '45');
    assert.equal(document.getElementById('setup-goal').value, 'VESTIBULAR');
  } finally { onboardingProfileFixture = null; await screen.close(); }
});

test('a new device resumes a pending session from the account without local session storage', async () => {
  window.sessionStorage.clear();
  continuityFixture = { conteudo: { id: 51, id_conteudo: 9, titulo: 'Sessão recuperada da conta', disciplina: 'Física' }, dia: { id_dia: 3, data_estudo: '2026-10-24' } };
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('Sessão recuperada da conta'));
    assert.ok(screen.container.textContent.includes('Retomada desta sessão salva na sua conta'));
    assert.ok(requests.some(request => request.method === 'put' && request.url.endsWith('/estudo-em-andamento') && JSON.parse(request.data).idItem === 51));
  } finally { continuityFixture = null; window.sessionStorage.clear(); await screen.close(); }
});

test('session content without the current account scope is never restored', async () => {
  window.sessionStorage.setItem('planejai:active-study-content', JSON.stringify({ conteudo: { titulo: 'Texto de outra conta' } }));
  window.sessionStorage.setItem('900002:active-study-content', JSON.stringify({ conteudo: { titulo: 'Texto privado' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(screen.container.textContent.includes('Nenhum conteúdo foi escolhido'));
    assert.equal(screen.container.textContent.includes('Texto privado'), false);
    assert.equal(screen.container.textContent.includes('Texto de outra conta'), false);
  } finally { window.sessionStorage.clear(); await screen.close(); }
});

test('learning load failure is a retryable error, never an empty progress report', async () => {
  failLearningLoad = true;
  const screen = await renderRoute('/aprendizagem');
  try {
    assert.ok(screen.container.textContent.includes('Não conseguimos consultar seu progresso'));
    assert.equal(document.querySelector('.learning-hero'), null);
    failLearningLoad = false;
    await act(async () => document.querySelector('.recovery-state button').click()); await flush();
    assert.ok(document.querySelector('.learning-hero'), screen.container.textContent.slice(-1200));
  } finally { failLearningLoad = false; await screen.close(); }
});

test('essay failure preserves the editor and an account-scoped draft immediately', async () => {
  const screen = await renderRoute('/redacoes');
  essayMode = 'failure';
  try {
    assert.equal(requests.some(r => r.url.endsWith('/redacao/portfolio')), false);
    assert.equal(requests.some(r => r.url.endsWith('/redacao/projetos')), false);
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Educação e acesso');
    const text = 'A educação permite compreender a sociedade e participar de decisões coletivas. '.repeat(5);
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), text);
    assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto, text);
    await act(async () => button('Finalizar e enviar').click()); await flush();
    assert.ok(document.querySelector('.essay-sheet .save-feedback[data-state="error"]'));
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, text);
    assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto, text);
  } finally { essayMode = ''; await screen.close(); }
});

test('queued essay keeps its text and prevents the same version being submitted twice', async () => {
  const screen = await renderRoute('/redacoes');
  essayMode = 'queued';
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Acesso à educação');
    const text = 'Uma escola acessível precisa de condições para que os estudantes possam aprender. '.repeat(5);
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), text);
    await act(async () => button('Finalizar e enviar').click()); await flush();
    assert.ok(screen.container.textContent.includes('já foi encaminhada pela fila'));
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, text);
    assert.ok(button('Nesta versão: envio na fila').disabled);
    assert.equal(requests.filter(r => r.method === 'post' && r.url.endsWith('/redacao')).length, 1);
    assert.ok(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).queuedVersion);
  } finally { essayMode = ''; await screen.close(); }
});

test('essay editor ignores drafts without the current account owner', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    localStorage.setItem('planejai:redacao:rascunho:v2', JSON.stringify({ tema: 'Privado', texto: 'De outra conta' }));
    localStorage.setItem('900002:essay-draft:v3', JSON.stringify({ tema: 'Privado', texto: 'De outra conta' }));
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    assert.equal(document.getElementById('essay-topic').value, '');
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, '');
  } finally { await screen.close(); }
});

test('a full device store keeps the essay editable and warns instead of claiming it was saved', async () => {
  const screen = await renderRoute('/redacoes');
  const original = window.Storage.prototype.setItem;
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    window.Storage.prototype.setItem = () => { throw new Error('Quota exceeded'); };
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), 'Texto que precisa ser preservado.');
    assert.ok(document.querySelector('.save-feedback[data-state="unsaved"]'));
    assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value, 'Texto que precisa ser preservado.');
  } finally { window.Storage.prototype.setItem = original; await screen.close(); }
});

test('clearing both essay fields does not resurrect an old draft when the editor reopens', async () => {
  const screen = await renderRoute('/redacoes');
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Tema antigo');
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), 'Texto antigo');
    await inputValue(document.getElementById('essay-topic'), '');
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), '');
    assert.equal(localStorage.getItem('900001:essay-draft:v3'), null);
  } finally { await screen.close(); }
});

test('guided workshop waits for its saved project and keeps edits when saving fails', async () => {
  const screen = await renderRoute('/redacoes');
  essayMode = 'workshopFailure';
  try {
    assert.equal(requests.some(r => r.url.endsWith('/redacao/projetos')), false);
    await act(async () => button('Abrir oficina →').click()); await flush();
    await inputValue(document.querySelector('.writing-workshop-editor input'), 'Inclusão digital');
    await act(async () => button('Salvar esta etapa').click()); await flush();
    assert.equal(document.querySelector('.writing-workshop-editor input').value, 'Inclusão digital');
    assert.ok(document.querySelector('.writing-workshop .save-feedback[data-state="error"]'));
  } finally { essayMode = ''; await screen.close(); }
});

for (const outcome of ['confirmed', 'queued']) test(`late ${outcome} essay response cannot erase text arriving after submission`, async () => {
  const screen = await renderRoute('/redacoes');
  const previous = window.SpeechRecognition;
  let recognition;
  window.SpeechRecognition = class { constructor() { recognition = this; } start() {} stop() {} };
  essayMode = 'deferred';
  try {
    await act(async () => document.querySelector('.redacoes-intro-actions button').click()); await flush();
    await inputValue(document.getElementById('essay-topic'), 'Educação');
    const text = 'A escola deve oferecer condições de aprendizagem para todos os estudantes. '.repeat(5);
    await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'), text);
    await act(async () => button('Ditado por voz').click());
    await act(async () => button('Finalizar e enviar').click());
    await act(async () => recognition.onresult({ resultIndex: 0, results: [[{ transcript: 'ideia posterior' }]] }));
    await act(async () => deferredEssay(outcome === 'queued' ? { offline: true, queueId: 123 } : { redacao: { id_redacao: 73, tema: 'Educação', texto: text } }));
    await flush();
    assert.ok(document.querySelector('textarea[aria-label="Texto da redação"]').value.includes('ideia posterior'));
    assert.ok(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto.includes('ideia posterior'));
  } finally { window.SpeechRecognition = previous; essayMode = ''; await screen.close(); }
});

test('slow route loading explains the wait without reloading or replacing the page', async () => {
  const { RouteLoading } = await getBundle();
  const original = window.setTimeout;
  let slow;
  window.setTimeout = (callback, delay, ...args) => delay === 8000 ? (slow = callback, 999999) : original(callback, delay, ...args);
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(RouteLoading)));
    await act(async () => slow());
    assert.ok(document.body.textContent.includes('Está demorando mais que o esperado'));
    assert.equal(document.querySelectorAll('button').length, 0);
  } finally { window.setTimeout = original; await act(async () => root.unmount()); }
});

test('navigation shortcuts leave typed text alone and still work outside form fields', async () => {
  const { PageExperience, ThemeProvider, AccessibilityProvider } = await getBundle();
  const { useLocation } = requireFrontend('react-router-dom');
  function Probe() { return React.createElement('p', { id: 'path-probe' }, useLocation().pathname); }
  const root = createRoot(document.getElementById('root'));
  try {
    await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/redacoes'] }, React.createElement(ThemeProvider, null, React.createElement(AccessibilityProvider, null, React.createElement(PageExperience), React.createElement('textarea', { defaultValue: 'Texto em andamento' }), React.createElement(Probe))))));
    await act(async () => document.querySelector('textarea').dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, altKey: true, key: 'c' })));
    assert.equal(document.getElementById('path-probe').textContent, '/redacoes');
    assert.equal(document.querySelector('textarea').value, 'Texto em andamento');
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { bubbles: true, cancelable: true, altKey: true, key: 'c' })));
    assert.equal(document.getElementById('path-probe').textContent, '/cronograma');
  } finally { await act(async () => root.unmount()); }
});
