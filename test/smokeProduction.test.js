const test = require('node:test')
const assert = require('node:assert/strict')
const { smokeProduction } = require('../src/scripts/smokeProduction')

function fakeFetch(privateStatus = 401, revision = '') {
  return async (url, options) => {
    const path = new URL(url).pathname
    if (path === '/') return { ok: true, status: 200, text: async () => `<div id="root"></div><meta name="planejai-revision" content="${revision}"><script src="/assets/index.js"></script>`, headers: { get: () => "script-src 'self'; object-src 'none'" } }
    if (path === '/assets/index.js') return { ok: true, status: 200, headers: { get: () => 'application/javascript' } }
    if (path === '/api/health') return { ok: true, status: 200, json: async () => ({ status: 'OK', database: 'connected' }) }
    if (path === '/api/auth/login' && options.method === 'POST') return { status: 400 }
    if (path === '/api/usuarios/me') return { status: privateStatus }
    throw new Error(`Unexpected request: ${path}`)
  }
}

test('production smoke confirms frontend, database, login validation and protected account', async () => {
  const result = await smokeProduction({ fetchImpl: fakeFetch(), attempts: 1 })
  assert.deepEqual([result.frontend, result.script, result.api, result.loginValidation, result.privateRoute], [200, 200, 200, 400, 401])
})

test('production smoke fails when account data becomes public', async () => {
  await assert.rejects(smokeProduction({ fetchImpl: fakeFetch(200), attempts: 1 }), /Rota privada/)
})
test('production smoke does not accept the previous deployment after a push', async () => {
  await assert.rejects(smokeProduction({ fetchImpl: fakeFetch(401, 'a'.repeat(40)), expectedRevision: 'b'.repeat(40), attempts: 1 }), /revisão/)
})
