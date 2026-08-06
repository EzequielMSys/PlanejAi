const pool = require('../config/db');

/**
 * Cria uma nova redação
 */
async function criarRedacao(idUsuario, { tema, texto, notaEstimada = null, feedbackIa = null, errosTexto = null, sugestoes = null, flagIa = 0, competenciasEnem = null, repertorioSugerido = null, iaNivel = null, iaEvidencias = null, textoCorrigido = null }) {
  const [result] = await pool.execute(
    `INSERT INTO redacoes (id_usuario, tema, texto, nota_estimada, feedback_ia, erros_texto, sugestoes, flag_ia, competencias_enem, repertorio_sugerido, ia_nivel, ia_evidencias, texto_corrigido)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idUsuario,
      tema,
      texto,
      notaEstimada,
      feedbackIa,
      errosTexto ? JSON.stringify(errosTexto) : null,
      sugestoes ? JSON.stringify(sugestoes) : null,
      flagIa ? 1 : 0,
      competenciasEnem ? JSON.stringify(competenciasEnem) : null,
      repertorioSugerido ? JSON.stringify(repertorioSugerido) : null,
      iaNivel || null,
      iaEvidencias ? JSON.stringify(iaEvidencias) : null,
      textoCorrigido || null
    ]
  );
  return {
    id_redacao: result.insertId,
    id_usuario: idUsuario,
    tema,
    texto,
    nota_estimada: notaEstimada,
    feedback_ia: feedbackIa,
    erros_texto: errosTexto,
    sugestoes: sugestoes,
    flag_ia: flagIa,
    competencias_enem: competenciasEnem,
    repertorio_sugerido: repertorioSugerido,
    ia_nivel: iaNivel,
    ia_evidencias: iaEvidencias,
    texto_corrigido: textoCorrigido
  };
}

/**
 * Lista redações de um usuário
 */
async function listarPorUsuario(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT r.*, u.nome as autor_nome, u.apelido as autor_apelido
     FROM redacoes r
     LEFT JOIN usuarios u ON u.id_usuario = r.id_usuario
     WHERE r.id_usuario = ?
     ORDER BY r.enviada_em DESC`,
    [idUsuario]
  );

  return rows.map(deserializarRedacao);
}

/**
 * Lista todas as redações (para admin/dono)
 */
async function listarTodas() {
  const [rows] = await pool.execute(
    `SELECT r.*, u.nome as autor_nome, u.apelido as autor_apelido, u.email as autor_email
     FROM redacoes r
     LEFT JOIN usuarios u ON u.id_usuario = r.id_usuario
     ORDER BY r.enviada_em DESC`
  );

  return rows.map(deserializarRedacao);
}

/**
 * Obtém redação por ID
 */
async function obterRedacaoPorId(idRedacao) {
  const [rows] = await pool.execute(
    `SELECT r.*, u.nome as autor_nome, u.apelido as autor_apelido, u.email as autor_email
     FROM redacoes r
     LEFT JOIN usuarios u ON u.id_usuario = r.id_usuario
     WHERE r.id_redacao = ?`,
    [idRedacao]
  );

  return rows[0] ? deserializarRedacao(rows[0]) : null;
}

/**
 * Atualiza feedback e nota de uma redação (feedback IA)
 */
async function atualizarFeedback(idRedacao, notaEstimada, feedbackIa) {
  await pool.execute(
    `UPDATE redacoes
     SET nota_estimada = ?, feedback_ia = ?
     WHERE id_redacao = ?`,
    [notaEstimada, feedbackIa, idRedacao]
  );
  return { id_redacao: idRedacao, nota_estimada: notaEstimada, feedback_ia: feedbackIa };
}

/**
 * Atualiza a análise avançada (erros, sugestões, flag IA)
 */
async function atualizarAnalise(idRedacao, { errosTexto, sugestoes, flagIa }) {
  await pool.execute(
    `UPDATE redacoes
     SET erros_texto = ?, sugestoes = ?, flag_ia = ?
     WHERE id_redacao = ?`,
    [errosTexto ? JSON.stringify(errosTexto) : null, sugestoes ? JSON.stringify(sugestoes) : null, flagIa ? 1 : 0, idRedacao]
  );
  return { id_redacao: idRedacao, errosTexto, sugestoes, flagIa };
}

/**
 * Adiciona avaliação manual (admin/dono)
 */
async function avaliarRedacao(idRedacao, { notaManual, feedbackManual, avaliadoPor }) {
  await pool.execute(
    `UPDATE redacoes
     SET nota_manual = ?, feedback_manual = ?, avaliado_por = ?
     WHERE id_redacao = ?`,
    [notaManual, feedbackManual, avaliadoPor, idRedacao]
  );
  return { id_redacao: idRedacao, nota_manual: notaManual, feedback_manual: feedbackManual, avaliado_por: avaliadoPor };
}

/**
 * Deleta redação
 */
async function deletarRedacao(idRedacao) {
  await pool.execute(
    'DELETE FROM redacoes WHERE id_redacao = ?',
    [idRedacao]
  );
}

/**
 * Conta redações enviadas por um usuário
 */
async function contarRedacoesPorUsuario(idUsuario) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as total FROM redacoes WHERE id_usuario = ?',
    [idUsuario]
  );
  return rows[0]?.total || 0;
}

/**
 * Obtém média de notas de um usuário
 */
async function mediaNotasUsuario(idUsuario) {
  const [rows] = await pool.execute(
    'SELECT AVG(nota_estimada) as media FROM redacoes WHERE id_usuario = ? AND nota_estimada IS NOT NULL',
    [idUsuario]
  );
  return rows[0]?.media || 0;
}

/**
 * Deserializa campos JSON e normaliza nomes de colunas
 */
function deserializarRedacao(row) {
  let errosTexto = null;
  let sugestoes = null;
  let competenciasEnem = null;
  let repertorioSugerido = null;
  let iaEvidencias = null;

  try {
    errosTexto = row.erros_texto ? JSON.parse(row.erros_texto) : null;
  } catch (e) {
    errosTexto = row.erros_texto || null;
  }

  try {
    sugestoes = row.sugestoes ? JSON.parse(row.sugestoes) : null;
  } catch (e) {
    sugestoes = row.sugestoes || null;
  }

  try {
    competenciasEnem = row.competencias_enem ? JSON.parse(row.competencias_enem) : null;
  } catch (e) {
    competenciasEnem = row.competencias_enem || null;
  }

  try {
    repertorioSugerido = row.repertorio_sugerido ? JSON.parse(row.repertorio_sugerido) : null;
  } catch (e) {
    repertorioSugerido = row.repertorio_sugerido || null;
  }

  try {
    iaEvidencias = row.ia_evidencias ? JSON.parse(row.ia_evidencias) : null;
  } catch (e) {
    iaEvidencias = row.ia_evidencias || null;
  }

  return {
    ...row,
    erros_texto: errosTexto,
    sugestoes: sugestoes,
    competencias_enem: competenciasEnem,
    repertorio_sugerido: repertorioSugerido,
    ia_evidencias: iaEvidencias
  };
}

module.exports = {
  criarRedacao,
  listarPorUsuario,
  listarTodas,
  obterRedacaoPorId,
  atualizarFeedback,
  atualizarAnalise,
  avaliarRedacao,
  deletarRedacao,
  contarRedacoesPorUsuario,
  mediaNotasUsuario
};
