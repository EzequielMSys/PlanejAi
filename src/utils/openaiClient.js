/**
 * Cliente singleton para a API de IA (OpenAI oficial ou provedor compatível,
 * como a AIMLAPI — ver OPENAI_BASE_URL).
 *
 * O `require('openai')` é feito de forma preguiçosa (lazy) dentro da função de
 * fábrica. Assim o processo do servidor ainda sobe normalmente caso o pacote
 * não esteja instalado ou a chave não esteja configurada — a API responde com
 * uma mensagem amigável ao invés de derrubar o bootstrap.
 *
 * A chave da API nunca deve ser exposta ao frontend: ela vive apenas em
 * `process.env.OPENAI_API_KEY` no backend.
 */
let OpenAIConstructor = null;
let client = null;

function getOpenAIClient() {
  if (client) return { client, error: null, reason: null };

  const apiKey = (process.env.OPENAI_API_KEY || '').trim();
  // Aceita chaves no formato OpenAI (sk-...) e chaves de provedores compatíveis
  // (ex.: a hex de 32 caracteres da AIMLAPI), desde que tenham formato plausível.
  if (!apiKey || !/^[A-Za-z0-9_-]{16,}$/.test(apiKey)) {
    const err = new Error('OPENAI_API_KEY não configurada ou inválida.');
    err.code = 'NO_KEY';
    return { client: null, error: err, reason: 'NO_KEY' };
  }

  if (!OpenAIConstructor) {
    try {
      // eslint-disable-next-line global-require
      OpenAIConstructor = require('openai');
    } catch (requireError) {
      requireError.code = 'PACKAGE_MISSING';
      return { client: null, error: requireError, reason: 'PACKAGE_MISSING' };
    }
  }

  try {
    // OPENAI_BASE_URL permite apontar para provedores compatíveis com a
    // API da OpenAI (ex.: https://api.aimlapi.com/v1). Vazia, o SDK usa a
    // api.openai.com padrão.
    const baseURL = (process.env.OPENAI_BASE_URL || '').trim() || undefined;
    client = new OpenAIConstructor({ apiKey, baseURL });
    return { client, error: null, reason: null };
  } catch (error) {
    error.code = 'INIT_ERROR';
    return { client: null, error, reason: 'INIT_ERROR' };
  }
}

/** Força a invalidação do cliente cacheado (usado em testes). */
function resetOpenAIClient() {
  client = null;
  OpenAIConstructor = null;
}

module.exports = { getOpenAIClient, resetOpenAIClient };
