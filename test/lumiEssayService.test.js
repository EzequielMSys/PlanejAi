const test = require('node:test')
const assert = require('node:assert/strict')
const { validarAvaliacao, extrairJson } = require('../src/services/lumiEssayService')
const { _test: ia } = require('../src/services/iaService')

const texto = 'A escola pode oferecer aulas de reforço para reduzir a desigualdade.'
const competencias = Array.from({ length: 5 }, (_, i) => ({
  codigo: i + 1,
  nota: 120,
  evidencia: 'A escola pode oferecer aulas de reforço',
  acao: 'Explique quem financiará as aulas e como serão realizadas.',
}))

test('Lumi só atribui nota quando as cinco competências e evidências são válidas', () => {
  const avaliacao = validarAvaliacao({ competencias }, texto)
  assert.equal(avaliacao.notaFinal, 600)
  assert.equal(avaliacao.competencias[4].maximo, 200)
  assert.match(avaliacao.referencia, /gov\.br\/inep/)
  assert.equal(validarAvaliacao({ competencias: competencias.slice(0, 4) }, texto), null)
  assert.equal(validarAvaliacao({ competencias: competencias.map((c, i) => i === 0 ? { ...c, evidencia: 'trecho inventado' } : c) }, texto), null)
  assert.equal(validarAvaliacao({ competencias: competencias.map((c, i) => i === 2 ? { ...c, nota: 133 } : c) }, texto), null)
})

test('evidência pode atravessar uma quebra de linha, mas não pode ser inventada', () => {
  const comQuebra = 'A escola pode oferecer aulas\nde reforço para reduzir a desigualdade.'
  assert.equal(validarAvaliacao({ competencias }, comQuebra).notaFinal, 600)
  assert.equal(validarAvaliacao({ competencias }, 'Outro texto'), null)
})

test('resposta inválida do provedor não vira avaliação', () => {
  assert.equal(extrairJson('O texto merece 900 pontos.'), null)
  assert.deepEqual(extrairJson('```json\n{"competencias":[]}\n```'), { competencias: [] })
})

test('reação da Lumi é removida da resposta visível e validada', () => {
  assert.deepEqual(ia.extrairReacao('Bom raciocínio.\n[LUMI:feliz]'), { conteudo: 'Bom raciocínio.', reacao: 'feliz' })
  assert.deepEqual(ia.extrairReacao('Vamos pensar. [LUMI:invalido]'), { conteudo: 'Vamos pensar. [LUMI:invalido]', reacao: 'neutro' })
})
