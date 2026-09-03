const pool = require('../config/db');

function parseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizar(atividade) {
  return atividade && { ...atividade, anexos: parseJson(atividade.anexos, []), questoes: parseJson(atividade.questoes, []) };
}

async function criar({ titulo, descricao, prazo, status, anexos, questoes, criadoPor, destinatarios, atribuicao }) {
  const [result] = await pool.execute(
    `INSERT INTO atividades (titulo, descricao, criado_por, prazo, status, anexos, questoes, pergunta, tipo, destinatarios, atribuicao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descricao || null, criadoPor, prazo || null, status, JSON.stringify(anexos || []), JSON.stringify(questoes || []), titulo, 'DISSERTATIVA', destinatarios ? JSON.stringify(destinatarios) : null, atribuicao || 'TODOS']
  );
  return buscarPorId(result.insertId);
}

async function listarPublicadas(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome,
       (SELECT COUNT(*) FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.status IN ('ENTREGUE','CORRIGIDA')) AS entregas,
       (SELECT r.status FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.id_usuario = ? ORDER BY r.respondido_em DESC LIMIT 1) AS minha_resposta_status,
       (SELECT r.nota FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.id_usuario = ? ORDER BY r.respondido_em DESC LIMIT 1) AS minha_nota
     FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por WHERE a.status = 'PUBLICADA'
     ORDER BY a.prazo IS NULL, a.prazo ASC, a.id_atividade DESC`,
    [idUsuario, idUsuario]
  );
  return rows.map(normalizar);
}

async function listarGestao(criadoPor = null) {
  const filtro = criadoPor ? ' WHERE a.criado_por = ?' : '';
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome, (SELECT COUNT(*) FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.status IN ('ENTREGUE','CORRIGIDA')) AS entregas
     FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por${filtro} ORDER BY a.atualizado_em DESC`,
    criadoPor ? [criadoPor] : []
  );
  return rows.map(normalizar);
}

async function buscarPorId(idAtividade) {
  const [rows] = await pool.execute('SELECT a.*, u.nome AS criador_nome FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por WHERE a.id_atividade = ?', [idAtividade]);
  return normalizar(rows[0]);
}

async function atualizar(idAtividade, { titulo, descricao, prazo, status, anexos, questoes, destinatarios, atribuicao }) {
  await pool.execute(
    `UPDATE atividades SET titulo = ?, descricao = ?, prazo = ?, status = ?, anexos = ?, questoes = ?, pergunta = ?, destinatarios = ?, atribuicao = ? WHERE id_atividade = ?`,
    [titulo, descricao || null, prazo || null, status, JSON.stringify(anexos || []), JSON.stringify(questoes || []), titulo, destinatarios ? JSON.stringify(destinatarios) : null, atribuicao || 'TODOS', idAtividade]
  );
  return buscarPorId(idAtividade);
}

async function deletar(idAtividade) { await pool.execute('DELETE FROM atividades WHERE id_atividade = ?', [idAtividade]); }
module.exports = { criar, listarPublicadas, listarGestao, buscarPorId, atualizar, deletar };
