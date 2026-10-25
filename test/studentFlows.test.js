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
let continuityFailure = false;
let reviewQueueFixture = [];
let postponeFailure = false;
let onboardingProfileFixture = null;
let incompleteAccount = false;
let failLearningLoad = false;
let essayMode = '';
let deferredEssay;
let searchMode = '';
let deferredSearch;
let journalFailure = false;
let journalDoubt = false;
let journalResolved = 0;
let closingFailure=false;
let notesWriteFailure=false;
let returnsFixture=null;
let returnsFailure=false;
let personalFailure=false;
let intentMode='',deferredIntent;
let directoryOtherAccount=false;
let planningWriteFailure=false;
let deskItems=[{id:31,tipo:'anotacao',id_origem:9,titulo:'Leis de Newton',trecho:'Um exemplo meu',disponivel:true},{id:32,tipo:'duvida',id_origem:71,titulo:'Força e velocidade',disponivel:true}];
let journalSteps = [{id:11,tipo:'explicacao',texto:'Primeira versão preservada',criado_em:'2026-10-20T12:00:00'}, {id:12,tipo:'explicacao',texto:'Segunda versão com exemplo',criado_em:'2026-10-25T12:00:00'}];
const person = role => ({ id: 900001, id_usuario: 900001, nome: 'Estudante de teste', email: 'fixture@example.invalid', tipo: role, ativo: 1 });
function fixture(config) {
  const url = `${config.baseURL || ''}${config.url || ''}`.replace(/\/$/, '');
  requests.push({ url, method: config.method, data: config.data, params:config.params, cache:config.cache });
  if(planningWriteFailure && config.method==='post' && (url.endsWith('/perfil') || url.endsWith('/perfil/disponibilidade')))throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
  if(essayMode==='success' && config.method==='post' && url.endsWith('/redacao'))return {redacao:{id_redacao:88,...JSON.parse(config.data)}};
  if(essayMode==='workshopSuccess' && config.method==='post' && url.endsWith('/redacao/projetos'))return {id_projeto:84,...JSON.parse(config.data)};
  if(url.endsWith('/redacao/revisar-intencao')){
    if(intentMode==='failure')throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'A Lumi não conseguiu concluir esta revisão.'}});
    const answer={intencao:JSON.parse(config.data).intencao,observacao:'A ideia precisa de uma relação causal.',sugestao:'Explique como a biblioteca aproxima o livro do estudante.',motivo:'O exemplo sustenta a afirmação.',pergunta:'Que situação da sua experiência ilustra isso?'};
    if(intentMode==='deferred')return new Promise(resolve=>{deferredIntent=()=>resolve(answer)});
    return answer;
  }
  if(url.includes('/aprendizagem/mesa')||url.includes('/aprendizagem/entendimento')){
    if(personalFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Seu espaço está temporariamente indisponível.'}});
    if(url.endsWith('/mesa')&&config.method==='get')return {itens:deskItems,limite:6};
    if(url.endsWith('/mesa')&&config.method==='post')return {id:31,fixado:true};
    if(url.endsWith('/mover')){deskItems=[...deskItems].reverse();return {ordenado:true}};
    if(url.endsWith('/mesa/31')&&config.method==='delete'){deskItems=deskItems.filter(item=>item.id!==31);return {retirado:true}};
    if(url.endsWith('/mesa/31/abrir'))return {tipo:'anotacao',id_origem:9,item:{id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}};
    if(url.endsWith('/mesa/32/abrir'))return {tipo:'duvida',id_origem:71,item:{id:71,titulo:'Força e velocidade'}};
    if(url.endsWith('/entendimento'))return {itens:[{passo:102,registro:71,registro_tipo:'explicacao',titulo:'Força e velocidade',tipo:'explicacao',versao:2,trecho:'Minha nova explicação',criado_em:'2026-10-25T12:00:00'}],mais:false,pagina:1};
    if(url.endsWith('/entendimento/102'))return {id:102,id_diario:71,registro_tipo:'explicacao',tipo:'explicacao',texto:'Minha nova explicação completa',criado_em:'2026-10-25T12:00:00',anterior:{id:1,texto:'Minha versão anterior original',criado_em:'2026-10-20T12:00:00'}};
  }
  if(url.endsWith('/aprendizagem/retomadas')) {
    if(returnsFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
    return returnsFixture || {principal:null,explicacao:null,duvida:null,revisao:null,proximoPasso:null};
  }
  if(url.endsWith('/aprendizagem/fechamentos')) {
    if(closingFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Fechamento ainda não confirmado.'}});
    const data=JSON.parse(config.data);
    return {confirmado:true,fechamento:{id:89,id_conteudo:data.idConteudo,proximo_passo:data.proximoPasso,sintese:{titulo:'Leis de Newton',disciplina:'Física',minutos:5,resultado:data.resultado,anotacoes:notesWriteFailure?0:1,explicacoes:2,totalDuvidas:1,duvidas:[{id:71,titulo:'Ainda confundo força e velocidade'}]}}};
  }
  if(url.endsWith('/fechamentos/89/retomar'))return {conteudo:{id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'}};
  if(url.endsWith('/fechamentos/89/retomado')){returnsFixture=null;return {confirmado:true}};
  if(notesWriteFailure && url.endsWith('/conteudos/9/anotacao') && config.method==='put')throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
  if(url.endsWith('/aprendizagem/diario')) {
    if(config.method==='post') {
      if(journalFailure)throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{message:'Não foi possível confirmar.'}});
      return {id:71,salvo:true};
    }
    return {itens:[{id:71,titulo:'Força e movimento',tipo:config.params.tipo,atualizado_em:'2026-10-25T12:00:00',versoes:2,retomar:1}],mais:false,pagina:1};
  }
  if(url.endsWith('/diario/71'))return {id:71,titulo:'Força e movimento',tipo:journalDoubt?'duvida':'explicacao',resolvido:journalResolved,passos:journalSteps,mais:false};
  if(url.endsWith('/diario/71/passos')){const data=JSON.parse(config.data);if(data.tipo==='resolucao')journalResolved=1;if(data.tipo==='reabertura')journalResolved=0;return {id:71,salvo:true}};
  if(url.endsWith('/diario/71/lumi'))return {resposta:'Seu exemplo tornou a ideia mais clara. O que muda se a força resultante for zero?'};
  if (url.endsWith('/busca')) {
    if(searchMode==='failed') throw new axios.AxiosError('unavailable','ERR_BAD_RESPONSE',config,null,{status:503,data:{}});
    if(searchMode==='slow' && config.params.q==='antiga') return new Promise(resolve=>{deferredSearch=resolve});
    if(searchMode==='empty') return {query:config.params.q,pagina:1,limite:12,grupos:[]};
    const groups=[{tipo:'materias',nome:'Matérias',itens:[{id:'Física',titulo:'Física'}]}, {tipo:'materiais',nome:'Materiais',mais:true,itens:[{id:9,titulo:'Leis de Newton',disciplina:'Física',trecho:'Força e movimento.'}]}, {tipo:'anotacoes',nome:'Anotações',itens:[{id:9,titulo:'Minha leitura de Newton',disciplina:'Física',trecho:'Minha dúvida sobre inércia.'}]}, {tipo:'redacoes',nome:'Redações',itens:[{id:81,titulo:'Educação no Brasil',trecho:'Um texto de teste.'}]}];
    return {query:config.params.q,pagina:Number(config.params.pagina)||1,limite:12,grupos:groups.filter(group=>config.params.tipo==='todos'||group.tipo===config.params.tipo)};
  }
  if(url.endsWith('/busca/conteudos/9')) return {id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física',materiais:'[]',link:''};
  if(searchMode && url.endsWith('/redacao') && config.method==='get') return [{id_redacao:81,tema:'Educação no Brasil',texto:'Um texto de teste.',enviada_em:'2026-10-24',id_usuario:900001}];
    if ((failScheduleLoad && url.endsWith('/cronograma')) || (failExamLoad && url.endsWith('/inteligencia/catalogo-provas'))) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (essayMode === 'workshopFailure' && config.method === 'post' && url.endsWith('/redacao/projetos')) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (failLearningLoad && url.endsWith('/aprendizagem/resumo')) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
  if (url.endsWith('/redacao') && config.method === 'post') {
    if (essayMode === 'deferred') return new Promise(resolve => { deferredEssay = resolve; });
    if (essayMode === 'failure') throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: { message: 'Envio temporariamente indisponível.' } });
    if (essayMode === 'queued') return { offline: true, queued: true, queueId: 123 };
  }
  if (url.endsWith('/aprendizagem/estudo-em-andamento')) {
    if (continuityFailure && config.method === 'get') throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
    return config.method === 'get' ? continuityFixture : { salvo: true };
  }
  if (url.endsWith('/aprendizagem/revisoes')) return reviewQueueFixture;
  if (/\/aprendizagem\/revisoes\/\d+\/adiar$/.test(url)) {
    if (postponeFailure) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, { status: 503, data: {} });
    reviewQueueFixture = [];
    return { message: 'Revisão reagendada.' };
  }
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
  if (url.endsWith('/usuarios')) return { usuarios: [directoryOtherAccount?{...person('aluno'),id:900002,id_usuario:900002}:person('aluno')], pagina: 1, total_registros: 17, total_paginas: 2, stats: { total: 17, ativos: 15, inativos: 2, donos: 1, admins: 2, docentes: 3, alunos: 11 } };
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
    stdin: { contents: `export { default as Login } from './src/pages/Login'; export { AuthContext } from './src/context/AuthContext'; export { default as App } from './src/App'; export { default as RouteLoading } from './src/components/RouteLoading'; export { default as PageExperience } from './src/components/PageExperience'; export { ThemeProvider } from './src/context/ThemeContext'; export { AccessibilityProvider } from './src/context/AccessibilityContext'; export { default as ErrorBoundary } from './src/components/ErrorBoundary';`, resolveDir: frontendDir, loader: 'jsx' },
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
async function renderRoute(route, role = 'aluno', userOverrides = {}, stored = {}) {
  setupCompleteFixture = route !== '/onboarding' && !incompleteAccount;
  localStorage.clear();
  const token = [Buffer.from('{"alg":"HS256"}').toString('base64'), Buffer.from(JSON.stringify({ id: 900001, exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64'), 'fixture'].join('.');
  for (const [key, value] of Object.entries({ token, user: JSON.stringify({ ...person(role), ...userOverrides }), perfil_completo: route === '/onboarding' ? 'false' : 'true', primeiro_acesso: route === '/primeiro-acesso' ? 'true' : 'false', theme: 'light' })) localStorage.setItem(key, value);
  requests = [];
  for(const [key,value] of Object.entries(stored))localStorage.setItem(key,value);
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
    assert.ok(screen.container.querySelector('.study-desk-lumi'));
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    await flush();
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
test('reading mode and collapsed Lumi preserve question and note drafts without sending them', async () => {
  window.sessionStorage.setItem('900001:active-study-content', JSON.stringify({ conteudo: { id: 51, id_conteudo: 9, titulo: 'Leis de Newton', disciplina: 'Física' } }));
  const screen = await renderRoute('/estudar');
  try {
    assert.ok(!document.getElementById('lumi-message'));
    assert.equal(requests.filter(item => item.url.endsWith('/inteligencia/chat')).length,0);
    await act(async () => document.querySelector('.study-desk-note-link button').click());
    await flush();
    await inputValue(document.querySelector('.session-notes textarea'),'Minha ideia sobre inércia.');
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    await flush();
    await inputValue(document.getElementById('lumi-message'),'Uma dúvida ainda não enviada.');
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    assert.equal(document.getElementById('study-desk-lumi-body').hidden,true);
    await act(async () => button('Modo leitura').click());
    assert.equal(document.querySelector('.session-tools').hidden,true);
    assert.equal(document.querySelector('.session-notes textarea').value,'Minha ideia sobre inércia.');
    await act(async () => button('Sair do modo leitura').click());
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    assert.equal(document.getElementById('lumi-message').value,'Uma dúvida ainda não enviada.');
    assert.equal(requests.filter(item => item.method === 'post' && item.url.endsWith('/inteligencia/chat')).length,0);
    const result = await axe.run(document.querySelector('.study-desk'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(item => item.id),[]);
  } finally { await screen.close(); window.sessionStorage.removeItem('900001:active-study-content'); }
});

test('weekly schedule navigates and opens details without unlocking or writing the plan', async () => {
  const monday = new Date(new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo'}).format(new Date())+'T12:00:00Z');
  monday.setUTCDate(monday.getUTCDate()-((monday.getUTCDay()+6)%7));
  const firstDate=monday.toISOString().slice(0,10);
  monday.setUTCDate(monday.getUTCDate()+7);
  const secondDate=monday.toISOString().slice(0,10);
  dailySchedulesFixture = [{id_cronograma:11,status:'ATIVO',dias:[
    {id_dia:51,data_estudo:firstDate,tempo_previsto:25,concluido:0,conteudos:[{id:71,titulo:'Leitura de gráficos',disciplina:'Matemática',concluido:0}]},
    {id_dia:52,data_estudo:secondDate,tempo_previsto:40,concluido:0,bloqueado:true,conteudos:[{id:72,titulo:'Geometria',disciplina:'Matemática',concluido:0}]}
  ]}];
  const screen = await renderRoute('/cronograma');
  try {
    const before = requests.length;
    await act(async () => button('Semana').click());
    assert.equal(document.querySelectorAll('.schedule-week-day').length,7);
    assert.equal(localStorage.getItem('900001:schedule-view'),'week');
    assert.equal(localStorage.getItem('900002:schedule-view'),null);
    assert.ok(document.querySelector('.schedule-week').textContent.includes('25 min planejados'));
    await act(async () => document.querySelector('[aria-label="Próxima semana"]').click());
    assert.ok(document.querySelector('.schedule-week').textContent.includes('40 min planejados'));
    assert.equal(document.querySelector('[aria-label="Próxima semana"]').disabled,true);
    const result = await axe.run(document.querySelector('.schedule-week'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(item => item.id),[]);
    await act(async () => document.querySelector('.schedule-week-entry button').click());
    await flush();
    assert.ok(document.querySelector('#schedule-day-52').classList.contains('is-locked'));
    assert.ok(!document.querySelector('#schedule-day-52 .schedule-day-content'));
    assert.equal(document.activeElement,document.querySelector('#schedule-day-52 h3'));
    await act(async () => button('Semana').click());
    assert.ok(document.querySelector('.schedule-week').textContent.includes('40 min planejados'));
    await act(async () => document.querySelector('[aria-label="Semana anterior"]').click());
    await act(async () => document.querySelector('.schedule-week-entry button').click());
    await flush();
    assert.equal(document.activeElement,document.querySelector('#schedule-day-51 h3'));
    assert.ok(document.querySelector('#schedule-day-51 .schedule-day-content'));
    assert.equal(requests.length,before,'switching views uses the loaded plan without API calls');
  } finally { dailySchedulesFixture=[]; await screen.close(); }
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
    await act(async () => document.querySelector('.study-desk-tool-toggle').click());
    await flush();
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

test('unified search submits content queries, keeps page shortcuts and avoids fetching while typing', async () => {
  const screen=await renderRoute('/inicio');
  try {
    await act(async()=>document.querySelector('.sd-search-trigger').click());
    assert.ok(screen.container.textContent.includes('Buscar no meu acervo'));
    await inputValue(document.querySelector('.sd-search input'),'Newton');
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,0);
    await act(async()=>document.querySelector('.sd-search form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    await flush();await flush();
    assert.ok(document.querySelector('.unified-search'));
    assert.ok(document.querySelector('.unified-search-status').textContent.includes('Newton'));
    assert.equal(requests.find(item=>item.url.endsWith('/busca')).cache,false);
    const before=requests.filter(item=>item.url.endsWith('/busca')).length;
    await inputValue(document.getElementById('unified-query'),'inércia');
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,before);
    const result=await axe.run(document.querySelector('.unified-search'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(item=>item.id),[]);
  } finally {await screen.close();}
});

test('search opens personal notes in their editor and rechecks material access', async () => {
  window.sessionStorage.clear();
  const screen=await renderRoute('/busca?q=Newton&tipo=anotacoes');
  try {
    await act(async()=>button('Ver anotação +').click());await flush();
    assert.ok(requests.some(item=>item.url.endsWith('/busca/conteudos/9')&&item.cache===false));
    await act(async()=>document.querySelector('.search-content-details a').click());await flush();await flush();
    assert.ok(document.querySelector('.session-notes textarea'));
    assert.equal(requests.filter(item=>item.method==='post').length,0);
  } finally {await screen.close();window.sessionStorage.clear();}
});

test('search filters paginate and an older slow response cannot replace the current results', async () => {
  searchMode='slow';
  const screen=await renderRoute('/busca?q=antiga');
  try {
    await inputValue(document.getElementById('unified-query'),'Newton');
    await act(async()=>document.querySelector('.unified-search-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    await flush();
    await act(async()=>deferredSearch({query:'antiga',grupos:[]}));await flush();
    assert.ok(document.querySelector('.unified-search-status').textContent.includes('Newton'));
    await act(async()=>document.querySelector('.unified-search-filters button:nth-child(3)').click());await flush();
    await act(async()=>button('Próximos →').click());await flush();
    const last=requests.filter(item=>item.url.endsWith('/busca')).at(-1);
    assert.equal(last.params.tipo,'materiais');assert.equal(last.params.pagina,2);
    assert.ok(button('← Anteriores'));
  } finally {searchMode='';await screen.close();}
});

test('search failures preserve input and retry without pretending the account has no matches', async () => {
  searchMode='failed';
  const screen=await renderRoute('/busca?q=Newton');
  try {
    assert.ok(screen.container.textContent.includes('Não conseguimos consultar seu acervo.'));
    assert.equal(document.getElementById('unified-query').value,'Newton');
    assert.ok(!screen.container.textContent.includes('Nenhum resultado nesta busca.'));
    searchMode='ready';await act(async()=>document.querySelector('.unified-search-empty button').click());await flush();
    assert.ok(document.querySelector('a[href="/redacoes?redacao=81"]'),screen.container.textContent.slice(-1800));
    await act(async()=>document.querySelector('a[href="/redacoes?redacao=81"]').click());await flush();await flush();
    assert.ok(document.querySelector('#essay-record-81 .essay-record__details'));
  } finally {searchMode='';await screen.close();}
});

test('search trigger focuses the page search input', async () => {
  const screen = await renderRoute('/inicio');
  try {
    await act(async () => document.querySelector('.sd-search-trigger').click());
    assert.equal(document.activeElement, document.querySelector('.sd-search input'));
    assert.ok(document.getElementById('page-search-results'));
  } finally { await screen.close(); }
});

test('short searches stay local and a confirmed empty search offers a useful next step',async()=>{
  searchMode='empty';
  const screen=await renderRoute('/busca');
  try{
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,0);
    await inputValue(document.getElementById('unified-query'),'a');
    await act(async()=>document.querySelector('.unified-search-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    assert.ok(document.getElementById('unified-query-error').textContent.includes('2 caracteres'));
    assert.equal(document.activeElement,document.getElementById('unified-query'));
    assert.equal(requests.filter(item=>item.url.endsWith('/busca')).length,0);
    await inputValue(document.getElementById('unified-query'),'qualquer');
    await act(async()=>document.querySelector('.unified-search-form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    await flush();assert.ok(screen.container.textContent.includes('Nenhum resultado nesta busca.'));
    assert.ok(screen.container.textContent.includes('Tente uma palavra mais curta'));
  }finally{searchMode='';await screen.close();}
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
  const routes = ['/', '/login', '/register', '/inicio', '/cronograma', '/aprendizagem', '/provas', '/redacoes', '/lumi', '/perfil', '/planejamento-inteligente', '/minha-jornada', '/preferencias', '/minhas-atividades', '/minhas-turmas', '/avisos', '/status', '/mesa', '/meu-entendimento'];
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

test('login keeps typed credentials during a server outage and checks recovery without resubmitting them', async () => {
  const { Login, AuthContext, ThemeProvider } = await getBundle();
  const container = document.getElementById('root');
  const root = createRoot(container);
  const previousFetch = global.fetch;
  let submissions = 0, checks = 0;
  global.fetch = async () => { checks++; return { ok: true, json: async () => ({ database: 'connected' }) }; };
  const login = async () => { submissions++; throw { response: { status: 503 } }; };
  try {
    await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(ThemeProvider, null, React.createElement(AuthContext.Provider, { value: { login } }, React.createElement(Login))))));
    await inputValue(document.getElementById('email'), 'fixture@example.invalid');
    await inputValue(document.getElementById('senha'), 'fixture-password');
    await act(async () => container.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles: true, cancelable: true })));
    assert.ok(container.querySelector('[role="alert"]').textContent.includes('Seus dados de acesso continuam aqui'));
    assert.equal(document.getElementById('email').value, 'fixture@example.invalid');
    assert.equal(document.getElementById('senha').value, 'fixture-password');
    await act(async () => button('Verificar conexão').click());
    assert.ok(container.textContent.includes('A conexão voltou'));
    assert.equal(submissions, 1);
    assert.equal(checks, 1);
  } finally { global.fetch = previousFetch; await act(async () => root.unmount()); }
});

test('a review explains actual difficulty evidence and postpones without grading it', async () => {
  reviewQueueFixture = [{ id_revisao: 84, id_conteudo: 7, titulo: 'Revisão de frações', disciplina: 'Matemática', ultimo_resultado: 'DIFICIL', nivel_dominio: 2 }];
  const screen = await renderRoute('/aprendizagem');
  try {
    assert.ok(screen.container.textContent.includes('Você marcou este conteúdo como difícil'));
    assert.equal(requests.filter(request => request.url.endsWith('/adiar')).length, 0);
    await act(async () => document.querySelector('.study-recommendation summary').click());
    await act(async () => button('Confirmar nova data').click());
    await flush();
    const saved = requests.find(request => request.url.endsWith('/revisoes/84/adiar'));
    assert.equal(JSON.parse(saved.data).dias, 1);
    assert.ok(!requests.some(request => request.url.endsWith('/avaliar')));
    assert.ok(!document.querySelector('.learning-review'));
  } finally { reviewQueueFixture = []; await screen.close(); }
});

test('a failed postponement keeps the review in the queue and does not claim success', async () => {
  reviewQueueFixture = [{ id_revisao: 84, id_conteudo: 7, titulo: 'Revisão preservada', disciplina: 'Matemática' }];
  postponeFailure = true;
  const screen = await renderRoute('/aprendizagem');
  try {
    await act(async () => document.querySelector('.study-recommendation summary').click());
    await act(async () => button('Confirmar nova data').click());
    assert.ok(document.querySelector('.learning-review'));
    assert.ok(screen.container.textContent.includes('Não foi possível atualizar a fila'));
    assert.ok(!screen.container.textContent.includes('Reagendamento salvo na sua conta'));
  } finally { reviewQueueFixture = []; postponeFailure = false; await screen.close(); }
});

test('today opens a gentle five-minute return without completing the pending lesson', async () => {
  continuityFixture = { conteudo: { id: 51, id_conteudo: 9, titulo: 'Retomar Física', disciplina: 'Física' }, dia: { id_dia: 3, data_estudo: '2026-10-24' }, atualizadoEm: '2026-10-23T15:00:00Z' };
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Esta foi sua última sessão aberta, em 23/10/2026'));
    await act(async () => button('Retomar por 5 minutos').click());
    await flush();
    assert.ok(screen.container.textContent.includes('Cinco minutos já são um começo'));
    assert.ok(screen.container.textContent.includes('Retomar Física'));
    assert.ok(!requests.some(request => request.method === 'post' && /sessoes|concluir/.test(request.url)));
  } finally { continuityFixture = null; window.sessionStorage.clear(); await screen.close(); }
});

test('a continuity outage is recoverable rather than presented as an empty history', async () => {
  continuityFailure = true;
  const screen = await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Seu histórico não foi apagado'));
    continuityFailure = false;
    await act(async () => button('Consultar minha retomada').click());
    assert.ok(!screen.container.textContent.includes('Não conseguimos consultar sua última sessão'));
  } finally { continuityFailure = false; await screen.close(); }
});

test('registration validation focuses the first invalid field and associates its explanation', async () => {
  const screen = await renderRoute('/register');
  try {
    await act(async () => document.querySelector('form').dispatchEvent(new window.Event('submit', { bubbles:true, cancelable:true })));
    const input=document.getElementById('nome');
    assert.equal(document.activeElement,input);
    assert.equal(input.getAttribute('aria-invalid'),'true');
    assert.ok(document.getElementById(input.getAttribute('aria-describedby')).textContent.includes('Nome é obrigatório'));
    for (const id of ['email','senha','confirmarSenha']) assert.ok(document.getElementById(document.getElementById(id).getAttribute('aria-describedby')));
  } finally { await screen.close(); }
});

test('custom subjects and each available weekday time have accessible names', async () => {
  let screen = await renderRoute('/onboarding');
  try {
    const other=[...document.querySelectorAll('label')].find(node=>node.textContent.includes('Outra (digitar matérias'));
    assert.ok(other);
    await act(async()=>other.querySelector('input').click());
    assert.ok(document.querySelector('input[aria-label="Outras matérias, separadas por vírgula"]'));
    const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(results.violations.map(item=>item.id),[]);
  } finally { await screen.close(); }
  onboardingProfileFixture={areas_foco:'Matemática',objetivo:'ENEM',tempo_diario_min:60};
  screen=await renderRoute('/onboarding');
  try {
    const day=document.querySelector('input[type="checkbox"]');assert.ok(day);
    await act(async()=>day.click());
    const inputs=[...document.querySelectorAll('input[type="time"]')];assert.equal(inputs.length,2);
    for(const input of inputs) assert.match(input.getAttribute('aria-label'),/Horário (inicial|final) de /);
    const results=await axe.run(document,{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(results.violations.map(item=>item.id),[]);
  } finally { onboardingProfileFixture=null; await screen.close(); }
});

test('different passwords show an error under confirmation and matching passwords clear it', async () => {
  const screen=await renderRoute('/register');
  try{
    await inputValue(document.getElementById('nome'),'Estudante Teste');
    await inputValue(document.getElementById('email'),'fixture@example.invalid');
    await inputValue(document.getElementById('senha'),'SenhaTeste123');
    await inputValue(document.getElementById('confirmarSenha'),'OutraSenha123');
    await act(async()=>document.querySelector('form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));
    assert.equal(document.getElementById('confirmar-requisitos').textContent,'As senhas precisam ser iguais.');
    assert.equal(document.activeElement.id,'confirmarSenha');
    assert.ok(!requests.some(request=>request.method==='post'&&request.url.endsWith('/register')));
    await inputValue(document.getElementById('confirmarSenha'),'SenhaTeste123');
    assert.equal(document.getElementById('confirmarSenha').getAttribute('aria-invalid'),'false');
    assert.ok(!document.getElementById('confirmar-requisitos').textContent.includes('precisam ser iguais'));
  }finally{await screen.close()}
});

test('password-change fields explain mismatching confirmation immediately below the field', async () => {
  const screen=await renderRoute('/alterar-senha');
  try{
    await inputValue(document.getElementById('novaSenha'),'SenhaTeste123');
    await inputValue(document.getElementById('confirmarSenha'),'Diferente123');
    assert.equal(document.getElementById('password-confirmation-error').textContent,'As senhas precisam ser iguais.');
    assert.equal(document.getElementById('confirmarSenha').getAttribute('aria-describedby'),'password-confirmation-error');
    await inputValue(document.getElementById('confirmarSenha'),'SenhaTeste123');
    assert.ok(!document.getElementById('password-confirmation-error'));
  }finally{await screen.close()}
});

async function openJournal() {
  const screen=await renderRoute('/aprendizagem');
  await act(async()=>button('Minhas palavras e dúvidas').click());await flush();await flush();
  return screen;
}
test('journal drafts remain on this account and failed saves retry the same version without auto sending to Lumi',async()=>{
  const screen=await openJournal();
  try {
    await act(async()=>button('+ Escrever uma explicação').click());
    await inputValue(document.querySelector('.journal-editor input'),'Inércia');
    await inputValue(document.querySelector('.journal-editor textarea'),'Um corpo mantém seu estado quando a força resultante é zero.');
    const savedDraft=JSON.parse(localStorage.getItem('900001:journal-draft:new:explicacao:livre'));
    assert.match(savedDraft.texto,/força resultante/);
    assert.ok(!requests.some(r=>r.method==='post'&&r.url.includes('/diario')));
    journalFailure=true;
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
    assert.match(document.querySelector('.journal-error').textContent,/Não foi possível confirmar/);
    assert.equal(document.querySelector('.journal-editor textarea').value,savedDraft.texto);
    journalFailure=false;
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    const posts=requests.filter(r=>r.method==='post'&&r.url.endsWith('/diario'));
    assert.equal(posts.length,2);assert.equal(JSON.parse(posts[0].data).chave,JSON.parse(posts[1].data).chave);
    assert.ok(!localStorage.getItem('900001:journal-draft:new:explicacao:livre'));
    assert.ok(!requests.some(r=>r.method==='post'&&r.url.endsWith('/lumi')));
  }finally{journalFailure=false;await screen.close()}
});
test('reexplaining hides old answers until requested and Lumi sends only checked versions after an explicit click',async()=>{
  const screen=await openJournal();
  try {
    await act(async()=>document.querySelector('.journal-list button').click());await flush();await flush();
    assert.ok(!screen.container.textContent.includes('Primeira versão preservada'));
    await act(async()=>button('Consultar versões anteriores / comparar').click());
    const checks=[...document.querySelectorAll('.journal-step input')];
    assert.equal(checks.length,2);assert.ok(checks.every(node=>!node.checked));
    assert.equal(button('Comparar trechos com a Lumi').disabled,true);
    await act(async()=>{checks[0].click();checks[1].click()});
    assert.ok(!requests.some(r=>r.url.endsWith('/lumi')));
    await act(async()=>button('Comparar trechos com a Lumi').click());await flush();
    const request=requests.find(r=>r.method==='post'&&r.url.endsWith('/diario/71/lumi'));
    assert.deepEqual(JSON.parse(request.data),{passos:[11,12]});
    assert.match(document.querySelector('.journal-feedback').textContent,/exemplo tornou/);
    const result=await axe.run(document.querySelector('.learning-journal'),{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(v=>v.id),[]);
  }finally{await screen.close()}
});
test('a saved second explanation is appended rather than editing the earlier text',async()=>{
  const screen=await openJournal();
  try {
    await act(async()=>document.querySelector('.journal-list button').click());await flush();
    await inputValue(document.querySelector('.journal-editor textarea'),'Uma nova explicação minha.');
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    const request=requests.find(r=>r.method==='post'&&r.url.endsWith('/diario/71/passos'));
    assert.equal(JSON.parse(request.data).tipo,'explicacao');assert.equal(JSON.parse(request.data).texto,'Uma nova explicação minha.');
    assert.ok(screen.container.textContent.includes('Primeira versão preservada'));
    assert.ok(screen.container.textContent.includes('Registro confirmado na sua conta.'));
    assert.ok(!requests.some(r=>r.method==='post'&&r.url.endsWith('/lumi')));
  }finally{await screen.close()}
});
test('doubts require the student to record what helped before resolving and can be reopened',async()=>{
  journalDoubt=true;
  const screen=await openJournal();
  try {
    await act(async()=>button('Caminhos das dúvidas').click());await flush();
    await act(async()=>document.querySelector('.journal-list button').click());await flush();
    const select=document.querySelector('.journal-editor select');
    await act(async()=>{select.value='resolucao';select.dispatchEvent(new window.Event('change',{bubbles:true}))});
    await inputValue(document.querySelector('.journal-editor textarea'),'Comparar velocidade e aceleração com uma bicicleta ajudou.');
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.ok(screen.container.textContent.includes('Resolvida por você'));
    await inputValue(document.querySelector('.journal-editor textarea'),'Ainda tenho dúvida sobre o movimento circular.');
    await act(async()=>document.querySelector('.journal-editor').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();await flush();
    assert.ok(screen.container.textContent.includes('Em investigação'));
    assert.deepEqual(requests.filter(r=>r.url.endsWith('/diario/71/passos')).map(r=>JSON.parse(r.data).tipo),['resolucao','reabertura']);
    assert.ok(!requests.some(r=>r.url.endsWith('/lumi')));
  }finally{journalDoubt=false;journalResolved=0;await screen.close()}
});
test('a session cannot finish while its new explanation is still only a draft',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    await act(async()=>button('Explicar ou registrar uma dúvida').click());await flush();
    await act(async()=>button('+ Escrever uma explicação').click());
    await inputValue(document.querySelector('.journal-editor textarea'),'Minha ideia ainda em elaboração.');
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    assert.ok(document.querySelector('.study-desk'));
    assert.ok(!requests.some(r=>r.method==='post'&&/sessoes|concluir/.test(r.url)));
    assert.ok(localStorage.getItem('900001:journal-draft:new:explicacao:9'));
    window.confirm=()=>true;
    await act(async()=>button('Descartar rascunho').click());
    assert.ok(!localStorage.getItem('900001:journal-draft:new:explicacao:9'));
  }finally{window.confirm=()=>false;window.sessionStorage.clear();await screen.close()}
});
test('a study connection explains a reviewed relationship without fetching private data or sending to Lumi',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    const connection=document.querySelector('.study-connections');assert.ok(connection);
    assert.ok(connection.textContent.includes('Trabalho e energia'));
    assert.ok(!connection.textContent.includes('Uma resultante constante de 4 N'));
    const count=requests.length;
    await act(async()=>button('Entender esta conexão +').click());
    assert.match(connection.textContent,/12 J/);
    assert.equal(requests.length,count);
    const search=connection.querySelector('a[href^="/busca"]');
    assert.equal(search.getAttribute('target'),'_blank');assert.match(search.getAttribute('rel'),/noopener/);
    const url=new URL(search.href);assert.equal(url.searchParams.get('q'),'Trabalho e energia');assert.equal(url.searchParams.get('tipo'),'materiais');
    assert.ok(connection.querySelector('a[href^="https://openstax.org/"]'));
    assert.ok(!requests.some(r=>r.method==='post'&&/chat|lumi|sessoes|concluir/.test(r.url)));
    const result=await axe.run(connection,{rules:{'color-contrast':{enabled:false}}});
    assert.deepEqual(result.violations.map(v=>v.id),[]);
  }finally{window.sessionStorage.clear();await screen.close()}
});
test('recording a connection appends to the current note once and reading mode preserves both',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    await act(async()=>document.querySelector('.study-desk-note-link button').click());await flush();
    await inputValue(document.querySelector('.session-notes textarea'),'Minha anotação original.');
    await act(async()=>button('Entender esta conexão +').click());
    await act(async()=>button('Registrar esta conexão nas anotações').click());await flush();
    const text=document.querySelector('.session-notes textarea').value;
    assert.ok(text.startsWith('Minha anotação original.'));
    assert.match(text,/Conexão de estudo: Leis de Newton → Trabalho e energia/);assert.match(text,/Minha explicação:/);
    await act(async()=>button('Registrar esta conexão nas anotações').click());await flush();
    assert.equal(document.querySelector('.session-notes textarea').value,text);
    await act(async()=>button('Modo leitura').click());
    await act(async()=>button('Sair do modo leitura').click());
    assert.equal(document.querySelector('.session-notes textarea').value,text);
    assert.ok(!requests.some(r=>r.method==='post'&&/chat|lumi|sessoes|concluir/.test(r.url)));
  }finally{window.sessionStorage.clear();await screen.close()}
});
test('changing a curated connection reveals a distinct direction and leaves essays untouched',async()=>{
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Estrutura da redação dissertativa',disciplina:'Redação'},dia:{data_estudo:'2026-10-25'}}));
  const screen=await renderRoute('/estudar');
  try {
    assert.ok(document.querySelector('.study-connection-path').textContent.includes('Coesão e coerência textual'));
    await act(async()=>button('Entender esta conexão +').click());
    const next=button('Ver outra conexão →');next.focus();
    await act(async()=>next.click());
    assert.ok(document.activeElement===next);
    assert.ok(document.querySelector('.study-connection-path').textContent.includes('Repertório sociocultural'));
    assert.ok(button('Entender esta conexão +'));
    assert.ok(!requests.some(r=>/redacao|redacoes/.test(r.url)));
    assert.ok(!requests.some(r=>r.method==='post'&&/chat|lumi|sessoes|concluir/.test(r.url)));
  }finally{window.sessionStorage.clear();await screen.close()}
});
async function openClosingSession() {
  window.sessionStorage.setItem('900001:active-study-content',JSON.stringify({conteudo:{id:51,id_conteudo:9,titulo:'Leis de Newton',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}}));
  return renderRoute('/estudar');
}
test('closing a session confirms its actual summary and saves a personal next step in one request',async()=>{
  const screen=await openClosingSession();
  try {
    await inputValue(document.getElementById('closure-reminder'),'Tentar resolver sem consultar o exemplo.');
    assert.ok(!requests.some(r=>r.url.endsWith('/fechamentos')));
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();await flush();
    assert.ok(document.querySelector('.session-closing'));
    assert.ok(screen.container.textContent.includes('2 versões de explicações preservadas'));
    assert.ok(screen.container.textContent.includes('Ainda confundo força e velocidade'));
    assert.ok(screen.container.textContent.includes('Tentar resolver sem consultar o exemplo.'));
    assert.ok(document.activeElement===document.querySelector('.session-closing h1'));
    const posts=requests.filter(r=>r.url.endsWith('/fechamentos'));assert.equal(posts.length,1);
    assert.equal(JSON.parse(posts[0].data).proximoPasso,'Tentar resolver sem consultar o exemplo.');
    assert.ok(!requests.some(r=>r.method==='post'&&/sessoes$|revisoes\/|concluir$/.test(r.url)));
    assert.ok(!localStorage.getItem('900001:study-close:item-51'));
    const result=await axe.run(document.querySelector('.session-closing'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  }finally{window.sessionStorage.clear();await screen.close()}
});
test('a failed closing preserves its original reminder and retries the same immutable request',async()=>{
  closingFailure=true;
  const screen=await openClosingSession();
  try {
    await inputValue(document.getElementById('closure-reminder'),'Retomar pelo desenho do problema.');
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    assert.ok(!document.querySelector('.session-closing'));
    assert.equal(document.getElementById('closure-reminder').value,'Retomar pelo desenho do problema.');
    assert.equal(document.getElementById('closure-reminder').disabled,true);
    assert.ok(localStorage.getItem('900001:study-close:item-51'));
    closingFailure=false;
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    const posts=requests.filter(r=>r.url.endsWith('/fechamentos'));assert.equal(posts.length,2);assert.equal(posts[0].data,posts[1].data);
    assert.ok(document.querySelector('.session-closing'));
  }finally{closingFailure=false;window.sessionStorage.clear();await screen.close()}
});
test('an unconfirmed note remains separate from a confirmed closing and can be retried independently',async()=>{
  notesWriteFailure=true;
  const screen=await openClosingSession();
  try {
    await act(async()=>document.querySelector('.study-desk-note-link button').click());
    await inputValue(document.querySelector('.session-notes textarea'),'Minha anotação que precisa ser reenviada.');
    await act(async()=>document.querySelector('.study-desk-actions button:last-child').click());await flush();
    assert.ok(document.querySelector('.session-closing'));
    assert.ok(screen.container.textContent.includes('Suas anotações atuais estão só neste aparelho.'));
    notesWriteFailure=false;
    await act(async()=>button('Tentar enviar anotações').click());await flush();
    assert.ok(!document.querySelector('.closing-note-warning'));
    assert.equal(requests.filter(r=>r.url.endsWith('/fechamentos')).length,1);
  }finally{notesWriteFailure=false;window.sessionStorage.clear();await screen.close()}
});
test('today prioritizes due personal work and opens the exact explanation instead of the general list',async()=>{
  const explanation={id:71,titulo:'Minha explicação de Newton',minutos:5,motivo:'Sua última versão foi salva há pelo menos três dias.'};
  returnsFixture={explicacao:explanation,duvida:{id:72,titulo:'Uma dúvida aberta',minutos:8,motivo:'Ainda em investigação.'},revisao:{id:81,titulo:'Uma revisão pendente',minutos:10,motivo:'Prevista para hoje.'},proximoPasso:null,principal:{...explanation,tipo:'explicacao'}};
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(document.querySelector('.dash-v2-focus h2').textContent.includes('Minha explicação de Newton'));
    assert.ok(document.querySelector('.study-returns').textContent.includes('Uma dúvida aberta'));
    assert.ok(document.querySelector('.study-returns').textContent.includes('Uma revisão pendente'));
    assert.ok(document.querySelector('.dash-v2-focus').textContent.includes('5 min sugeridos'));
    await act(async()=>document.querySelector('.dash-v2-focus footer button').click());await flush();await flush();
    assert.ok(document.querySelector('.journal-detail'));
    assert.ok(!screen.container.textContent.includes('Primeira versão preservada'));
    assert.ok(requests.some(r=>r.url.endsWith('/diario/71')));
  }finally{returnsFixture=null;await screen.close()}
});
test('today keeps an ongoing session ahead of other suggestions and does not consume a reminder on open',async()=>{
  const reminder={id:89,titulo:'Próximo estudo',texto:'Fazer um desenho antes de calcular.',minutos:5,motivo:'Você escolheu esse próximo passo.'};
  returnsFixture={proximoPasso:reminder,principal:{...reminder,tipo:'lembrete'}};
  continuityFixture={conteudo:{id:51,id_conteudo:9,titulo:'Uma sessão ainda aberta',disciplina:'Física'},dia:{data_estudo:'2026-10-25'}};
  const screen=await renderRoute('/inicio');
  try {
    assert.equal(document.querySelector('.dash-v2-focus h2').textContent,'Uma sessão ainda aberta');
    await act(async()=>document.querySelector('.study-returns article button').click());await flush();
    assert.ok(document.querySelector('.study-desk'));
    assert.ok(!requests.some(r=>r.url.endsWith('/retomado')));
  }finally{returnsFixture=null;continuityFixture=null;window.sessionStorage.clear();await screen.close()}
});
test('a failed return lookup offers retry without claiming the pending work is empty',async()=>{
  returnsFailure=true;
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(screen.container.textContent.includes('Não conseguimos consultar suas retomadas'));
    assert.ok(!screen.container.textContent.includes('Nenhuma retomada foi encontrada'));
    returnsFailure=false;
    await act(async()=>button('Consultar retomadas novamente').click());await flush();
    assert.ok(!screen.container.textContent.includes('Não conseguimos consultar suas retomadas'));
    assert.equal(requests.filter(r=>r.url.endsWith('/retomadas')).length,2);
  }finally{returnsFailure=false;await screen.close()}
});
test('a personal next step is marked done only through its explicit control',async()=>{
  const reminder={id:89,titulo:'Leis de Newton',texto:'Tentar um exemplo novo.',minutos:5,motivo:'Sua escolha para a próxima sessão.'};
  returnsFixture={proximoPasso:reminder,principal:{...reminder,tipo:'lembrete'}};
  const screen=await renderRoute('/inicio');
  try {
    assert.ok(!requests.some(r=>r.url.endsWith('/retomado')));
    await act(async()=>button('Marcar próximo passo como feito').click());await flush();
    assert.equal(requests.filter(r=>r.url.endsWith('/fechamentos/89/retomado')).length,1);
    assert.ok(!screen.container.textContent.includes('Tentar um exemplo novo.'));
  }finally{returnsFixture=null;await screen.close()}
});
test('a suggested review opens the review section with the selected item available',async()=>{
  const review={id:81,titulo:'Uma revisão para retomar',minutos:10,motivo:'A data de revisão já passou.',atrasada:true};
  returnsFixture={revisao:review,principal:{...review,tipo:'revisao'}};
  reviewQueueFixture=[{id_revisao:81,id_conteudo:9,titulo:review.titulo,disciplina:'Física',nivel_dominio:2,ultimo_resultado:'DIFICIL'}];
  const screen=await renderRoute('/inicio');
  try {
    await act(async()=>document.querySelector('.dash-v2-focus footer button').click());await flush();await flush();
    assert.ok(document.getElementById('learning-review-81'));
    assert.equal(document.querySelector('.learning-tabs button[aria-pressed="true"]').textContent,'Revisões');
  }finally{returnsFixture=null;reviewQueueFixture=[];await screen.close()}
});


test('personal desk reorders and removes shortcuts without deleting originals',async()=>{
 const original=structuredClone(deskItems),screen=await renderRoute('/mesa');
 try{
  assert.equal(document.querySelectorAll('.desk-card').length,2);
  assert.match(document.querySelector('.desk-board').textContent,/2 de 6/);
  await act(async()=>document.querySelector('[aria-label="Mover Força e velocidade para cima"]').click());await flush();
  assert.equal(document.querySelector('.desk-card h3').textContent,'Força e velocidade');
  await act(async()=>document.querySelector('[aria-label="Retirar Leis de Newton da mesa"]').click());await flush();
  assert.equal(document.querySelectorAll('.desk-card').length,1);
  assert.match(document.querySelector('.desk-board [role="status"]').textContent,/original foi preservado/);
  assert.ok(!requests.some(req=>req.method==='delete'&&!req.url.includes('/mesa/')));
  assert.equal(requests.find(req=>req.url.endsWith('/mesa')&&req.method==='get').cache,false);
 }finally{deskItems=original;await screen.close()}
});
test('understanding opens exact evidence lazily, with both original versions and an accessible disclosure',async()=>{
 const screen=await renderRoute('/meu-entendimento');
 try{
  assert.equal(requests.filter(req=>req.url.endsWith('/entendimento/102')).length,0);
  await act(async()=>button('Comparar as duas versões').click());await flush();
  assert.match(document.querySelector('.understanding-evidence').textContent,/Minha versão anterior original/);
  assert.match(document.querySelector('.understanding-evidence').textContent,/Minha nova explicação completa/);
  assert.equal(button('Recolher registro').getAttribute('aria-expanded'),'true');
  const result=await axe.run(document.querySelector('.personal-study'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>button('Recolher registro').click());assert.ok(!document.querySelector('.understanding-evidence'));
 }finally{await screen.close()}
});
test('personal pages distinguish outages from an empty account and recover on demand',async()=>{
 for(const route of ['/mesa','/meu-entendimento']){
  personalFailure=true;const screen=await renderRoute(route);
  try{
   assert.ok(document.querySelector('.personal-study [role="alert"]'));assert.ok(!document.querySelector('.personal-empty'));
   personalFailure=false;await act(async()=>document.querySelector('.personal-study [role="alert"] button').click());await flush();
   assert.ok(document.querySelector(route==='/mesa'?'.desk-card':'.understanding-card'));
  }finally{personalFailure=false;await screen.close()}
 }
});


test('pinning a search result waits for confirmation and keeps source type distinct',async()=>{
 const screen=await renderRoute('/busca?q=Newton&tipo=anotacoes');
 try{
  assert.equal(requests.filter(req=>req.url.endsWith('/mesa')&&req.method==='post').length,0);
  personalFailure=true;
  await act(async()=>document.querySelector('.desk-pin button').click());await flush();
  assert.ok(document.querySelector('.desk-pin [role="alert"]'));assert.ok(!document.querySelector('.desk-pin a'));
  personalFailure=false;
  await act(async()=>document.querySelector('.desk-pin button').click());await flush();
  assert.equal(document.querySelector('.desk-pin a')?.getAttribute('href'),'/mesa');
  const saved=requests.filter(req=>req.url.endsWith('/mesa')&&req.method==='post').at(-1);
  assert.deepEqual(JSON.parse(saved.data),{tipo:'anotacao',idOrigem:9});
 }finally{personalFailure=false;await screen.close()}
});
test('opening a desk note rechecks its source and goes to the notes editor',async()=>{
 window.sessionStorage.clear();const screen=await renderRoute('/mesa');
 try{
  await act(async()=>button('Abrir anotação').click());await flush();await flush();
  assert.ok(requests.some(req=>req.url.endsWith('/mesa/31/abrir')&&req.cache===false));
  assert.ok(document.querySelector('.session-notes textarea'));
 }finally{await screen.close();window.sessionStorage.clear()}
});


async function openIntentEditor(){
 const screen=await renderRoute('/redacoes');
 await act(async()=>document.querySelector('.redacoes-intro-actions button').click());await flush();
 const text='O acesso à leitura depende de condições materiais, como bibliotecas próximas e tempo para ler. Um acervo acessível pode aproximar o livro da rotina de estudantes.\n\nAlém disso, projetos de leitura ajudam a compartilhar interpretações e a descobrir autores. Essa troca pode tornar a leitura uma prática cotidiana.';
 await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'),text);
 await act(async()=>button('Revisar um trecho com a Lumi').click());
 const select=document.querySelector('.essay-intent select');
 await act(async()=>{select.value='0';select.dispatchEvent(new window.Event('change',{bubbles:true}))});
 return {screen,text};
}
test('intent review sends a selected excerpt on demand and preserves the essay and its draft',async()=>{
 const {screen,text}=await openIntentEditor();
 try{
  assert.equal(requests.filter(req=>req.url.endsWith('/revisar-intencao')).length,0);
  await act(async()=>document.querySelector('.essay-intent input[value="coesao"]').click());
  await act(async()=>document.querySelector('.essay-intent-neighbor input').click());
  await act(async()=>button('Pedir uma sugestão para este trecho').click());await flush();
  const request=requests.find(req=>req.url.endsWith('/revisar-intencao')),sent=JSON.parse(request.data);
  assert.equal(sent.intencao,'coesao');assert.equal(sent.trecho,text);assert.deepEqual(Object.keys(sent).sort(),['intencao','trecho']);
  assert.ok(document.querySelector('.essay-intent-result'));assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value,text);
  assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto,text);
  const result=await axe.run(document.querySelector('.essay-intent'),{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>button('Voltar ao meu texto para reescrever').click());assert.equal(document.activeElement,document.querySelector('textarea[aria-label="Texto da redação"]'));
 }finally{await screen.close()}
});
test('intent review failures retain the chosen text and allow an explicit retry',async()=>{
 const {screen,text}=await openIntentEditor();intentMode='failure';
 try{
  await act(async()=>button('Pedir uma sugestão para este trecho').click());await flush();
  assert.ok(document.querySelector('.essay-intent [role="alert"]'));assert.ok(!document.querySelector('.essay-intent-result'));
  assert.equal(document.querySelector('textarea[aria-label="Texto da redação"]').value,text);
  intentMode='';await act(async()=>button('Pedir uma sugestão para este trecho').click());await flush();assert.ok(document.querySelector('.essay-intent-result'));
 }finally{intentMode='';await screen.close()}
});
test('an old review cannot appear after the student edits the source while Lumi is responding',async()=>{
 const {screen}=await openIntentEditor();intentMode='deferred';
 try{
  await act(async()=>button('Pedir uma sugestão para este trecho').click());
  assert.ok(document.querySelector('.essay-intent [role="status"]'));
  await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'),'Uma nova versão, com um argumento que eu mesmo desenvolvi depois de repensar a ideia.');
  await act(async()=>deferredIntent());await flush();
  assert.ok(!document.querySelector('.essay-intent-result'));
  assert.match(document.querySelector('textarea[aria-label="Texto da redação"]').value,/Uma nova versão/);
 }finally{intentMode='';await screen.close()}
});
test('connected page motifs stay decorative and personal pages retain their navigation labels',async()=>{
 for(const [route,title] of [['/mesa','Minha mesa — PlanejAI'],['/meu-entendimento','Meu entendimento — PlanejAI']]){
  const screen=await renderRoute(route);
  try{assert.equal(document.querySelector('.sd-topbar-context strong').textContent,title.replace(' — PlanejAI',''));assert.ok(document.querySelector('.area-signature .connected-pages[aria-hidden="true"]'));assert.equal(document.querySelector('.connected-pages')?.getAttribute('focusable'),'false');}
  finally{await screen.close()}
 }
});

test('personal routes announce their distinct document titles to assistive technology',async()=>{
 const {PageExperience,ThemeProvider,AccessibilityProvider}=await getBundle();
 for(const [route,title] of [['/mesa','Minha mesa — PlanejAI'],['/meu-entendimento','Meu entendimento — PlanejAI']]){
  const root=createRoot(document.getElementById('root'));
  try{
   await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:[route]},React.createElement(ThemeProvider,null,React.createElement(AccessibilityProvider,null,React.createElement(PageExperience))))));await flush();
   assert.equal(document.title,title);assert.equal(document.querySelector('.sr-route').textContent,title);
  }finally{await act(async()=>root.unmount())}
 }
});


test('cohesion waits for the neighboring paragraph instead of requesting a speculative review',async()=>{
 const {screen}=await openIntentEditor();
 try{
  await act(async()=>document.querySelector('.essay-intent input[value="coesao"]').click());
  assert.ok(button('Pedir uma sugestão para este trecho').disabled);
  assert.match(document.querySelector('.essay-intent-context').textContent,/parágrafo vizinho/);
  assert.equal(requests.filter(req=>req.url.endsWith('/revisar-intencao')).length,0);
  await act(async()=>document.querySelector('.essay-intent-neighbor input').click());
  assert.ok(!button('Pedir uma sugestão para este trecho').disabled);
 }finally{await screen.close()}
});
test('password dialog contains focus, reports mismatch below confirmation and restores its trigger',async()=>{
 directoryOtherAccount=true;const screen=await renderRoute('/usuarios','dono');
 try{
  await act(async()=>document.querySelector('.users-actions summary').click());
  const trigger=button('Definir senha');trigger.focus();
  await act(async()=>trigger.click());const dialog=document.querySelector('.users-password-dialog');
  assert.equal(document.activeElement,dialog);assert.equal(dialog.getAttribute('role'),'dialog');
  await inputValue(dialog.querySelector('[aria-label="Nova senha"]'),'SenhaFicticia123!');
  await inputValue(dialog.querySelector('[aria-label="Confirmar nova senha"]'),'OutraSenhaFicticia123!');
  await act(async()=>button('Salvar senha').click());
  assert.equal(dialog.querySelector('[role="alert"]').textContent,'As senhas precisam ser iguais.');
  assert.equal(dialog.querySelector('[aria-label="Confirmar nova senha"]').getAttribute('aria-invalid'),'true');
  assert.ok(!requests.some(req=>['post','patch','put'].includes(req.method)&&req.url.includes('/senha')));
  button('Salvar senha').focus();await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));
  assert.equal(document.activeElement,dialog.querySelector('input'));
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true})));
  assert.equal(document.activeElement,button('Salvar senha'));
  const result=await axe.run(dialog,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  assert.ok(!document.querySelector('.users-password-dialog'));assert.equal(document.activeElement,trigger);assert.equal(document.body.style.overflow,'');
 }finally{directoryOtherAccount=false;await screen.close()}
});
test('material editor traps focus and closes without sending or discarding the original catalog entry',async()=>{
 materialCatalogFixture=true;const screen=await renderRoute('/materiais','dono');
 try{
  const trigger=document.querySelector('.materials-card');trigger.focus();await act(async()=>trigger.click());
  const dialog=document.querySelector('.materials-dialog');assert.equal(document.activeElement,dialog);
  const last=dialog.querySelector('button[type="submit"]');last.focus();
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true})));
  assert.equal(document.activeElement,dialog.querySelector('button'));
  await act(async()=>button('+ Adicionar recurso').click());
  const result=await axe.run(dialog,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[]);
  await act(async()=>document.dispatchEvent(new window.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true})));
  assert.ok(!document.querySelector('.materials-dialog'));assert.equal(document.activeElement,trigger);assert.equal(document.body.style.overflow,'');
  assert.equal(requests.filter(req=>req.method==='put'||req.method==='patch').length,0);
 }finally{materialCatalogFixture=false;await screen.close()}
});


