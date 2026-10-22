const test = require('node:test')
const assert = require('node:assert/strict')
const { recordWebVital, webVitalSnapshot } = require('../src/services/metricsService')

test('field metrics keep only known routes and numeric measurements', () => {
  assert.equal(recordWebVital({ name: 'LCP', route: '/inicio', value: 1234 }), true)
  assert.equal(recordWebVital({ name: 'LCP', route: '/inicio/123', value: 999 }), false)
  assert.equal(recordWebVital({ name: 'EMAIL', route: '/inicio', value: 1 }), false)
  assert.equal(recordWebVital({ name: 'INP', route: '/inicio', value: '42' }), false)
  assert.equal(recordWebVital({ name: 'CLS', route: '/inicio', value: Number.NaN }), false)
  assert.equal(webVitalSnapshot().find((item) => item.route === '/inicio' && item.name === 'LCP').p75, 1234)
})

test('field metrics report the 75th percentile and bound stored samples', () => {
  for (let value = 1; value <= 400; value += 1) recordWebVital({ name: 'INP', route: '/redacoes', value })
  const metric = webVitalSnapshot().find((item) => item.route === '/redacoes' && item.name === 'INP')
  assert.equal(metric.count, 400)
  assert.equal(metric.p75, 325)
})
