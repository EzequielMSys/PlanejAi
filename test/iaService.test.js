const test = require('node:test');
const assert = require('node:assert/strict');
const iaConfig = require('../src/config/iaConfig');
const iaService = require('../src/services/iaService');
const { getOpenAIClient, resetOpenAIClient } = require('../src/utils/openaiClient');

const { validarEntrada, normalizarHistorico, montarMensagensParaApi, resolverErroCliente, LIMITE_CARACTERES_MENSAGEM } = iaService._test;

test('configurações default da IA são coerentes e seguras', () => {
  assert.equal(iaConfig.model, 'deepseek/deepseek-chat');
  assert.ok(iaConfig.maxTokens > 0);
  assert.ok(iaConfig.temperature >= 0 && iaConfig.temperature <= 1);
  assert.ok(iaConfig.dailyLimit >= 0);
  assert.ok(iaConfig.historyTrim > 0);
  assert.ok(iaConfig.mensagensUsuario.noKey.length > 0);
  assert.equal(typeof iaConfig.baseUrl, 'string');
});

test('systemPrompt inclui nome e disciplina quando informados', () => {
  const prompt = iaConfig.systemPrompt('Maria Souza', 'Física');
  assert.match(prompt, /Maria Souza/);
  assert.match(prompt, /Física/);
  assert.match(prompt, /PlanejAI Assistente/);
});

test('systemPrompt funciona sem nome e sem disciplina', () => {
  const prompt = iaConfig.systemPrompt(undefined, undefined);
  assert.match(prompt, /PlanejAI Assistente/);
  assert.doesNotMatch(prompt, /Nome do estudante/);
  assert.doesNotMatch(prompt, /disciplina: undefined/);
});

test('validarEntrada rejeita mensagem vazia com código amigável', () => {
  assert.throws(() => validarEntrada(''), { code: 'ERR_EMPTY_MESSAGE' });
  assert.throws(() => validarEntrada('   '), { code: 'ERR_EMPTY_MESSAGE' });
  assert.throws(() => validarEntrada(undefined), { code: 'ERR_EMPTY_MESSAGE' });
  assert.throws(() => validarEntrada(null), { code: 'ERR_EMPTY_MESSAGE' });
});

test('validarEntrada recorta, trim e limita o tamanho máximo', () => {
  assert.equal(validarEntrada('  ola  '), 'ola');
  const huge = 'x'.repeat(LIMITE_CARACTERES_MENSAGEM + 500);
  assert.equal(validarEntrada(huge).length, LIMITE_CARACTERES_MENSAGEM);
});

test('normalizarHistorico converte colunas do banco para o formato da API', () => {
  const rows = [{ role: 'user', conteudo: 'oi', disciplina: 'Matemática' }];
  assert.deepEqual(normalizarHistorico(rows), [{ role: 'user', content: 'oi' }]);
});

test('normalizarHistorico normaliza conteúdo não-string com segurança', () => {
  const out = normalizarHistorico([{ role: 'assistant', conteudo: 123 }]);
  assert.equal(out[0].content, '123');
  assert.equal(out[0].role, 'assistant');
});

test('montarMensagensParaApi coloca system primeiro e preserva a ordem do histórico', () => {
  const historico = [{ role: 'user', content: 'a' }, { role: 'assistant', content: 'b' }];
  const msgs = montarMensagensParaApi('INSTRUCAO', historico);
  assert.equal(msgs.length, 3);
  assert.deepEqual(msgs[0], { role: 'system', content: 'INSTRUCAO' });
  assert.deepEqual(msgs[1], { role: 'user', content: 'a' });
  assert.deepEqual(msgs[2], { role: 'assistant', content: 'b' });
});

test('resolverErroCliente mapeia motivos para mensagens amigáveis', () => {
    assert.equal(resolverErroCliente('NO_KEY'), iaConfig.mensagensUsuario.noKey);
  assert.equal(resolverErroCliente('PACKAGE_MISSING'), iaConfig.mensagensUsuario.packageMissing);
  assert.equal(resolverErroCliente(undefined), iaConfig.mensagensUsuario.apiError);
});

test('getOpenAIClient devolve NO_KEY quando a chave está ausente', () => {
  resetOpenAIClient();
  const original = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const { client, reason } = getOpenAIClient();
    assert.equal(client, null);
    assert.equal(reason, 'NO_KEY');
  } finally {
    if (original !== undefined) process.env.OPENAI_API_KEY = original;
    resetOpenAIClient();
  }
});

test('getOpenAIClient aceita chave de provedor compatível (sem prefixo sk-)', () => {
  resetOpenAIClient();
  const originalKey = process.env.OPENAI_API_KEY;
  const originalBase = process.env.OPENAI_BASE_URL;
  process.env.OPENAI_API_KEY = 'ba5bc08f3db7eb15ce636a1bc1f1650d';
  process.env.OPENAI_BASE_URL = 'https://api.aimlapi.com/v1';
  try {
    const { client, error, reason } = getOpenAIClient();
    assert.equal(error, null);
    assert.equal(reason, null);
    assert.ok(client);
    // O cliente precisa apontar para a AIMLAPI e não para a api.openai.com.
    assert.equal(client.baseURL, 'https://api.aimlapi.com/v1');
  } finally {
    if (originalKey !== undefined) process.env.OPENAI_API_KEY = originalKey;
    else delete process.env.OPENAI_API_KEY;
    if (originalBase !== undefined) process.env.OPENAI_BASE_URL = originalBase;
    else delete process.env.OPENAI_BASE_URL;
    resetOpenAIClient();
  }
});

test('getOpenAIClient rejeita chave curta ou malformada', () => {
  resetOpenAIClient();
  const original = process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY = 'chave-invalida';
  try {
    const { client, reason } = getOpenAIClient();
    assert.equal(client, null);
    assert.equal(reason, 'NO_KEY');
  } finally {
    if (original !== undefined) process.env.OPENAI_API_KEY = original;
    resetOpenAIClient();
  }
});
