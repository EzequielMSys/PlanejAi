const test = require('node:test');
const assert = require('node:assert/strict');
const { atualizarDominio, recomendarDificuldade, escolherProximaAcao } = require('../src/utils/masteryEngine');

test('acerto com certeza aumenta mais domínio que acerto por chute', () => {
  const base = { dominio: 40, evidencias: 4, acertos: 2, confianca_media: 60 };
  const certeza = atualizarDominio(base, { acertou: true, confianca: 'CERTEZA', dificuldade: 'MEDIA' });
  const chute = atualizarDominio(base, { acertou: true, confianca: 'CHUTEI', dificuldade: 'MEDIA' });
  assert.ok(certeza.dominio > chute.dominio);
});

test('erro com certeza reduz domínio por possível concepção equivocada', () => {
  const resultado = atualizarDominio({ dominio: 70, evidencias: 8 }, { acertou: false, confianca: 'CERTEZA' });
  assert.ok(resultado.dominio < 60);
});

test('dificuldade recomendada acompanha o domínio', () => {
  assert.equal(recomendarDificuldade(20), 'FACIL');
  assert.equal(recomendarDificuldade(60), 'MEDIA');
  assert.equal(recomendarDificuldade(90), 'DIFICIL');
});

test('revisões vencidas têm prioridade sobre conteúdo novo', () => {
  assert.equal(escolherProximaAcao({ revisoes: 2, erros: 5 }).tipo, 'REVISAO');
});
