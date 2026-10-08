/**
 * Configurações da camada de IA (AIMLAPI — API de chat compatível com a OpenAI).
 *
 * Mantemos toda a configuração de modelo e limites aqui em um único lugar para
 * que seja fácil de ajustar via ambiente e para que os testes possam validar
 * os valores default e a montagem do prompt de sistema sem tocar a rede.
 */
const MAX_TOKENS_DEFAULT = 1024;
const TEMPERATURE_DEFAULT = 0.7;

const model = (process.env.OPENAI_MODEL || 'deepseek/deepseek-chat').trim();
// Base URL do provedor (ex.: https://api.aimlapi.com/v1). Vazia usa a API
// oficial da OpenAI como padrão do SDK.
const baseUrl = (process.env.OPENAI_BASE_URL || '').trim();
const maxTokens = Number(process.env.OPENAI_MAX_TOKENS || MAX_TOKENS_DEFAULT);
const temperature = Number(process.env.OPENAI_TEMPERATURE || TEMPERATURE_DEFAULT);

// Limite diário de mensagens enviadas por um mesmo usuário. Evita consumo
// descontrolado de tokens e abusos. Zero ou negativo desativa a proteção.
const dailyLimit = Number(process.env.IA_CHAT_DAILY_LIMIT || 60);

// Quantas mensagens de histórico (user + assistant) devem alimentar o contexto.
const historyTrim = Number(process.env.IA_CHAT_HISTORY_TRIM || 12);

/**
 * Prompt de sistema do assistente de estudo.
 *
 * O assistente age como um tutor: guia o estudante com explicações e
 * raciocínio passo a passo, em vez de entregar respostas prontas. O nome do
 * estudante e a disciplina (quando informada) são injetados para personalizar
 * a resposta e dar contexto ao modelo.
 */
function systemPrompt(studentName, disciplina) {
  let prompt =
    'Você é o PlanejAI Assistente, um tutor de estudo inteligente, amigável e paciente. ' +
    'Seu objetivo é ajudar estudantes a entender conceitos e a tirar dúvidas sobre disciplinas do ensino médio, vestibular e universidade, como Matemática, Física, Química, Biologia, História, Geografia, Português e Inglês.\n\n' +
    'Diretrizes:\n' +
    '- Explique de forma clara, didática e no nível de ensino apropriado.\n' +
    '- Prefira guiar o estudante com dicas e raciocínio passo a passo, em vez de entregar respostas prontas.\n' +
    '- Use exemplos numéricos e analogias simples quando úteis.\n' +
    '- Não corrija provas nem faça a tarefa do estudante; ensine o conceito por trás.\n' +
    '- Mantenha a resposta concisa, porém completa. Use formatação simples (itálico, listas).\n' +
    '- Não use markdown pesado, apenas **negrito** para destacar pontos e listas com "-" quando necessário.\n' +
    '- Caso a dúvida seja ampla demais, peça mais detalhes ou sugira focar em um aspecto.\n' +
    '- Se não souber algo ou a pergunta envolver informação em tempo real (clima, notícias), admita a limitação.\n' +
    '- Sempre responda em português.';

  if (studentName) {
    prompt += `\n\nNome do estudante que você está ajudando: ${studentName}.`;
  }
  if (disciplina) {
    prompt += `\n\nResponda dando foco à disciplina: ${disciplina}.`;
  }

  return prompt;
}

// Mensagens amigáveis exibidas ao usuário quando algo dá errado.
const mensagensUsuario = {
  noKey: 'IA temporariamente indisponível: a chave da API de IA não está configurada no servidor. Peça ao responsável por isso.',
  packageMissing: 'IA temporariamente indisponível: o pacote openai não está instalado no servidor.',
  dailyLimit: 'Você atingiu o limite diário de mensagens da IA. Volte amanhã para continuar com o assistente.',
  emptyMessage: 'Envie uma mensagem para que eu possa ajudar.',
  apiError: 'O assistente de IA está com dificuldades para responder agora. Tente novamente em instantes.',
};

module.exports = {
  model,
  baseUrl,
  maxTokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : MAX_TOKENS_DEFAULT,
  temperature: Number.isFinite(temperature) ? Math.max(0, Math.min(1, temperature)) : TEMPERATURE_DEFAULT,
  dailyLimit: Number.isFinite(dailyLimit) ? Math.max(0, dailyLimit) : 60,
  historyTrim: Number.isFinite(historyTrim) && historyTrim > 0 ? historyTrim : 12,
  systemPrompt,
  mensagensUsuario,
};
