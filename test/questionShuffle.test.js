const test = require('node:test')
const assert = require('node:assert/strict')
const { embaralharQuestao, validarEmbaralhamento } = require('../src/utils/questionShuffle')

test('embaralhamento preserva alternativas e produz ordem validável', () => {
  const questao = { id_questao: 42, alternativas: ['A', 'B', 'C', 'D'] }
  const resultado = embaralharQuestao(questao, () => 0.1, 1000)
  const ordem = validarEmbaralhamento(resultado.embaralhamento, 42, 2000)
  assert.deepEqual(resultado.alternativas, ordem.map((indice) => questao.alternativas[indice]))
  assert.notDeepEqual(ordem, [0, 1, 2, 3])
})

test('token adulterado ou associado a outra questão é recusado', () => {
  const resultado = embaralharQuestao({ id_questao: 7, alternativas: ['A', 'B', 'C', 'D'] })
  assert.throws(() => validarEmbaralhamento(`${resultado.embaralhamento}x`, 7), /adulterada/)
  assert.throws(() => validarEmbaralhamento(resultado.embaralhamento, 8), /inválida/)
})
