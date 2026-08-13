const pool = require('../config/db');
function parseResposta(row) { if (!row) return null; try { return { ...row, resposta: JSON.parse(row.resposta) }; } catch { return row; } }
async function registrarResposta(idUsuario, idAtividade, resposta, { correta = null, status = 'ENTREGUE', nota = null } = {}) {
  const [result] = await pool.execute(`INSERT INTO respostas_usuario (id_usuario, id_atividade, resposta, correta, status, nota) VALUES (?, ?, ?, ?, ?, ?)`, [idUsuario, idAtividade, JSON.stringify(resposta), correta, status, nota]);
  return obterPorId(result.insertId);
}
async function obterPorId(idResposta) { const [rows] = await pool.execute('SELECT * FROM respostas_usuario WHERE id_resposta = ?', [idResposta]); return parseResposta(rows[0]); }
async function obterPorAtividadeEUsuario(idAtividade, idUsuario) { const [rows] = await pool.execute('SELECT * FROM respostas_usuario WHERE id_atividade = ? AND id_usuario = ? ORDER BY respondido_em DESC LIMIT 1', [idAtividade, idUsuario]); return parseResposta(rows[0]); }
async function listarPorAtividade(idAtividade) { const [rows] = await pool.execute(`SELECT r.*, u.nome, u.email FROM respostas_usuario r JOIN usuarios u ON u.id_usuario = r.id_usuario WHERE r.id_atividade = ? ORDER BY r.respondido_em DESC`, [idAtividade]); return rows.map(parseResposta); }
async function corrigir(idResposta, { nota, feedback, corrigidoPor }) { await pool.execute(`UPDATE respostas_usuario SET nota = ?, feedback = ?, status = 'CORRIGIDA', corrigido_por = ?, corrigido_em = CURRENT_TIMESTAMP WHERE id_resposta = ?`, [nota, feedback || null, corrigidoPor, idResposta]); return obterPorId(idResposta); }
async function obterHistoricoPorUsuario(idUsuario) { const [rows] = await pool.execute(`SELECT r.*, a.titulo, a.pergunta, a.tipo FROM respostas_usuario r JOIN atividades a ON a.id_atividade = r.id_atividade WHERE r.id_usuario = ? ORDER BY r.respondido_em DESC`, [idUsuario]); return rows.map(parseResposta); }
module.exports = { registrarResposta, obterPorId, obterPorAtividadeEUsuario, listarPorAtividade, corrigir, obterHistoricoPorUsuario };
