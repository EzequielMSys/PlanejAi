const test = require('node:test')
const assert = require('node:assert/strict')
const { distribuirQuestoes } = require('../src/utils/examDifficulty')

test('mistura níveis em proporção 30/40/30', () => {
  assert.deepEqual(distribuirQuestoes(10, { FACIL: 20, MEDIA: 20, DIFICIL: 20 }), { FACIL: 3, MEDIA: 4, DIFICIL: 3 })
})

test('redistribui quando uma dificuldade tem poucas questões', () => {
  const distribuicao = distribuirQuestoes(10, { FACIL: 1, MEDIA: 10, DIFICIL: 10 })
  assert.equal(distribuicao.FACIL, 1)
  assert.equal(Object.values(distribuicao).reduce((total, valor) => total + valor, 0), 10)
})

test('não promete mais questões que o banco oferece', () => {
  assert.deepEqual(distribuirQuestoes(10, { FACIL: 1, MEDIA: 2, DIFICIL: 3 }), { FACIL: 1, MEDIA: 2, DIFICIL: 3 })
})
