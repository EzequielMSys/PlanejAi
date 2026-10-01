const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularProximaRevisao } = require('../src/utils/reviewScheduler');

test('esquecer reinicia a sequência e agenda para amanhã', () => {
  const resultado = calcularProximaRevisao({ repeticoes: 5, intervalo_dias: 30, nivel_dominio: 8 }, 'ESQUECI', new Date('2026-08-18T12:00:00Z'));
  assert.equal(resultado.repeticoes, 0);
  assert.equal(resultado.intervaloDias, 1);
  assert.equal(resultado.nivelDominio, 6);
  assert.equal(resultado.proximaRevisao, '2026-08-19');
});

test('domínio aumenta intervalo sem ultrapassar 120 dias', () => {
  const resultado = calcularProximaRevisao({ repeticoes: 8, intervalo_dias: 100, nivel_dominio: 9 }, 'DOMINEI', new Date('2026-08-18T12:00:00Z'));
  assert.equal(resultado.intervaloDias, 120);
  assert.equal(resultado.nivelDominio, 10);
});

test('recusa resultado desconhecido', () => {
  assert.throws(() => calcularProximaRevisao({}, 'TALVEZ'), /inválido/);
});

