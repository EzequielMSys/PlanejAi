const pool = require('../config/db')
const base = `FROM cronograma_conteudos cc JOIN cronograma_dias d ON d.id_dia=cc.id_dia
  JOIN cronogramas cr ON cr.id_cronograma=d.id_cronograma JOIN perfil_estudo p ON p.id_perfil=cr.id_perfil
  JOIN conteudos c ON c.id_conteudo=cc.id_conteudo`
async function current(idUsuario, db = pool) {
  const [rows] = await db.execute(`SELECT cc.id, cc.id_conteudo, cc.concluido, c.titulo, c.disciplina, c.area, c.link, c.tipo,
    d.id_dia, DATE_FORMAT(d.data_estudo, '%Y-%m-%d') AS data_estudo, d.tempo_previsto, e.atualizado_em ${base}
    JOIN estudo_em_andamento e ON e.id_item=cc.id AND e.id_usuario=p.id_usuario
    WHERE p.id_usuario=? AND cc.concluido=0 AND cr.status='ATIVO' AND d.data_estudo<=CURDATE()`, [idUsuario])
  if (!rows.length) return null
  const { id_dia, data_estudo, tempo_previsto, atualizado_em, ...conteudo } = rows[0]
  return { conteudo, dia: { id_dia, data_estudo: String(data_estudo).slice(0, 10), tempo_previsto }, atualizadoEm: atualizado_em }
}
async function save(idUsuario, idItem, db = pool) {
  if (!Number.isSafeInteger(Number(idItem)) || Number(idItem) <= 0) throw new Error('Conteúdo inválido.')
  // INSERT ... SELECT mantém a verificação de propriedade e a escrita na mesma operação.
  const [result] = await db.execute(`INSERT INTO estudo_em_andamento (id_usuario,id_item)
    SELECT p.id_usuario,cc.id ${base} WHERE p.id_usuario=? AND cc.id=? AND cc.concluido=0 AND cr.status='ATIVO' AND d.data_estudo<=CURDATE()
    ON DUPLICATE KEY UPDATE id_item=VALUES(id_item), atualizado_em=CURRENT_TIMESTAMP`, [idUsuario, Number(idItem)])
  if (!result.affectedRows) {
    const stored = await current(idUsuario, db)
    if (stored?.conteudo.id !== Number(idItem)) throw new Error('Este conteúdo não está disponível para sua conta.')
  }
  return { salvo: true }
}
async function clear(idUsuario, idItem, db = pool) {
  await db.execute('DELETE FROM estudo_em_andamento WHERE id_usuario=? AND id_item=?', [idUsuario, Number(idItem) || 0])
  return { removido: true }
}
module.exports = { current, save, clear }
