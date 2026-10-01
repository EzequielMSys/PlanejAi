const pool = require('../config/db')

function parseJson(value, fallback = null) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object' && !Buffer.isBuffer(value)) return value
  try { return JSON.parse(Buffer.isBuffer(value) ? value.toString('utf8') : value) } catch { return fallback }
}

function parseResposta(row) {
  return row && { ...row, resposta: parseJson(row.resposta, {}), correcao_detalhes: parseJson(row.correcao_detalhes, []) }
}

async function registrarResposta(idUsuario, idAtividade, resposta, { correta = null, status = 'ENTREGUE', nota = null, detalhes = [] } = {}) {
  const [[rascunho]] = await pool.execute(`SELECT id_resposta FROM respostas_usuario WHERE id_usuario=? AND id_atividade=? AND status='RASCUNHO' ORDER BY respondido_em DESC LIMIT 1`, [idUsuario, idAtividade])
  if (rascunho) {
    await pool.execute(`UPDATE respostas_usuario SET resposta=?,correta=?,status=?,nota=?,correcao_detalhes=?,respondido_em=CURRENT_TIMESTAMP WHERE id_resposta=?`, [JSON.stringify(resposta), correta, status, nota, JSON.stringify(detalhes), rascunho.id_resposta])
    return obterPorId(rascunho.id_resposta)
  }
  const [result] = await pool.execute(`INSERT INTO respostas_usuario (id_usuario,id_atividade,resposta,correta,status,nota,correcao_detalhes) VALUES (?,?,?,?,?,?,?)`, [idUsuario, idAtividade, JSON.stringify(resposta), correta, status, nota, JSON.stringify(detalhes)])
  return obterPorId(result.insertId)
}

async function salvarRascunho(idUsuario, idAtividade, resposta) {
  const [[existente]] = await pool.execute(`SELECT id_resposta FROM respostas_usuario WHERE id_usuario=? AND id_atividade=? AND status='RASCUNHO' ORDER BY respondido_em DESC LIMIT 1`, [idUsuario, idAtividade])
  if (existente) {
    await pool.execute('UPDATE respostas_usuario SET resposta=?,rascunho_salvo_em=CURRENT_TIMESTAMP WHERE id_resposta=?', [JSON.stringify(resposta || {}), existente.id_resposta])
    return obterPorId(existente.id_resposta)
  }
  const [result] = await pool.execute(`INSERT INTO respostas_usuario (id_usuario,id_atividade,resposta,correta,status,rascunho_salvo_em) VALUES (?,?,?,NULL,'RASCUNHO',CURRENT_TIMESTAMP)`, [idUsuario, idAtividade, JSON.stringify(resposta || {})])
  return obterPorId(result.insertId)
}

async function obterPorId(idResposta) {
  const [rows] = await pool.execute('SELECT * FROM respostas_usuario WHERE id_resposta = ?', [idResposta])
  return parseResposta(rows[0])
}

async function obterPorAtividadeEUsuario(idAtividade, idUsuario) {
  const [rows] = await pool.execute(`SELECT * FROM respostas_usuario WHERE id_atividade=? AND id_usuario=? ORDER BY respondido_em DESC,id_resposta DESC LIMIT 1`, [idAtividade, idUsuario])
  return parseResposta(rows[0])
}

async function listarPorAtividade(idAtividade) {
  const [rows] = await pool.execute(`SELECT r.*,u.nome,u.email FROM respostas_usuario r JOIN usuarios u ON u.id_usuario=r.id_usuario WHERE r.id_atividade=? AND r.status IN ('ENTREGUE','CORRIGIDA') ORDER BY r.respondido_em DESC`, [idAtividade])
  return rows.map(parseResposta)
}

async function corrigir(idResposta, { nota, feedback, corrigidoPor, detalhes = [] }) {
  await pool.execute(`UPDATE respostas_usuario SET nota=?,feedback=?,correcao_detalhes=?,status='CORRIGIDA',corrigido_por=?,corrigido_em=CURRENT_TIMESTAMP WHERE id_resposta=?`, [nota, feedback || null, JSON.stringify(detalhes), corrigidoPor, idResposta])
  return obterPorId(idResposta)
}

async function obterHistoricoPorUsuario(idUsuario) {
  const [rows] = await pool.execute(`SELECT r.*,a.titulo,a.pergunta,a.tipo FROM respostas_usuario r JOIN atividades a ON a.id_atividade=r.id_atividade WHERE r.id_usuario=? ORDER BY r.respondido_em DESC`, [idUsuario])
  return rows.map(parseResposta)
}

module.exports = { registrarResposta, salvarRascunho, obterPorId, obterPorAtividadeEUsuario, listarPorAtividade, corrigir, obterHistoricoPorUsuario }
