const pool = require('../config/db');
const { atualizarDominio, recomendarDificuldade, escolherProximaAcao, calcularSequenciaSemanal } = require('../utils/masteryEngine');

async function sincronizarCompetencias() {
  await pool.query(`INSERT IGNORE INTO competencias_estudo (disciplina, nome)
    SELECT DISTINCT disciplina, competencia FROM questoes_estudo
    WHERE ativo = 1 AND competencia IS NOT NULL AND competencia <> ''`);
}

async function listarCompetencias(idUsuario) {
  await sincronizarCompetencias();
  const [rows] = await pool.execute(`SELECT c.id_competencia, c.disciplina, c.nome, c.descricao,
      COALESCE(d.dominio, 0) AS dominio, COALESCE(d.confianca_media, 0) AS confianca_media,
      COALESCE(d.evidencias, 0) AS evidencias, d.proxima_pratica
    FROM competencias_estudo c LEFT JOIN dominio_competencias d
      ON d.id_competencia = c.id_competencia AND d.id_usuario = ?
    WHERE c.ativo = 1 ORDER BY dominio ASC, evidencias ASC, c.disciplina, c.nome`, [idUsuario]);
  return rows.map((row) => ({ ...row, dificuldadeRecomendada: recomendarDificuldade(row.dominio) }));
}

async function registrarEvidencia(idUsuario, questao, tentativa) {
  if (!questao.competencia) return null;
  await sincronizarCompetencias();
  const [[competencia]] = await pool.execute(
    'SELECT id_competencia FROM competencias_estudo WHERE disciplina = ? AND nome = ?',
    [questao.disciplina, questao.competencia]
  );
  const [[estado]] = await pool.execute(
    'SELECT * FROM dominio_competencias WHERE id_usuario = ? AND id_competencia = ?',
    [idUsuario, competencia.id_competencia]
  );
  const proximo = atualizarDominio(estado || {}, { ...tentativa, dificuldade: questao.dificuldade });
  await pool.execute(`INSERT INTO dominio_competencias
      (id_usuario, id_competencia, dominio, confianca_media, evidencias, acertos, ultima_pratica, proxima_pratica)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, DATE_ADD(CURRENT_DATE, INTERVAL ? DAY))
    ON DUPLICATE KEY UPDATE dominio = VALUES(dominio), confianca_media = VALUES(confianca_media),
      evidencias = VALUES(evidencias), acertos = VALUES(acertos), ultima_pratica = CURRENT_TIMESTAMP,
      proxima_pratica = VALUES(proxima_pratica)`,
    [idUsuario, competencia.id_competencia, proximo.dominio, proximo.confiancaMedia, proximo.evidencias, proximo.acertos, proximo.intervaloDias]
  );
  return proximo;
}

async function proximaAcao(idUsuario) {
  const [competencias, [[revisoes]], [[erros]], [[checkin]]] = await Promise.all([
    listarCompetencias(idUsuario),
    pool.execute('SELECT COUNT(*) AS total FROM revisoes_estudo WHERE id_usuario = ? AND proxima_revisao <= CURRENT_DATE', [idUsuario]),
    pool.execute('SELECT COUNT(*) AS total FROM caderno_erros WHERE id_usuario = ? AND resolvido = 0', [idUsuario]),
    pool.execute('SELECT * FROM checkins_estudo WHERE id_usuario = ? ORDER BY criado_em DESC LIMIT 1', [idUsuario])
  ]);
  return escolherProximaAcao({
    revisoes: Number(revisoes.total), erros: Number(erros.total), competencia: competencias[0],
    minutos: Number(checkin?.minutos_disponiveis || 25), energia: Number(checkin?.energia || 3)
  });
}

async function iniciarSessao(idUsuario, { idConteudo, idCompetencia, objetivo }) {
  if (!String(objetivo || '').trim()) throw new Error('Defina um objetivo para a sessão.');
  const [result] = await pool.execute(`INSERT INTO sessoes_guiadas
    (id_usuario, id_conteudo, id_competencia, objetivo) VALUES (?, ?, ?, ?)`,
    [idUsuario, Number(idConteudo) || null, Number(idCompetencia) || null, String(objetivo).trim().slice(0, 255)]);
  return { idSessao: result.insertId, objetivo, etapas: ['RECORDAR', 'ESTUDAR', 'PRATICAR', 'EXPLICAR', 'REVISAR'] };
}

async function concluirSessao(idUsuario, idSessao, { conhecimentoPrevio, resumoFinal, dificuldadePercebida }) {
  if (String(resumoFinal || '').trim().length < 20) throw new Error('Escreva um resumo final com pelo menos 20 caracteres.');
  const dificuldade = ['BAIXA', 'MEDIA', 'ALTA'].includes(dificuldadePercebida) ? dificuldadePercebida : 'MEDIA';
  const [result] = await pool.execute(`UPDATE sessoes_guiadas SET conhecimento_previo = ?, resumo_final = ?,
      dificuldade_percebida = ?, status = 'CONCLUIDA', concluida_em = CURRENT_TIMESTAMP
    WHERE id_sessao_guiada = ? AND id_usuario = ? AND status = 'INICIADA'`,
    [conhecimentoPrevio || null, resumoFinal.trim(), dificuldade, idSessao, idUsuario]);
  if (!result.affectedRows) throw new Error('Sessão não encontrada ou já concluída.');
  return { concluida: true };
}

