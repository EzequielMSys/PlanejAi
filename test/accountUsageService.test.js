const test = require('node:test')
const assert = require('node:assert/strict')
const { record, report } = require('../src/services/accountUsageService')

test('serverless requests apply the usage migration once and retry concurrent samples', async () => {
  let ready = false
  let migrations = 0
  const records = []
  const db = {
    async execute(sql, params) {
      if (!ready) throw Object.assign(new Error('missing table'), { code: 'ER_NO_SUCH_TABLE' })
      records.push(params[0])
    },
    async query(sql) {
      assert.match(sql, /CREATE TABLE IF NOT EXISTS uso_diario_conta/)
      migrations++
      ready = true
    }
  }
  await Promise.all([record(7, new Date(), db), record(8, new Date(), db)])
  assert.equal(migrations, 1)
  assert.deepEqual(records.sort(), [7, 8])
})

test('activity samples use the authenticated account, server slots and the São Paulo date', async () => {
  const calls = []
  const db = { execute: async (sql, params) => calls.push({ sql, params }) }
  const now = new Date('2026-11-01T02:59:59.500Z')
  await record(7, now, db)
  await record(7, new Date(now.getTime() + 100), db)
  await record(7, new Date(now.getTime() + 500), db)

  assert.deepEqual(calls[0].params, calls[1].params)
  assert.match(calls[0].sql, /ON DUPLICATE KEY UPDATE\s+segundos = segundos \+ IF\(ultimo_intervalo < \?, \?, 0\)/)
  assert.deepEqual(calls[0].params.slice(0, 3), [7, '2026-10-31', 15])
  assert.deepEqual(calls[2].params.slice(0, 3), [7, '2026-11-01', 15])
  assert.equal(calls[2].params[3], calls[0].params[3] + 1)
})

test('report includes existing deliveries and distinguishes months before tracking from zero usage', async () => {
  const queries = []
  const db = {
    async execute(sql, params) {
      queries.push({ sql, params })
      if (sql.includes('SELECT tipo')) return [[{ tipo: 'aluno' }]]
      if (sql.includes('MIN(dia)')) return [[{ total: '90', inicio: '2026-10-15', medicao_desde: '2026-10-01' }]]
      if (sql.includes('SUM(segundos)')) return [[{ mes: '2026-10', segundos: '90' }]]
      if (sql.includes('GROUP BY dia')) return [[{ dia: '2026-11-11', entregues: '2' }]]
      if (sql.includes('FROM uso_diario_conta')) return [[]]
      if (sql.includes('GROUP BY mes')) return [[{ mes: '2026-09', entregues: '1' }]]
      if (sql.includes('NOT EXISTS')) return [[{ id_atividade: 8, titulo: 'Revisão', data: null, total: '21' }]]
      return [[{ id_atividade: 3, titulo: 'Exercícios', data: '2026-09-18', total: '1' }]]
    }
  }
  const data = await report(7, 'admin', new Date('2026-11-11T18:00:00Z'), db)

  assert.equal(data.segundos, 90)
  assert.equal(data.medicao_desde, '2026-10-01')
  assert.equal(data.inicio, '2026-10-15')
  assert.equal(data.entregues.total, 1)
  assert.equal(data.pendentes.total, 21)
  assert.equal(data.dias.length, 11)
  assert.deepEqual(data.dias.at(-1), { dia: '2026-11-11', segundos: 0, entregues: 2 })
  assert.deepEqual(queries.find(query => query.sql.includes('GROUP BY dia')).params, [7, '2026-11-01', '2026-11-12'])
  assert.deepEqual(data.meses.slice(-3), [
    { mes: '2026-09', segundos: null, entregues: 1 },
    { mes: '2026-10', segundos: 90, entregues: 0 },
    { mes: '2026-11', segundos: 0, entregues: 0 }
  ])
  const deliveryQuery = queries.find(query => query.sql.includes('GROUP BY mes') && query.sql.includes('respondido_em'))
  assert.match(deliveryQuery.sql, /MIN\(respondido_em\)/)
  assert.deepEqual(deliveryQuery.params, [7, '2025-12-01', '2026-12-01'])
  assert.match(queries.find(query => query.sql.includes('NOT EXISTS')).sql, /ta\.ativo = 1 AND t\.ativa = 1/)
})

test('admins cannot consult staff accounts', async () => {
  let count = 0
  const db = { execute: async () => { count++; return [[{ tipo: 'dono' }]] } }
  assert.equal(await report(7, 'admin', new Date(), db), null)
  assert.equal(count, 1)
})