test('the public page shell observes keyboard height and cleans up its viewport state',async()=>{
 const {PageExperience,ThemeProvider,AccessibilityProvider}=await getBundle();
 const saved={};for(const key of ['visualViewport','innerWidth','innerHeight'])saved[key]=Object.getOwnPropertyDescriptor(window,key);
 const viewport=new window.EventTarget();viewport.height=350;viewport.scale=1;
 Object.defineProperty(window,'visualViewport',{configurable:true,value:viewport});Object.defineProperty(window,'innerWidth',{configurable:true,value:390});Object.defineProperty(window,'innerHeight',{configurable:true,value:844});
 const root=createRoot(document.getElementById('root'));
 try{
  await act(async()=>root.render(React.createElement(MemoryRouter,{initialEntries:['/login']},React.createElement(ThemeProvider,null,React.createElement(AccessibilityProvider,null,React.createElement(PageExperience),React.createElement('input',{type:'email','aria-label':'Email fictício'}),React.createElement('button',null,'Continuar'))))));
  await act(async()=>document.querySelector('input[type="email"]').focus());await flush();
  assert.ok(document.documentElement.hasAttribute('data-mobile-keyboard'));assert.equal(document.documentElement.style.getPropertyValue('--visible-viewport-height'),'350px');
  await act(async()=>[...document.querySelectorAll('button')].find(el=>el.textContent==='Continuar').focus());await flush();
  assert.ok(!document.documentElement.hasAttribute('data-mobile-keyboard'));
 }finally{
  await act(async()=>root.unmount());
  for(const key of Object.keys(saved)){if(saved[key])Object.defineProperty(window,key,saved[key]);else delete window[key]}
 }
 assert.equal(document.documentElement.style.getPropertyValue('--visible-viewport-height'),'');
});
test('activity creation exposes named controls in all seven question formats',async()=>{
 const screen=await renderRoute('/atividades','dono');
 try{
  await act(async()=>button('Montar primeira atividade →').click());
  assert.ok(document.querySelector('input[placeholder="Título da atividade"]').closest('label'));
  for(const type of ['MULTIPLA_ESCOLHA','CHECKBOX','DISSERTATIVA','RESPOSTA_CURTA','ORDENACAO','ASSOCIACAO','ARQUIVO']){
   const select=document.querySelector('[aria-label="Tipo da questão 1"]');
   await act(async()=>{select.value=type;select.dispatchEvent(new window.Event('change',{bubbles:true}))});
   const result=await axe.run(document.querySelector('.activity-question-editor').parentElement,{rules:{'color-contrast':{enabled:false}}});assert.deepEqual(result.violations.map(v=>v.id),[],type);
  }
 }finally{await screen.close()}
});