async function salvarCheckin(idUsuario, dados) {
  const energia = Math.max(1, Math.min(5, Number(dados.energia) || 3));
  const minutos = Math.max(5, Math.min(360, Number(dados.minutosDisponiveis) || 25));
  const formato = ['LEITURA','VIDEO','EXERCICIOS','REVISAO'].includes(dados.formatoPreferido) ? dados.formatoPreferido : 'EXERCICIOS';
  await pool.execute(`INSERT INTO checkins_estudo (id_usuario, energia, minutos_disponiveis, formato_preferido, materia_evitada)
    VALUES (?, ?, ?, ?, ?)`, [idUsuario, energia, minutos, formato, dados.materiaEvitada || null]);
  return proximaAcao(idUsuario);
}

async function salvarRotina(idUsuario, { nome, configuracao, ativa }) {
  if (!String(nome || '').trim()) throw new Error('Nome da rotina é obrigatório.');
  if (ativa) await pool.execute('UPDATE rotinas_estudo SET ativa = 0 WHERE id_usuario = ?', [idUsuario]);
  await pool.execute(`INSERT INTO rotinas_estudo (id_usuario, nome, configuracao, ativa) VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE configuracao = VALUES(configuracao), ativa = VALUES(ativa)`,
    [idUsuario, nome.trim().slice(0, 100), JSON.stringify(configuracao || {}), ativa ? 1 : 0]);
  const [rows] = await pool.execute('SELECT * FROM rotinas_estudo WHERE id_usuario = ? ORDER BY ativa DESC, nome', [idUsuario]);
  return rows.map((row) => ({ ...row, configuracao: typeof row.configuracao === 'string' ? JSON.parse(row.configuracao) : row.configuracao }));
}

async function listarRotinas(idUsuario) { return salvarRotinaLista(idUsuario); }
async function salvarRotinaLista(idUsuario) {
  const [rows] = await pool.execute('SELECT * FROM rotinas_estudo WHERE id_usuario = ? ORDER BY ativa DESC, nome', [idUsuario]);
  return rows.map((row) => ({ ...row, configuracao: typeof row.configuracao === 'string' ? JSON.parse(row.configuracao) : row.configuracao }));
}

async function listarMissoes(idUsuario) {
  const [[resolvidos]] = await pool.execute(`SELECT COUNT(*) AS total FROM caderno_erros
    WHERE id_usuario = ? AND resolvido_em >= DATE_SUB(CURRENT_TIMESTAMP, INTERVAL 7 DAY)`, [idUsuario]);
  await pool.execute(`UPDATE missoes_estudo SET progresso = LEAST(alvo, ?),
    concluida_em = CASE WHEN ? >= alvo THEN COALESCE(concluida_em, CURRENT_TIMESTAMP) ELSE concluida_em END
    WHERE id_usuario = ? AND tipo = 'ERROS' AND expira_em > CURRENT_TIMESTAMP`,
    [Number(resolvidos.total), Number(resolvidos.total), idUsuario]);
  const [rows] = await pool.execute(`SELECT * FROM missoes_estudo WHERE id_usuario = ? AND expira_em > CURRENT_TIMESTAMP
    ORDER BY concluida_em IS NULL DESC, expira_em`, [idUsuario]);
  if (rows.length) return rows;
  const [[erros]] = await pool.execute('SELECT COUNT(*) AS total FROM caderno_erros WHERE id_usuario = ? AND resolvido = 0', [idUsuario]);
  const alvo = Math.max(1, Math.min(3, Number(erros.total) || 3));
  await pool.execute(`INSERT INTO missoes_estudo (id_usuario, tipo, titulo, alvo, expira_em)
    VALUES (?, 'ERROS', 'Explique e corrija erros antigos', ?, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 7 DAY))`, [idUsuario, alvo]);
  return listarMissoes(idUsuario);
}

async function obterSequencia(idUsuario) {
  const [rows] = await pool.execute('SELECT DISTINCT DATE(concluida_em) AS data FROM sessoes_estudo WHERE id_usuario = ? ORDER BY data DESC', [idUsuario]);
  return { semanas: calcularSequenciaSemanal(rows.map((row) => row.data)) };
}

async function obterPistas(idQuestao) {
  const [[q]] = await pool.execute('SELECT competencia, disciplina FROM questoes_estudo WHERE id_questao = ? AND ativo = 1', [idQuestao]);
  if (!q) return null;
  return [
    `Identifique os dados importantes e o que a questão pede em ${q.competencia || q.disciplina}.`,
    'Elimine alternativas que contradizem diretamente os dados do enunciado.',
    `Relacione o problema ao conceito central de ${q.competencia || q.disciplina} antes de calcular.`
  ];
}

async function criarFlashcardDoErro(idUsuario, questao) {
  const [existing] = await pool.execute('SELECT id_flashcard FROM flashcards_estudo WHERE id_usuario = ? AND frente = ? LIMIT 1', [idUsuario, questao.enunciado]);
  if (!existing[0]) await pool.execute(`INSERT INTO flashcards_estudo (id_usuario, frente, verso, disciplina, origem)
    VALUES (?, ?, ?, ?, 'ERRO')`, [idUsuario, questao.enunciado, questao.explicacao, questao.disciplina]);
}

module.exports = { listarCompetencias, registrarEvidencia, proximaAcao, iniciarSessao, concluirSessao, salvarCheckin, salvarRotina, listarRotinas, listarMissoes, obterSequencia, obterPistas, criarFlashcardDoErro };
