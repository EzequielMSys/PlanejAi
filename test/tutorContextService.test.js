const test = require('node:test')
const assert = require('node:assert/strict')
const { carregarContexto } = require('../src/services/tutorContextService')

test('contexto da Lumi consulta apenas dados pedagógicos da conta autenticada', async () => {
  const consultas = []
  const executar = async ({ sql, timeout }, params) => {
    consultas.push({ sql, timeout, params })
    if (sql.includes('FROM perfil_estudo WHERE')) return [[{ objetivo: 'ENEM', areas_foco: 'Matemática' }]]
    if (sql.includes('FROM cronograma_conteudos')) return [[{ disciplina: 'Matemática', titulo: 'Funções', concluido: 0 }]]
    return [[]]
  }
  const contexto = await carregarContexto(42, executar)
  assert.equal(consultas.length, 5)
  assert.ok(consultas.every((item) => item.params.length === 1 && item.params[0] === 42 && item.timeout === 1200))
  assert.equal(contexto.objetivo, 'ENEM')
  assert.deepEqual(contexto.licoes.map((item) => item.titulo), ['Funções'])
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
