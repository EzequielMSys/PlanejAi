const test = require('node:test')
const assert = require('node:assert/strict')
const { embaralharQuestao, embaralharQuestaoComOrdem, embaralharSimulado, validarEmbaralhamento } = require('../src/utils/questionShuffle')

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

test('retomada recria a mesma ordem de alternativas da avaliação original', () => {
  const questao = { id_questao: 19, alternativas: ['A', 'B', 'C', 'D'] }
  const original = embaralharQuestao(questao, () => 0.1, 1000)
  const ordem = validarEmbaralhamento(original.embaralhamento, 19, 2000)
  const retomada = embaralharQuestaoComOrdem(questao, ordem, 3000)
  assert.deepEqual(retomada.alternativas, original.alternativas)
  assert.deepEqual(validarEmbaralhamento(retomada.embaralhamento, 19, 4000), ordem)
})

test('simulado distribui as respostas corretas sem repetir posição em sequência', () => {
  const questoes = Array.from({ length: 10 }, (_, indice) => ({
    id_questao: indice + 1,
    alternativas: ['A', 'B', 'C', 'D'],
    resposta_correta: indice % 4,
    explicacao: 'Não deve ser enviada ao navegador.'
  }))
  const resultado = embaralharSimulado(questoes, () => 0.37, 1000)
  const posicoes = resultado.map((questao, indice) => {
    const ordem = validarEmbaralhamento(questao.embaralhamento, indice + 1, 2000)
    return ordem.indexOf(questoes[indice].resposta_correta)
  })
  const totais = [0, 1, 2, 3].map((posicao) => posicoes.filter((item) => item === posicao).length)
  assert.ok(Math.max(...totais) - Math.min(...totais) <= 1)
  assert.ok(posicoes.every((posicao, indice) => indice === 0 || posicao !== posicoes[indice - 1]))
  assert.ok(resultado.every((questao) => !('resposta_correta' in questao) && !('explicacao' in questao)))
})
