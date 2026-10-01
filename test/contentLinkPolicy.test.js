const test = require('node:test');
const assert = require('node:assert/strict');
const { getDirectResource, isSearchUrl, validateDirectResource } = require('../src/utils/contentLinkPolicy');

test('recurso conhecido nunca retorna busca genérica', () => {
  const recurso = getDirectResource('Funções do 1º grau');
  assert.ok(recurso?.link);
  assert.equal(isSearchUrl(recurso.link), false);
  assert.doesNotThrow(() => validateDirectResource(recurso.link, recurso.tipo));
});

test('bloqueia URLs de busca', () => {
  assert.equal(isSearchUrl('https://www.google.com/search?q=matematica'), true);
  assert.throws(() => validateDirectResource('https://www.youtube.com/results?search_query=fisica', 'VIDEO'), /não uma página de pesquisa/);
});

