const test = require('node:test')
const assert = require('node:assert/strict')

test('métricas de estudo aceitam sessões normais e dados locais danificados', async () => {
  const { metricasDeSessoes } = await import('../frontend/src/utils/studyMetrics.js')
  const lista = [
    { title: 'Matemática', minutes: 25, finishedAt: '2026-10-19T12:00:00.000Z' },
    { title: 'Matemática', minutes: 15, finishedAt: '2026-10-20T12:00:00.000Z' },
    { title: 'História', minutes: '10', finishedAt: 'data inválida' },
  ]
  const resultado = metricasDeSessoes(lista)
  assert.equal(resultado.totalMinutos, 50)
  assert.equal(resultado.totalSessoes, 3)
  assert.deepEqual(resultado.materias, ['Matemática', 'História'])
  assert.equal(resultado.ultimaAtividade, '2026-10-20T12:00:00.000Z')
  assert.deepEqual(metricasDeSessoes({}), {
    totalMinutos: 0, totalSessoes: 0, materias: [], ultimaAtividade: null,
    sessoesHoje: 0, mediaMinutosPorSessao: 0,
  })
})
