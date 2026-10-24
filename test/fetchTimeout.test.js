const test = require('node:test'), assert = require('node:assert/strict')
test('a stalled session lookup aborts instead of leaving the app loading forever', async () => {
  const previousFetch = global.fetch, previousWindow = global.window
  global.window = { AbortController, setTimeout, clearTimeout }
  global.fetch = (_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted'))))
  try {
    const { fetchWithTimeout } = await import('../frontend/src/utils/fetchWithTimeout.js')
    await assert.rejects(fetchWithTimeout('/perfil', {}, 10), /aborted/)
  } finally { global.fetch = previousFetch; global.window = previousWindow }
})
test('a successful lookup clears its timeout and preserves request options', async () => {
  const previousFetch = global.fetch, previousWindow = global.window
  let cleared = false
  global.window = { AbortController, setTimeout, clearTimeout(timer) { cleared = true; clearTimeout(timer) } }
  global.fetch = async (_url, options) => { assert.equal(options.headers.Authorization, 'Bearer fixture'); return { ok: true } }
  try {
    const { fetchWithTimeout } = await import('../frontend/src/utils/fetchWithTimeout.js')
    assert.equal((await fetchWithTimeout('/perfil', { headers: { Authorization: 'Bearer fixture' } })).ok, true)
    assert.equal(cleared, true)
  } finally { global.fetch = previousFetch; global.window = previousWindow }
})
