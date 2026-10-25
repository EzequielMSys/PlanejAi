const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const { createRequire, Module } = require('node:module')
const dir = path.resolve(__dirname, '../frontend'), req = createRequire(path.join(dir, 'package.json'))
const { JSDOM } = req('jsdom')
const dom = new JSDOM('<div id="root"></div>', { url: 'https://notes.test/' })
for (const key of ['window', 'document', 'localStorage', 'HTMLElement', 'Node']) global[key] = dom.window[key]
Object.defineProperty(global, 'navigator', { value: dom.window.navigator, configurable: true })
global.IS_REACT_ACT_ENVIRONMENT = true
const React = req('react'), { createRoot } = req('react-dom/client'), axios = req('axios')
let useNotes, current, adapter
axios.defaults.adapter = config => adapter(config)
const response = (config, data) => ({ status: 200, statusText: 'OK', headers: {}, config, data })
async function mount({ draft, confirmedDraft, failLoad = false, owner = 101, remote = 'Texto no servidor' } = {}) {
  if (!useNotes) {
    const build = await req('esbuild').build({ stdin: { contents: "export { default } from './src/hooks/useStudyNotes.js'", resolveDir: dir }, bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', define: { 'import.meta.env': '{}' } })
    const filename = path.join(dir, '__notes_test.cjs'), mod = new Module(filename, module)
    mod.filename = filename; mod.paths = Module._nodeModulePaths(dir); mod._compile(build.outputFiles[0].text, filename); useNotes = mod.exports.default
  }
  localStorage.clear(); localStorage.setItem('user', JSON.stringify({ id_usuario: owner }))
  if (draft) localStorage.setItem('101:study-note:1', JSON.stringify({ text: draft, dirty: true }))
  if (confirmedDraft) localStorage.setItem('101:study-note:1', JSON.stringify({ text: confirmedDraft, dirty: false }))
  adapter = async config => { if (failLoad) throw new axios.AxiosError('unavailable', 'ERR_BAD_RESPONSE', config, null, {status:503}); return response(config, { texto: remote }) }
  function Probe() { current = useNotes(1, 99); return React.createElement('p', null, current.status) }
  const root = createRoot(document.getElementById('root'))
  await React.act(async () => root.render(React.createElement(Probe)))
  return { close: () => React.act(async () => root.unmount()) }
}
const tick = () => React.act(async () => { await new Promise(resolve => setTimeout(resolve, 700)) })
test('failed note save keeps a scoped draft and explicit retry confirms server persistence', async () => {
  const view = await mount()
  try {
    let fail = true
    adapter = async config => { if (fail) throw new axios.AxiosError('offline', 'ERR_NETWORK', config); return response(config, { atualizadoEm: new Date().toISOString() }) }
    await React.act(async () => current.setNotes('Rascunho importante'))
    assert.equal(JSON.parse(localStorage.getItem('101:study-note:1')).text, 'Rascunho importante')
    await tick()
    assert.equal(current.status, 'error')
    fail = false
    await React.act(async () => current.retry())
    assert.equal(current.status, 'saved')
    assert.equal(JSON.parse(localStorage.getItem('101:study-note:1')).dirty, false)
  } finally { await view.close() }
})
test('new edits are serialized and an older response cannot mark them saved', async () => {
  const view = await mount()
  try {
    const writes = [], completions = []
    adapter = config => new Promise(resolve => { writes.push(JSON.parse(config.data).texto); completions.push(() => resolve(response(config, {}))) })
    await React.act(async () => current.setNotes('Primeira versão')); await tick()
    await React.act(async () => current.setNotes('Versão mais recente')); await tick()
    assert.deepEqual(writes, ['Primeira versão'])
    await React.act(async () => completions[0]())
    assert.deepEqual(writes, ['Primeira versão', 'Versão mais recente'])
    assert.equal(current.status, 'saving')
    await React.act(async () => completions[1]())
    assert.equal(current.status, 'saved')
    assert.equal(current.notes, 'Versão mais recente')
  } finally { await view.close() }
})
test('recovering a local draft does not silently overwrite the server', async () => {
  const view = await mount({ draft: 'Texto não enviado' })
  try {
    let calls = 0; adapter = async config => { calls++; return response(config, {}) }
    assert.equal(current.notes, 'Texto não enviado')
    assert.equal(current.status, 'local')
    await tick(); assert.equal(calls, 0)
  } finally { await view.close() }
})

test('finishing waits for the latest edit while an earlier save is in flight', async () => {
  const view = await mount()
  try {
    const completions = []
    adapter = config => new Promise(resolve => completions.push(() => resolve(response(config, {}))))
    await React.act(async () => current.setNotes('Primeira versão')); await tick()
    await React.act(async () => current.setNotes('Versão final'))
    let result
    const completion = current.flush().then(value => { result = value })
    await React.act(async () => completions[0]())
    assert.equal(result, undefined)
    await React.act(async () => { completions[1](); await completion })
    assert.deepEqual(result, { confirmed: true, local: false, unchanged: false })
  } finally { await view.close() }
})
test('drafts from another account are not loaded', async () => {
  const view = await mount({ draft: 'Texto da primeira conta', owner: 202 })
  try { assert.equal(current.notes, 'Texto no servidor'); assert.equal(current.status, 'saved') } finally { await view.close() }
})
test('clearing a note sends the empty text instead of restoring an old draft', async () => {
  const view = await mount()
  try {
    let sent; adapter = async config => { sent = JSON.parse(config.data).texto; return response(config, {}) }
    await React.act(async () => current.setNotes('')); await tick()
    assert.equal(sent, ''); assert.equal(current.status, 'saved')
  } finally { await view.close() }
})
test('device storage failure never claims the note was saved locally', async () => {
  const view = await mount()
  const original = dom.window.Storage.prototype.setItem
  try {
    dom.window.Storage.prototype.setItem = () => { throw new Error('Storage full') }
    adapter = async config => { throw new axios.AxiosError('offline', 'ERR_NETWORK', config) }
    await React.act(async () => current.setNotes('Texto sem confirmação'))
    assert.equal(current.status, 'unsaved')
    await tick()
    assert.equal(current.status, 'unsaved')
  } finally { dom.window.Storage.prototype.setItem = original; await view.close() }
})

test('a confirmed device copy can be reopened when the account is unavailable', async () => {
  const view = await mount({ confirmedDraft: 'Última versão confirmada', failLoad: true });
  try { assert.equal(current.notes, 'Última versão confirmada'); assert.equal(current.status, 'cached'); assert.equal(current.loading, false); }
  finally { await view.close(); }
});
test('failed loading without a recoverable copy cannot silently overwrite an unseen note', async () => {
  const view = await mount({ failLoad: true });
  try {
    assert.equal(current.status, 'unavailable'); assert.equal(current.loading, true);
    await React.act(async () => current.setNotes('Não sobrescrever o que não carregou'));
    assert.equal(current.notes, '');
    adapter = async config => response(config, { texto: 'Nota recuperada do servidor' });
    await React.act(async () => current.retry());
    assert.equal(current.notes, 'Nota recuperada do servidor'); assert.equal(current.status, 'saved');
  } finally { await view.close(); }
});