test('today gives a returning student one main action and keeps details expandable',async()=>{
 continuityFixture={conteudo:{id:51,id_conteudo:9,titulo:'Retomar Newton',disciplina:'Física'}};
 const screen=await renderRoute('/inicio','aluno',{}, {'900001:today-last-visit:v1':new Date(Date.now()-6*86400000).toISOString()});
 try{
  assert.equal(document.querySelector('.today-welcome').dataset.moment,'ongoing');
  assert.ok(document.querySelector('.dash-v2-focus footer button').textContent.includes('Retomar minha sessão'));
  const details=document.querySelector('.today-details');assert.equal(details.open,false);
  await act(async()=>details.querySelector('summary').click());assert.equal(details.open,true);
  assert.ok(document.querySelector('.dash-v2-agenda'));
 }finally{continuityFixture=null;await screen.close()}
});

test('today recognizes a device return without inventing missed study days',async()=>{
 dashboardLearningFixture={minutosSemana:15,metaSemanal:180,revisoesHoje:0};
 const screen=await renderRoute('/inicio','aluno',{}, {'900001:today-last-visit:v1':new Date(Date.now()-5*86400000).toISOString()});
 try{assert.equal(document.querySelector('.today-welcome').dataset.moment,'return');assert.match(document.querySelector('.today-welcome').textContent,/neste aparelho/);assert.equal(requests.filter(x=>x.method==='post').length,0)}finally{dashboardLearningFixture=null;await screen.close()}
});

