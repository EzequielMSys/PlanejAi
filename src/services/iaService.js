const { getOpenAIClient } = require('../utils/openaiClient')
const iaConfig = require('../config/iaConfig')
const model = require('../models/inteligenciaModel')

const LIMITE_CARACTERES_MENSAGEM = 2000

/**
 * Valida e normaliza a mensagem do usuário antes de enviá-la à API.
 * Lança erro quando a mensagem é vazia. Exportada para testes.
 */
function validarEntrada(mensagem) {
  if (!mensagem || typeof mensagem !== 'string' || !mensagem.trim()) {
    const err = new Error(iaConfig.mensagensUsuario.emptyMessage)
    err.code = 'ERR_EMPTY_MESSAGE'
    throw err
  }
  return mensagem.trim().slice(0, LIMITE_CARACTERES_MENSAGEM)
}

/**
 * Normaliza linhas do banco { role, conteudo } para o formato aceito pela API
 * da OpenAI: [{ role, content }]. Exportada para testes.
 */
function normalizarHistorico(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    role: row.role,
    content: typeof row.conteudo === 'string' ? row.conteudo : String(row.conteudo || ''),
  }))
}

/**
 * Monta a carga de mensagens enviada à OpenAI: system + histórico.
 * Exportada para testes.
 */
function montarMensagensParaApi(system, historicoNormalizado) {
  return [{ role: 'system', content: system }, ...historicoNormalizado]
}

/**
 * Mapeia o motivo de indisponibilidade do cliente para uma mensagem amigável.
 * Exportada para testes.
 */
function resolverErroCliente(reason) {
  if (reason === 'NO_KEY') return iaConfig.mensagensUsuario.noKey
  if (reason === 'PACKAGE_MISSING') return iaConfig.mensagensUsuario.packageMissing
  return iaConfig.mensagensUsuario.apiError
}

async function listarConversa(idUsuario, limite) {
  const rows = await model.listarMensagensChat(idUsuario, Number(limite) || 20)
  return rows.map((row) => ({
    role: row.role,
    conteudo: row.conteudo,
    disciplina: row.disciplina,
    criado_em: row.criado_em,
  }))
}

async function limparConversa(idUsuario) {
  return model.limparConversaChat(idUsuario)
}

/**
 * Monta o payload enviado ao /chat/completions.
 * `reasoning_effort` só entra quando configurado: provedores que não conhecem
 * o parâmetro rejeitariam a requisição inteira.
 * Exportada para testes.
 */
function montarPayloadChat(mensagens) {
  const payload = {
    model: iaConfig.model,
    messages: mensagens,
    max_tokens: iaConfig.maxTokens,
    temperature: iaConfig.temperature,
  }
  if (iaConfig.reasoningEffort) payload.reasoning_effort = iaConfig.reasoningEffort
  return payload
}

/**
 * Classifica o erro devolvido pela API do provedor de IA.
 *
 * - 'QUOTA' → saldo/cota esgotado no provedor (ex.: HTTP 403 "You've run out
 *   of funds", 402 Payment Required, insufficient_quota). É um problema de
 *   faturamento/configuração da conta no provedor, não do estudante.
 * - null    → qualquer outro erro (rede, 5xx, payload inválido...).
 *
 * Exportada para testes.
 */
function classificarErroApi(apiError) {
  const status = Number(apiError?.status || apiError?.response?.status || 0)
  if (status === 402 || status === 403) return 'QUOTA'

  const texto = [apiError?.message, apiError?.error?.message, apiError?.code]
    .filter((parte) => typeof parte === 'string')
    .join(' ')
    .toLowerCase()
  if (
    /run out of funds|insufficient[_ ](?:quota|credit)|exceeded your (?:current )?quota|out of credit|credit balance|payment method|billing|top up your balance|quota exceeded/.test(texto)
  ) {
    return 'QUOTA'
  }
  return null
}

/**
 * Envia uma mensagem do estudante para a OpenAI e persiste a resposta.
 *
 * Fluxo:
 *  1. validar entrada;
 *  2. aplicar limite diário (protege contra consumo excessivo);
 *  3. persistir a mensagem do usuário (histórico consistente mesmo em falha);
 *  4. montar system + histórico recente e chamar a API;
 *  5. persistir a resposta do assistente;
 *  6. devolver a conversa atualizada para sincronizar o cliente.
 */
async function enviarMensagem(idUsuario, mensagem, disciplina, nomeUsuario) {
  const conteudo = validarEntrada(mensagem)
  const disciplinaNormalizada = disciplina ? String(disciplina).trim().slice(0, 100) : null

  if (iaConfig.dailyLimit > 0) {
    const hoje = await model.contagemMensagensDoDia(Number(idUsuario))
    if (hoje >= iaConfig.dailyLimit) {
      const err = new Error(iaConfig.mensagensUsuario.dailyLimit)
      err.code = 'ERR_DAILY_LIMIT'
      throw err
    }
  }

  await model.salvarMensagemChat(Number(idUsuario), 'user', conteudo, disciplinaNormalizada)

  const { client, reason } = getOpenAIClient()
  if (!client) {
    const err = new Error(resolverErroCliente(reason))
    err.code = 'ERR_CLIENT'
    throw err
  }

  const historicoRows = await model.listarMensagensChat(Number(idUsuario), iaConfig.historyTrim)
  const messages = montarMensagensParaApi(
    iaConfig.systemPrompt(nomeUsuario, disciplinaNormalizada),
    normalizarHistorico(historicoRows),
  )

  let resposta
  try {
    const completion = await client.chat.completions.create(montarPayloadChat(messages))
    resposta =
      completion.choices?.[0]?.message?.content?.trim() ||
      'Não consegui formular uma resposta. Tente reformular a pergunta.'
  } catch (apiError) {
    const tipoErro = classificarErroApi(apiError)
    const status = apiError?.status || apiError?.response?.status || '(sem status)'
    console.error('[IA] Erro ao chamar a OpenAI:', apiError?.message || apiError, '| status:', status)
    const err = new Error(
      tipoErro === 'QUOTA' ? iaConfig.mensagensUsuario.semCredito : iaConfig.mensagensUsuario.apiError,
    )
    err.code = tipoErro === 'QUOTA' ? 'ERR_QUOTA' : 'ERR_API'
    throw err
  }

  await model.salvarMensagemChat(Number(idUsuario), 'assistant', resposta, disciplinaNormalizada)

  const atualizado = await model.listarMensagensChat(Number(idUsuario), iaConfig.historyTrim)
  return {
    role: 'assistant',
    conteudo: resposta,
    disciplina: disciplinaNormalizada,
    mensagens: atualizado.map((row) => ({
      role: row.role,
      conteudo: row.conteudo,
      disciplina: row.disciplina,
    })),
  }
}

module.exports = {
  enviarMensagem,
  listarConversa,
  limparConversa,
  _test: {
    validarEntrada,
    normalizarHistorico,
    montarMensagensParaApi,
    montarPayloadChat,
    resolverErroCliente,
    classificarErroApi,
    LIMITE_CARACTERES_MENSAGEM,
  },
}