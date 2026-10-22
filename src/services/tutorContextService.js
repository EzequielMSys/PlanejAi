const pool = require('../config/db')

const texto = (value, limit = 300) => typeof value === 'string' ? value.trim().slice(0, limit) : ''

function competenciasRedacao(valor) {
  try {
    const itens = typeof valor === 'string' ? JSON.parse(valor) : valor
    return Array.isArray(itens) ? itens.filter((item) => Number.isInteger(Number(item.codigo)) && Number.isFinite(Number(item.nota)))
      .slice(0, 5).map((item) => ({ codigo: Number(item.codigo), nota: Number(item.nota), feedback: texto(item.feedback, 180) })) : []
  } catch { return [] }
}

function resumirPerfil(perfil) {
  if (!perfil) return null
  return {
    anoEscolar: texto(perfil.ano_escolar, 80),
    objetivo: texto(perfil.objetivo),
    areasFoco: texto(typeof perfil.areas_foco === 'object' ? JSON.stringify(perfil.areas_foco) : perfil.areas_foco),
    minutosDisponiveis: Math.max(0, Math.min(1440, Number(perfil.tempo_diario_min) || 0)),
  }
}

// Consulta somente dados pedagógicos da conta autenticada. Não inclui email,
// documentos, notas privadas, dados de colegas ou mensagens de outras contas.
async function carregarContexto(idUsuario, executar = pool.execute.bind(pool), opcoes = {}) {
  const consultas = [
    ['perfil', 'SELECT ano_escolar, objetivo, areas_foco, tempo_diario_min FROM perfil_estudo WHERE id_usuario = ? LIMIT 1'],
    ['licoes', `SELECT co.disciplina, co.titulo, cd.data_estudo, cc.concluido
      FROM cronograma_conteudos cc JOIN cronograma_dias cd ON cd.id_dia = cc.id_dia
      JOIN cronogramas cr ON cr.id_cronograma = cd.id_cronograma
      JOIN perfil_estudo pe ON pe.id_perfil = cr.id_perfil
      JOIN conteudos co ON co.id_conteudo = cc.id_conteudo
      WHERE pe.id_usuario = ? AND cr.status = 'ATIVO'
      ORDER BY cc.concluido ASC, cd.data_estudo ASC LIMIT 12`],
    ['cronograma', `SELECT COUNT(*) AS total, SUM(cc.concluido = 1) AS concluidas,
      SUM(cc.concluido = 0 AND cd.data_estudo < CURRENT_DATE()) AS atrasadas,
      SUM(cc.concluido = 0 AND cd.data_estudo = CURRENT_DATE()) AS hoje
      FROM cronograma_conteudos cc JOIN cronograma_dias cd ON cd.id_dia = cc.id_dia
      JOIN cronogramas cr ON cr.id_cronograma = cd.id_cronograma
      JOIN perfil_estudo pe ON pe.id_perfil = cr.id_perfil
      WHERE pe.id_usuario = ? AND cr.status = 'ATIVO'`],
    ['dificuldades', `SELECT q.disciplina, q.competencia, COUNT(*) AS erros
      FROM tentativas_questoes t JOIN questoes_estudo q ON q.id_questao = t.id_questao
      WHERE t.id_usuario = ? AND t.acertou = 0 AND t.criado_em >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY)
      GROUP BY q.disciplina, q.competencia ORDER BY erros DESC LIMIT 6`],
    ['revisoes', `SELECT co.disciplina, co.titulo, r.nivel_dominio, r.proxima_revisao
      FROM revisoes_estudo r JOIN conteudos co ON co.id_conteudo = r.id_conteudo
      WHERE r.id_usuario = ? AND r.proxima_revisao <= CURRENT_DATE()
      ORDER BY r.proxima_revisao LIMIT 6`],
    ['redacoes', 'SELECT tema, nota_estimada, competencias_enem, enviada_em FROM redacoes WHERE id_usuario = ? ORDER BY enviada_em DESC LIMIT 3'],
    ...(opcoes.idRedacao ? [['ultimaRedacao', 'SELECT tema, texto, feedback_ia FROM redacoes WHERE id_redacao = ? AND id_usuario = ? LIMIT 1', [opcoes.idRedacao, idUsuario]]] :
      opcoes.incluirTextoRedacao ? [['ultimaRedacao', 'SELECT tema, texto, feedback_ia FROM redacoes WHERE id_usuario = ? ORDER BY enviada_em DESC LIMIT 1']] : []),
  ]
  const resultados = await Promise.allSettled(consultas.map(async ([, sql, params]) => {
    const [rows] = await executar({ sql, timeout: 1200 }, params || [idUsuario])
    return rows
  }))
  const dados = Object.fromEntries(consultas.map(([nome], index) => [nome, resultados[index].status === 'fulfilled' ? resultados[index].value : []]))
  const perfil = resumirPerfil(dados.perfil[0])
  const licoes = dados.licoes.map((row) => ({ disciplina: texto(row.disciplina, 80), titulo: texto(row.titulo, 180), data: row.data_estudo, concluida: Boolean(row.concluido) }))
  const dificuldades = dados.dificuldades.map((row) => ({ disciplina: texto(row.disciplina, 80), competencia: texto(row.competencia, 160), erros: Number(row.erros) }))
  const revisoes = dados.revisoes.map((row) => ({ disciplina: texto(row.disciplina, 80), titulo: texto(row.titulo, 180), dominio: Number(row.nivel_dominio), data: row.proxima_revisao }))
  const redacoes = dados.redacoes.map((row) => ({ tema: texto(row.tema, 180), notaEstimada: row.nota_estimada == null ? null : Number(row.nota_estimada), competencias: competenciasRedacao(row.competencias_enem), data: row.enviada_em }))
  const andamento = dados.cronograma[0]
  const cronograma = andamento ? {
    total: Number(andamento.total) || 0,
    concluidas: Number(andamento.concluidas) || 0,
    atrasadas: Number(andamento.atrasadas) || 0,
    hoje: Number(andamento.hoje) || 0,
  } : null
  const ultimaRedacao = dados.ultimaRedacao?.[0]
  return {
    ...perfil, cronograma, licoes, dificuldades, revisoes, redacoes,
    ...(opcoes.idRedacao && !ultimaRedacao ? { redacaoSelecionadaIndisponivel: true } : {}),
    ...(ultimaRedacao ? { ultimaRedacao: {
      tema: texto(ultimaRedacao.tema, 180),
      texto: texto(ultimaRedacao.texto, 6000),
      feedback: texto(ultimaRedacao.feedback_ia, 1200),
    } } : {}),
  }
}

// Contexto é um aprimoramento: uma falha do perfil não bloqueia a conversa.
async function contextoDisponivel(idUsuario, carregar = carregarContexto, prazo = 1500, opcoes = {}) {
  let timer
  try {
    return await Promise.race([
      Promise.resolve().then(() => carregar(idUsuario, undefined, opcoes)).catch(() => null),
      new Promise((resolve) => { timer = setTimeout(() => resolve(null), prazo) }),
    ])
  } finally { clearTimeout(timer) }
}

module.exports = { contextoDisponivel, resumirPerfil, carregarContexto }
