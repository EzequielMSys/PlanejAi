const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
test('progress highlights actionable review, difficulty and supported improvement', async () => {
  const { learningSignals } = await import('../frontend/src/utils/learningSignals.js')
  const signal = learningSignals({ revisoesHoje: 5, porDisciplina: [{ disciplina: 'Física', tentativas: 1, acerto: 0 }, { disciplina: 'Matemática', tentativas: 6, acerto: 50 }] }, [{ titulo: 'Funções' }], [
    { disciplina: 'História', comparavel: false, amostra_atual: 9, amostra_anterior: 0, variacao: 100 },
    { disciplina: 'Biologia', comparavel: true, amostra_atual: 4, amostra_anterior: 5, variacao: 15 },
  ])
  assert.equal(signal.reviewCount, 5)
  assert.equal(signal.weak.disciplina, 'Matemática')
  assert.equal(signal.improved.disciplina, 'Biologia')
  assert.equal(signal.pending[0].titulo, 'Funções')
})
test('new accounts and sparse samples do not invent improvement or mastery', async () => {
  const { learningSignals } = await import('../frontend/src/utils/learningSignals.js')
  for (const evolution of [[], [{ comparavel: true, amostra_atual: 1, amostra_anterior: 5, variacao: 30 }], [{ comparavel: true, amostra_atual: 5, amostra_anterior: 5, variacao: -10 }]]) {
    const signal = learningSignals(null, [], evolution)
    assert.equal(signal.improved, undefined)
    assert.equal(signal.weak, undefined)
  }
})
test('evolution API distinguishes absent baseline from zero accuracy', async () => {
  const rows = [
    { disciplina: 'Física', atual: 100, anterior: null, amostra_atual: 5, amostra_anterior: 0 },
    { disciplina: 'Química', atual: 60, anterior: 0, amostra_atual: 5, amostra_anterior: 4 },
    { disciplina: 'História', atual: 100, anterior: 50, amostra_atual: 1, amostra_anterior: 4 },
  ]
  const scope = { module: { exports: {} }, require: key => key === '../config/db' ? { execute: async (sql, params) => {
    assert.equal(params[0], 101)
    assert.match(sql, /amostra_atual/)
    return [rows]
  } } : {} }
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/models/aprendizagemModel'), 'utf8'), scope)
  const model = scope.module.exports
  const result = await model.obterEvolucao(101)
  assert.equal(result[0].comparavel, false)
  assert.equal(result[0].variacao, null)
  assert.equal(result[1].comparavel, true)
  assert.equal(result[1].variacao, 60)
  assert.equal(result[2].variacao, null)
})
