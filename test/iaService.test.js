const test = require('node:test');
const assert = require('node:assert/strict');
const iaConfig = require('../src/config/iaConfig');
const iaService = require('../src/services/iaService');
const { getOpenAIClient, resetOpenAIClient } = require('../src/utils/openaiClient');

const { validarEntrada, normalizarHistorico, montarMensagensParaApi, resolverErroCliente, normalizarEstudoAtual, LIMITE_CARACTERES_MENSAGEM } = iaService._test;

test('configurações default da IA são coerentes e seguras', () => {
  assert.equal(iaConfig.model, 'deepseek/deepseek-chat');
  assert.ok(iaConfig.maxTokens > 0);
  assert.ok(iaConfig.temperature >= 0 && iaConfig.temperature <= 1);
  assert.ok(iaConfig.dailyLimit >= 0);
  assert.ok(iaConfig.historyTrim > 0);
  assert.ok(iaConfig.mensagensUsuario.noKey.length > 0);
  assert.equal(typeof iaConfig.baseUrl, 'string');
  // Sem env, o reasoning_effort não existe: payloads vão sem ele e funcionam
  // em qualquer provedor compatível.
  assert.ok(iaConfig.reasoningEffort === null || /^(none|low|medium|high)$/.test(iaConfig.reasoningEffort));
});

test('montarPayloadChat monta o corpo esperado e omite reasoning_effort por padrão', () => {
  const { montarPayloadChat } = iaService._test;
  const payload = montarPayloadChat([{ role: 'user', content: 'oi' }]);
  assert.equal(payload.model, iaConfig.model);
  assert.equal(payload.max_tokens, iaConfig.maxTokens);
  assert.equal(payload.temperature, iaConfig.temperature);
  assert.equal(payload.messages.length, 1);
  assert.ok(!('reasoning_effort' in payload), 'sem env configurada, o parâmetro não deve ser enviado');
});

test('systemPrompt inclui nome e disciplina quando informados', () => {
  const prompt = iaConfig.systemPrompt('Maria Souza', 'Física');
  assert.match(prompt, /Maria Souza/);
  assert.match(prompt, /Física/);
  assert.match(prompt, /Lumi/);
  assert.match(prompt, /PlanejAI/);
});

test('systemPrompt funciona sem nome e sem disciplina', () => {
  const prompt = iaConfig.systemPrompt(undefined, undefined);
  assert.match(prompt, /Lumi/);
  assert.doesNotMatch(prompt, /Nome do estudante/);
  assert.doesNotMatch(prompt, /disciplina: undefined/);
});

test('systemPrompt prioriza o conteúdo em andamento para explicar e praticar', () => {
  const prompt = iaConfig.systemPrompt(undefined, 'Física', null, { titulo: 'Leis de Newton', disciplina: 'Física' });
  assert.match(prompt, /priorize o tema e a disciplina da sessão atual/);
  assert.match(prompt, /"titulo":"Leis de Newton"/);
  assert.match(prompt, /"disciplina":"Física"/);
});

test('contexto da sala de estudo limita e normaliza os dados recebidos', () => {
  assert.deepEqual(normalizarEstudoAtual({ titulo: '  Leis de Newton  ', disciplina: ' Física\n', data: '2026-10-22', instrucoes: 'ignored' }), { titulo: 'Leis de Newton', disciplina: 'Física', data: '2026-10-22' });
  assert.equal(normalizarEstudoAtual({ titulo: 'x'.repeat(200) }).titulo.length, 160);
  assert.equal(normalizarEstudoAtual({ titulo: ' ', disciplina: '' }), null);
  assert.equal(normalizarEstudoAtual(null), null);
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

test('classificarErroApi reconhece saldo esgotado (HTTP 403 da AIMLAPI)', () => {
  const { classificarErroApi } = iaService._test;
  const erro403 = new Error("403 You've run out of funds. Please top up your balance or update your payment method to continue: https://aimlapi.com/app/billing/");
  erro403.status = 403;
  assert.equal(classificarErroApi(erro403), 'QUOTA');

  const erro402 = new Error('Payment Required');
  erro402.status = 402;
  assert.equal(classificarErroApi(erro402), 'QUOTA');
});

test('classificarErroApi reconhece cota pelo corpo da mensagem (sem status)', () => {
  const { classificarErroApi } = iaService._test;
  assert.equal(classificarErroApi(new Error('You exceeded your current quota: insufficient_quota')), 'QUOTA');
  assert.equal(classificarErroApi(new Error('Insufficient credit in your account')), 'QUOTA');
});

test('classificarErroApi devolve null para erros genéricos', () => {
  const { classificarErroApi } = iaService._test;
  assert.equal(classificarErroApi(new Error('Connection timeout')), null);
  const erro500 = new Error('Internal Server Error');
  erro500.status = 500;
  assert.equal(classificarErroApi(erro500), null);
  assert.equal(classificarErroApi(undefined), null);
});

test('a mensagem de crédito esgotado existe e é amigável', () => {
  assert.ok(iaConfig.mensagensUsuario.semCredito.length > 0);
  assert.match(iaConfig.mensagensUsuario.semCredito, /IA/i);
});