test('planning failure retains account scoped choices and retries only on demand',async()=>{
 onboardingProfileFixture={areas_foco:'Física',objetivo:'ENEM',tempo_diario_min:45};planningWriteFailure=true;
 const screen=await renderRoute('/onboarding');
 try{
  await act(async()=>button('Voltar').click());
  await inputValue(document.getElementById('setup-minutes'),'50');
  await act(async()=>document.querySelector('.setup-page form').dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true})));await flush();
  assert.ok(document.querySelector('.save-feedback[data-state="error"]'));
  assert.equal(JSON.parse(localStorage.getItem('900001:planning-draft:v1')).value.formData.tempo_diario_min,50);
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/perfil')).length,1);
  planningWriteFailure=false;
  await act(async()=>button('Tentar salvar novamente').click());await flush();
  assert.match(document.querySelector('.save-feedback[data-state="saved"]').textContent,/Matérias salvas/);
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/perfil')).length,2);
 }finally{planningWriteFailure=false;onboardingProfileFixture=null;await screen.close()}
});

test('essay retry confirms the saved version before clearing its local draft',async()=>{
 const screen=await renderRoute('/redacoes');essayMode='failure';
 try{
  await act(async()=>document.querySelector('.redacoes-intro-actions button').click());await flush();
  await inputValue(document.getElementById('essay-topic'),'Educação e leitura');
  const text='Bibliotecas próximas facilitam o acesso à leitura e permitem compartilhar experiências. '.repeat(5);
  await inputValue(document.querySelector('textarea[aria-label="Texto da redação"]'),text);
  await act(async()=>button('Finalizar e enviar').click());await flush();
  assert.equal(JSON.parse(localStorage.getItem('900001:essay-draft:v3')).texto,text);
  essayMode='success';await act(async()=>button('Tentar salvar novamente').click());await flush();
  assert.ok(document.querySelector('.redacoes-page .save-feedback[data-state="saved"]'));
  assert.equal(localStorage.getItem('900001:essay-draft:v3'),null);
  assert.equal(document.querySelector('.essay-studio'),null);
 }finally{essayMode='';await screen.close()}
});

