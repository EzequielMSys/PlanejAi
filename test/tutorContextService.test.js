const test = require('node:test')
const assert = require('node:assert/strict')
const { carregarContexto } = require('../src/services/tutorContextService')

test('contexto da Lumi consulta apenas dados pedagógicos da conta autenticada', async () => {
  const consultas = []
  const executar = async ({ sql, timeout }, params) => {
    consultas.push({ sql, timeout, params })
    if (sql.includes('FROM perfil_estudo WHERE')) return [[{ objetivo: 'ENEM', areas_foco: 'Matemática' }]]
    if (sql.includes('AS concluidas')) return [[{ total: 1, concluidas: 0, atrasadas: 0, hoje: 1 }]]
    if (sql.includes('FROM cronograma_conteudos')) return [[{ disciplina: 'Matemática', titulo: 'Funções', concluido: 0 }]]
    return [[]]
  }
  const contexto = await carregarContexto(42, executar)
  assert.equal(consultas.length, 6)
  assert.ok(consultas.every((item) => item.params.length === 1 && item.params[0] === 42 && item.timeout === 1200))
  assert.equal(contexto.objetivo, 'ENEM')
  assert.deepEqual(contexto.licoes.map((item) => item.titulo), ['Funções'])
  assert.equal(contexto.cronograma.hoje, 1)
  assert.ok(!JSON.stringify(contexto).includes('email'))
})

test('falta de tabelas opcionais não derruba o contexto', async () => {
  const contexto = await carregarContexto(42, async ({ sql }) => {
    if (sql.includes('FROM perfil_estudo WHERE')) return [[{ objetivo: 'Vestibular' }]]
    throw new Error('Tabela ainda não migrada')
  })
  assert.equal(contexto.objetivo, 'Vestibular')
  assert.deepEqual(contexto.dificuldades, [])
})

test('Lumi recebe progresso e competências somente da conta solicitada', async () => {
  const executar = async ({ sql }, params) => {
    assert.deepEqual(params, [42])
    if (sql.includes('AS concluidas')) return [[{ total: 10, concluidas: 6, atrasadas: 2, hoje: 1 }]]
    if (sql.includes('SELECT tema, texto')) return [[{ tema: 'Educação', texto: 'Meu texto de treino', feedback_ia: 'Revisar C3', nota_estimada: 720, competencias_enem: JSON.stringify([{ codigo: 3, nota: 120, evidencia: 'Meu texto', feedback: 'Aprofunde a tese.' }]) }]]
    if (sql.includes('competencias_enem')) return [[{ tema: 'Educação', nota_estimada: 720, competencias_enem: JSON.stringify([{ codigo: 3, nota: 120, evidencia: 'Meu texto', feedback: 'Aprofunde a tese.' }]) }]]
    return [[]]
  }
  const contexto = await carregarContexto(42, executar, { incluirTextoRedacao: true })
  assert.deepEqual(contexto.cronograma, { total: 10, concluidas: 6, atrasadas: 2, hoje: 1 })
  assert.equal(contexto.redacoes[0].competencias[0].nota, 120)
  assert.equal(contexto.ultimaRedacao.texto, 'Meu texto de treino')
  assert.equal(contexto.ultimaRedacao.competencias[0].evidencia, 'Meu texto')
  assert.equal(contexto.ultimaRedacao.notaEstimada, 720)
})

test('redação selecionada exige ID e proprietário na mesma consulta', async () => {
  const consultas = []
  const contexto = await carregarContexto(42, async ({ sql }, params) => {
    consultas.push({ sql, params })
    return [[]]
  }, { idRedacao: 77 })
  const consulta = consultas.find((item) => item.sql.includes('id_redacao = ?'))
  assert.deepEqual(consulta.params, [77, 42])
  assert.equal(contexto.redacaoSelecionadaIndisponivel, true)
  assert.equal(contexto.ultimaRedacao, undefined)
})
