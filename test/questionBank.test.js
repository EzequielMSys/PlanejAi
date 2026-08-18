const test = require('node:test');
const assert = require('node:assert/strict');
const questoes = require('../src/data/questionBank');

test('banco possui ao menos 100 questões e respostas equilibradas', () => {
  const distribuicao = questoes.reduce((total, questao) => {
    total[questao.resposta] += 1;
    return total;
  }, [0, 0, 0, 0]);

  assert.ok(questoes.length >= 100);
  assert.ok(new Set(questoes.map((questao) => questao.enunciado)).size === questoes.length);
  const diferenca = Math.max(...distribuicao) - Math.min(...distribuicao);
  assert.ok(diferenca <= 3, `Distribuição desequilibrada: ${distribuicao.join('/')}`);
});

test('toda questão possui quatro alternativas e resposta válida', () => {
  for (const questao of questoes) {
    assert.equal(questao.alternativas.length, 4);
    assert.ok(Number.isInteger(questao.resposta));
    assert.ok(questao.resposta >= 0 && questao.resposta < 4);
    assert.ok(questao.explicacao.length > 20);
  }
});
