const test = require('node:test')
const assert = require('node:assert/strict')
const { planJourney } = require('../src/utils/journeyPlanner')

test('monta uma sessão que respeita exatamente o tempo disponível', () => {
  const plan = planJourney(45, { reviews: 3, errors: 2, criticalDiscipline: 'Matemática', nextContent: { titulo: 'Funções', disciplina: 'Matemática' } })
  assert.equal(plan.plannedMinutes, 45)
  assert.ok(plan.blocks.some((block) => block.type === 'REVISAO'))
  assert.ok(plan.blocks.some((block) => block.type === 'CONTEUDO'))
})

test('sessão curta prioriza revisão antes da prática genérica', () => {
  const plan = planJourney(15, { reviews: 1 })
  assert.equal(plan.blocks[0].type, 'REVISAO')
  assert.equal(plan.plannedMinutes, 15)
})

test('limita tempos inválidos ao intervalo seguro', () => {
  assert.equal(planJourney(2, {}).totalMinutes, 10)
  assert.equal(planJourney(500, {}).totalMinutes, 180)
})
