const pool = require('../config/db');

async function criarAviso({ titulo, mensagem, criadoPor, destinatarios = 'todos' }) {
  const [result] = await pool.execute(
    `INSERT INTO avisos (titulo, mensagem, criado_por, destinatarios)
     VALUES (?, ?, ?, ?)`,
    [titulo, mensagem, criadoPor, destinatarios]
  );
  return obterPorId(result.insertId);
}

async function obterPorId(idAviso) {
  const [rows] = await pool.execute('SELECT * FROM avisos WHERE id_aviso = ?', [idAviso]);
  return rows[0] || null;
}

async function listarAvisos(limit = 50) {
  const [rows] = await pool.execute(
    `SELECT a.*, u.nome AS criador_nome FROM avisos a LEFT JOIN usuarios u ON u.id_usuario = a.criado_por ORDER BY a.criado_em DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function deletarAviso(idAviso) {
  await pool.execute('DELETE FROM avisos WHERE id_aviso = ?', [idAviso]);
}

module.exports = {
  criarAviso,
  obterPorId,
  listarAvisos,
  deletarAviso
};