test('workshop recovers an unsent device draft explicitly and clears it after confirmation',async()=>{
 const draft={tema:'Minha tese preservada',tese:'Uma posição própria',argumentoUm:'',argumentoDois:'',repertorio:'',intervencao:'',rascunho:'',etapa:'TEMA'};
 const screen=await renderRoute('/redacoes','aluno',{}, {'900001:writing-workshop-draft:v1':JSON.stringify(draft)});
 try{
  await act(async()=>button('Abrir oficina →').click());await flush();
  assert.equal(document.querySelector('.writing-workshop-editor input').value,'');
  await act(async()=>button('Recuperar rascunho da oficina').click());
  assert.equal(document.querySelector('.writing-workshop-editor input').value,draft.tema);
  assert.equal(requests.filter(x=>x.method==='post'&&x.url.endsWith('/redacao/projetos')).length,0);
  essayMode='workshopSuccess';await act(async()=>button('Salvar esta etapa').click());await flush();
  assert.ok(document.querySelector('.writing-workshop .save-feedback[data-state="saved"]'));
  assert.equal(localStorage.getItem('900001:writing-workshop-draft:v1'),null);
 }finally{essayMode='';await screen.close()}
});

test('welcome ignores another accounts visit and gives first study priority',async()=>{
 const screen=await renderRoute('/inicio','aluno',{}, {'900002:today-last-visit:v1':new Date(Date.now()-6*86400000).toISOString()});
 try{assert.equal(document.querySelector('.today-welcome').dataset.moment,'first');assert.ok(document.querySelector('.first-study-primary'));assert.ok(!document.querySelector('.today-details'))}finally{await screen.close()}
});
