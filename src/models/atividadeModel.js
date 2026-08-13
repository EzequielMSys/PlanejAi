const pool = require('../config/db');

function parseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function normalizar(atividade) {
  return atividade && { ...atividade, anexos: parseJson(atividade.anexos, []), questoes: parseJson(atividade.questoes, []) };
}

async function criar({ titulo, descricao, prazo, status, anexos, questoes, criadoPor }) {
  const [result] = await pool.execute(
    `INSERT INTO atividades (titulo, descricao, criado_por, prazo, status, anexos, questoes, pergunta, tipo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descricao || null, criadoPor, prazo || null, status, JSON.stringify(anexos || []), JSON.stringify(questoes || []), titulo, 'DISSERTATIVA']
  );
  return buscarPorId(result.insertId);
}

async function listarPublicadas() {
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome, (SELECT COUNT(*) FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.status IN ('ENTREGUE','CORRIGIDA')) AS entregas
     FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por WHERE a.status = 'PUBLICADA'
     ORDER BY a.prazo IS NULL, a.prazo ASC, a.id_atividade DESC`
  );
  return rows.map(normalizar);
}

async function listarGestao() {
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome, (SELECT COUNT(*) FROM respostas_usuario r WHERE r.id_atividade = a.id_atividade AND r.status IN ('ENTREGUE','CORRIGIDA')) AS entregas
     FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por ORDER BY a.atualizado_em DESC`
  );
  return rows.map(normalizar);
}

async function buscarPorId(idAtividade) {
  const [rows] = await pool.execute('SELECT a.*, u.nome AS criador_nome FROM atividades a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por WHERE a.id_atividade = ?', [idAtividade]);
  return normalizar(rows[0]);
}

async function atualizar(idAtividade, { titulo, descricao, prazo, status, anexos, questoes }) {
  await pool.execute(
    `UPDATE atividades SET titulo = ?, descricao = ?, prazo = ?, status = ?, anexos = ?, questoes = ?, pergunta = ? WHERE id_atividade = ?`,
    [titulo, descricao || null, prazo || null, status, JSON.stringify(anexos || []), JSON.stringify(questoes || []), titulo, idAtividade]
  );
  return buscarPorId(idAtividade);
}

async function deletar(idAtividade) { await pool.execute('DELETE FROM atividades WHERE id_atividade = ?', [idAtividade]); }
module.exports = { criar, listarPublicadas, listarGestao, buscarPorId, atualizar, deletar };
