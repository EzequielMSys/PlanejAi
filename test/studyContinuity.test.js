const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm'), fs = require('node:fs')
function load(file, pool) {
  const context = { module: { exports: {} }, require: () => pool }
  vm.runInNewContext(fs.readFileSync(require.resolve(file), 'utf8'), context)
  return context.module.exports
}
test('study resume is restricted to the authenticated owner, pending items and active schedules', async () => {
  const service = load('../src/services/studyContinuityService', {})
  const db = { execute: async (sql, values) => {
    assert.match(sql, /p.id_usuario=\?/)
    assert.match(sql, /cc.concluido=0/)
    assert.match(sql, /cr.status='ATIVO'/)
    assert.match(sql, /d.data_estudo<=CURDATE\(\)/)
    assert.deepEqual(Array.from(values), [101])
    return [[{ id: 51, titulo: 'Física', id_conteudo: 7, id_dia: 3, data_estudo: '2026-10-24', tempo_previsto: 30 }]]
  } }
  const result = await service.current(101, db)
  assert.equal(result.conteudo.id, 51)
  assert.equal(result.dia.data_estudo, '2026-10-24')
})
test('attempts to resume unavailable items fail without replacing the owner check', async () => {
  const calls = []
  const service = load('../src/services/studyContinuityService', {})
  const db = { execute: async (sql, args) => { calls.push({ sql, args }); return sql.startsWith('INSERT') ? [{ affectedRows: 0 }] : [[]] } }
  await assert.rejects(service.save(101, 999, db), /não está disponível/)
  assert.deepEqual(Array.from(calls[0].args), [101, 999])
  assert.match(calls[0].sql, /INSERT INTO.*SELECT/s)
  await assert.rejects(service.save(101, -1, db), /inválido/)
})
test('finishing an older session cannot clear a different session opened elsewhere', async () => {
  const service = load('../src/services/studyContinuityService', {})
  await service.clear(101, 51, { execute: async (sql, args) => { assert.match(sql, /id_usuario=\? AND id_item=\?/); assert.deepEqual(Array.from(args), [101, 51]) } })
})
test('availability insert failure rolls back the old schedule and releases the connection', async () => {
  const calls = []
  const db = {
    beginTransaction: async () => calls.push('begin'),
    execute: async (sql, args) => { if (sql.startsWith('SELECT')) { assert.equal(args[0], 101); return [[{ id_perfil: 9 }]] } calls.push('delete'); return [{}] },
    query: async () => { throw new Error('Connection lost') },
    commit: async () => calls.push('commit'), rollback: async () => calls.push('rollback'), release: () => calls.push('release'),
  }
  const model = load('../src/models/disponibilidadeSemanaModel', { getConnection: async () => db })
  await assert.rejects(model.salvarDisponibilidade(101, [{ dia_semana: 'SEG', hora_inicio: '10:00', hora_fim: '11:00', ocupado: 0 }]), /Connection lost/)
  assert.deepEqual(calls, ['begin', 'delete', 'rollback', 'release'])
})
test('an account with no study profile cannot use its user ID to overwrite another profile', async () => {
  let deleted = false
  const model = load('../src/models/disponibilidadeSemanaModel', { getConnection: async () => ({ beginTransaction: async () => {}, execute: async sql => { if (!sql.startsWith('SELECT')) deleted = true; return [[]] }, rollback: async () => {}, release() {} }) })
  await assert.rejects(model.salvarDisponibilidade(101, []), /Salve primeiro/)
  assert.equal(deleted, false)
})
