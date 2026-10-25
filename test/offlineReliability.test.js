const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const axios = require('../frontend/node_modules/axios/dist/node/axios.cjs');

function browser() {
  const values = new Map([['user', JSON.stringify({ id: 1 })], ['token', 'current-token']]);
  const events = [];
  return {
    localStorage: { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) },
    window: { navigator: { onLine: true }, crypto: require('node:crypto').webcrypto,
      CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
      dispatchEvent: event => events.push(event) },
    events,
  };
}
function load(relative, context, footer = '') {
  const code = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8')
    .replace(/^import .*$/gm, '').replace(/export /g, '');
  vm.createContext(context);
  vm.runInContext(code + '\n' + footer, context, { filename: relative });
  return context;
}
function client() {
  const env = browser(), cache = new Map(), queued = [];
  const context = load('frontend/src/services/apiClient.js', {
    ...env, axios, apiUrl: value => value,
    currentUser: () => JSON.parse(env.localStorage.getItem('user') || '{}').id?.toString() || 'anonymous',
    scopedCacheKey: key => `${JSON.parse(env.localStorage.getItem('user')).id}:${key}`,
    cachePut: async (key, data) => cache.set(key, { data }), cacheGet: async key => cache.get(key),
    enqueue: async item => { queued.push(item); return queued.length; },
  });
  return { api: context.createApiClient('/api/usuarios'), cache, queued, ...env };
}
function offline(config) { return Promise.reject(new axios.AxiosError('offline', 'ERR_NETWORK', config)); }

test('an account-bound closing cannot transmit an old reminder with another account token',async()=>{
  const {api,localStorage,queued}=client();let sent=0;
  api.defaults.adapter=async config=>{sent++;return {status:200,data:{confirmado:true},config}};
  localStorage.setItem('user',JSON.stringify({id:2}));localStorage.setItem('token','second-account-token');
  await assert.rejects(api.post('/fechamentos',{proximoPasso:'Private draft of the first account'},{expectedOwner:'1',offlineQueue:true}),error=>axios.isCancel(error));
  assert.equal(sent,0);assert.equal(queued.length,0);
  await api.post('/fechamentos',{proximoPasso:'Own reminder'},{expectedOwner:'2'});
  assert.equal(sent,1);
});

test('offline cache separates query parameters and preserves the requested page', async () => {
  const { api, cache } = client();
  api.defaults.adapter = async config => ({ status: 200, data: { page: config.params.page }, config });
  await api.get('/', { params: { page: 1, search: 'Ana' } });
  await api.get('/', { params: { page: 2, search: 'Ana' } });
  api.defaults.adapter = offline;
  assert.equal((await api.get('/', { params: { page: 1, search: 'Ana' } })).data.page, 1);
  assert.equal(cache.size, 2);
  await assert.rejects(api.get('/', { params: { page: 1, search: 'Bruno' } }));
});
test('queued retry keeps the same idempotency key as the original request', async () => {
  const { api, queued } = client();
  let originalKey;
  api.defaults.adapter = config => { originalKey = config.headers['Idempotency-Key']; return offline(config); };
  const result = await api.post('/sessoes', { minutos: 5 }, { offlineQueue: true });
  assert.equal(result.status, 202);
  assert.ok(originalKey);
  assert.equal(queued[0].idempotencyKey, originalKey);
  assert.equal(queued[0].data.minutos, 5);
});
test('a late unauthorized response does not revoke a renewed session', async () => {
  const { api, localStorage, events } = client();
  api.defaults.adapter = config => {
    localStorage.setItem('token', 'renewed-token');
    return Promise.reject(new axios.AxiosError('unauthorized', 'ERR_BAD_REQUEST', config, null, { status: 401 }));
  };
  await assert.rejects(api.get('/'));
  assert.equal(localStorage.getItem('token'), 'renewed-token');
  assert.equal(events.length, 0);
});
test('a failed write is not queued under a different account', async () => {
  const { api, localStorage, queued } = client();
  api.defaults.adapter = config => { localStorage.setItem('user', JSON.stringify({ id: 2 })); return offline(config); };
  await assert.rejects(api.post('/sessoes', {}, { offlineQueue: true }));
  assert.equal(queued.length, 0);
});
function queueContext(options = {}) {
  const env = browser();
  const items = [{ id: 1, owner: '1', status: 'PENDING', baseURL: '/api', url: '/sessoes', method: 'POST', data: { minutos: 5 }, idempotencyKey: 'stable-key' }];
  const sends = [];
  const context = load('frontend/src/utils/offlineStore.js', { ...env,
    fetch: async (url, config) => { sends.push(config); await new Promise(resolve => setTimeout(resolve, 5)); return { ok: true, status: 200 }; },
    items, ...options,
  }, `listQueue = async () => items.slice(); removeQueue = async id => { const index = items.findIndex(item => item.id === id); if (index >= 0) items.splice(index, 1); };`);
  return { context, items, sends, ...env };
}
test('simultaneous queue syncs share one send and preserve retry headers', async () => {
  const { context, sends, items } = queueContext();
  const first = context.syncQueue(), second = context.syncQueue();
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(sends.length, 1);
  assert.equal(sends[0].headers['Idempotency-Key'], 'stable-key');
  assert.equal(items.length, 0);
});
test('Web Locks serialize queue synchronization across tabs', async () => {
  let chain = Promise.resolve();
  const locks = { request: (name, callback) => { const run = chain.then(callback); chain = run.catch(() => {}); return run; } };
  const first = queueContext(), second = queueContext();
  first.context.window.navigator.locks = second.context.window.navigator.locks = locks;
  second.context.items = first.items;
  await Promise.all([first.context.syncQueue(), second.context.syncQueue()]);
  assert.equal(first.sends.length + second.sends.length, 1);
});
test('queue sync leaves another account records untouched', async () => {
  const { context, items, sends, localStorage } = queueContext();
  localStorage.setItem('user', JSON.stringify({ id: 2 }));
  await context.syncQueue();
  assert.equal(sends.length, 0);
  assert.equal(items.length, 1);
});
test('calendar days and weekly charts use actual completed plans', async () => {
  const { localDateKey, weeklyCompletion } = await import('../frontend/src/utils/studyDates.js');
  assert.equal(localDateKey('2026-10-22'), '2026-10-22');
  assert.equal(localDateKey('invalid'), '');
  const week = weeklyCompletion([{ data_estudo: '2026-10-20', concluido: 1 }, { data_estudo: '2026-10-21', concluido: 0 }], new Date(2026, 9, 22, 12));
  assert.equal(week.length, 7);
  assert.equal(week.filter(day => day.completed).length, 1);
  assert.equal(week.find(day => day.completed).key, '2026-10-20');
});

test('offline writes work on LAN HTTP without randomUUID', async () => {
  const { api, window, queued } = client();
  window.crypto = { getRandomValues: array => require('node:crypto').webcrypto.getRandomValues(array) };
  api.defaults.adapter = offline;
  await api.post('/sessoes', {}, { offlineQueue: true });
  assert.match(queued[0].idempotencyKey, /^[a-f0-9]{32}$/);
});
test('canceled writes are not added to the offline queue', async () => {
  const { api, queued } = client();
  api.defaults.adapter = () => Promise.reject(new axios.CanceledError());
  await assert.rejects(api.post('/sessoes', {}, { offlineQueue: true }));
  assert.equal(queued.length, 0);
});
