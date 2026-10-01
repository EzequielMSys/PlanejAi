const test = require('node:test');
const assert = require('node:assert/strict');
const { replanejarPendencias, gerarCalendarioIcs } = require('../src/utils/adaptiveSchedule');

test('replaneja apenas tarefas atrasadas e pendentes, no máximo três por dia', () => {
  const itens = Array.from({ length: 5 }, (_, id) => ({ id, data_dia: '2026-08-10', titulo: `Item ${id}`, concluido: 0 }));
  itens.push({ id: 9, data_dia: '2026-08-10', concluido: 1 });
  const resultado = replanejarPendencias(itens, new Date('2026-08-18T12:00:00Z'));
  assert.equal(resultado.length, 5);
  assert.equal(resultado[0].novaData, '2026-08-19');
  assert.equal(resultado[3].novaData, '2026-08-20');
});

test('gera calendário ICS válido e escapa pontuação', () => {
  const ics = gerarCalendarioIcs([{ id: 1, data_dia: '2026-08-20', titulo: 'Física; ondas', disciplina: 'Física' }]);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260820/);
  assert.match(ics, /Física\\; ondas/);
});

