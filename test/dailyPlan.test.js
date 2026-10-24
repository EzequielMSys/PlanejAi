const test = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const context = { module: { exports: {} }, require: () => ({}) }
vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/dailyPlanService'), 'utf8'), context)
const { planAdjustment } = context.module.exports
const fixture = () => ({
  days: [{ id_dia: 1, data_estudo: '2026-10-23', tempo_previsto: 60, concluido: 0 }, { id_dia: 2, data_estudo: '2026-10-26', tempo_previsto: 60, concluido: 0 }],
  contents: [{ id: 11, id_dia: 1, concluido: 0 }, { id: 12, id_dia: 1, concluido: 0 }, { id: 21, id_dia: 2, concluido: 0 }],
  dayId: 1, action: 'REDUZIR', today: '2026-10-23', availableDays: ['SEG', 'QUA', 'SEX'], defaultMinutes: 60,
})
test('20-minute adjustment keeps first lesson and moves surplus ahead of future stages', () => {
  const input = fixture()
  const plan = planAdjustment(input)
  assert.equal(plan.updates[0].minutes, 20)
  assert.equal(plan.newDay.date, '2026-10-26')
  assert.equal(plan.moveIds.join(), '12')
  assert.equal(plan.updates[1].date, '2026-10-28')
  assert.equal(input.contents[0].id_dia, 1)
})
test('missed study day respects weekly availability and preserves order', () => {
  const plan = planAdjustment({ ...fixture(), action: 'ADIAR' })
  assert.equal(plan.newDay, null)
  assert.equal(plan.updates.map(item => item.date).join(), '2026-10-26,2026-10-28')
})
test('completed content stays in its original day when remaining work is postponed', () => {
  const input = fixture(); input.action = 'ADIAR'; input.contents[0].concluido = 1
  const plan = planAdjustment(input)
  assert.equal(plan.moveIds.join(), '12')
  assert.equal(plan.updates[0].done, 1)
  assert.equal(plan.updates[0].date, '2026-10-23')
  assert.equal(plan.newDay.date, '2026-10-26')
})
test('single remaining lesson needs no extra day or future changes', () => {
  const input = fixture(); input.contents.splice(1, 1)
  const plan = planAdjustment(input)
  assert.equal(plan.newDay, null)
  assert.equal(plan.updates.length, 1)
})
test('stale actions, future days, missing availability and invalid actions are rejected', () => {
  for (const changes of [{ dayId: 2 }, { today: '2026-10-22' }, { availableDays: [] }, { action: 'INVALID' }]) {
    assert.throws(() => planAdjustment({ ...fixture(), ...changes }), error => [400, 409].includes(error.status))
  }
})
test('already completed future dates are not overwritten', () => {
  const input = fixture()
  input.days.push({ id_dia: 3, data_estudo: '2026-10-26', concluido: 1 })
  const plan = planAdjustment(input)
  assert.equal(plan.newDay.date, '2026-10-28')
  assert.equal(plan.updates[1].date, '2026-10-30')
})
test('server transaction rejects another user and rolls back without mutations', async () => {
  const events = []
  const connection = {
    beginTransaction: async () => events.push('begin'), execute: async () => [[]],
    commit: async () => events.push('commit'), rollback: async () => events.push('rollback'), release: () => events.push('release'),
  }
  const scope = { module: { exports: {} }, require: () => ({ getConnection: async () => connection }) }
  vm.runInNewContext(fs.readFileSync(require.resolve('../src/services/dailyPlanService'), 'utf8'), scope)
  await assert.rejects(scope.module.exports.adjustDay(101, 999, 'ADIAR'), error => error.status === 404)
  assert.deepEqual(events, ['begin', 'rollback', 'release'])
})

test('daily recommendation selects the active plan and skips completed or future lessons', async () => {
  const { dailyStudy } = await import('../frontend/src/utils/dailyStudy.js')
  const content = { id: 11, titulo: 'Funções', concluido: 0 }
  const schedules = [{ status: 'CONCLUIDO', dias: [] }, { status: 'ATIVO', dias: [{ id_dia: 1, data_estudo: '2026-10-23', tempo_previsto: 20, conteudos: [{ concluido: 1 }, content] }] }]
  const now = dailyStudy(schedules, '2026-10-23')
  assert.equal(now.content, content)
  assert.equal(now.minutes, 20)
  assert.equal(now.canStart, true)
  assert.equal(dailyStudy(schedules, '2026-10-22').canStart, false)
  assert.equal(dailyStudy([], '2026-10-23').content, undefined)
})
