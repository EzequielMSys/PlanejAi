const test = require('node:test')
const assert = require('node:assert/strict')
const { _test } = require('../src/controllers/atividadeController')

test('normaliza ordenação e associação sem perder pesos e critérios', () => {
  const atividade = _test.validarAtividade({
    titulo: 'Atividade 2.0',
    questoes: [
      { id: 'ordem', enunciado: 'Ordene', tipo: 'ORDENACAO', opcoes: ['A', 'B', 'C'], pontos: 2 },
      { id: 'pares', enunciado: 'Associe', tipo: 'ASSOCIACAO', pares: [{ esquerda: 'Brasil', direita: 'Brasília' }, { esquerda: 'Chile', direita: 'Santiago' }], pontos: 3, rubrica: ['Coerência'] }
    ]
  })

  assert.deepEqual(atividade.questoes[0].resposta_correta, ['A', 'B', 'C'])
  assert.deepEqual(atividade.questoes[1].resposta_correta, { Brasil: 'Brasília', Chile: 'Santiago' })
  assert.equal(atividade.questoes[1].pontos, 3)
})

test('correção híbrida preserva a parcela automática e sinaliza resposta manual', () => {
  const questoes = [
    { id: 'objetiva', tipo: 'MULTIPLA_ESCOLHA', resposta_correta: 'B', pontos: 2 },
    { id: 'texto', tipo: 'DISSERTATIVA', pontos: 3 }
  ]
  const resultado = _test.corrigirAutomaticamente(questoes, { objetiva: 'B', texto: 'Resposta do aluno' })

  assert.equal(resultado.requerManual, true)
  assert.equal(resultado.pontosAutomaticos, 2)
  assert.equal(resultado.pontosTotais, 5)
  assert.equal(resultado.detalhes[1].status, 'AGUARDA_CORRECAO')
})

test('visão do aluno remove gabaritos e o rascunho privado do professor', () => {
  const atividade = _test.semGabarito({
    titulo: 'Segura',
    rascunho: { questoes: [{ resposta_correta: 'segredo' }] },
    questoes: [{ id: 'q1', tipo: 'ASSOCIACAO', resposta_correta: { A: 'B' }, pares: [{ esquerda: 'A', direita: 'B' }] }]
  })

  assert.equal('rascunho' in atividade, false)
  assert.equal('resposta_correta' in atividade.questoes[0], false)
  assert.equal(atividade.questoes[0].pares, undefined)
})
