const pool = require('../config/db')

async function criarCronograma(idPerfil, { data_inicio, data_fim, status = 'ATIVO' }) {
  const [result] = await pool.execute(
    `INSERT INTO cronogramas (id_perfil, data_inicio, data_fim, status)
     VALUES (?, ?, ?, ?)`,
    [idPerfil, data_inicio, data_fim, status.toUpperCase()]
  )

  return {
    id_cronograma: result.insertId,
    id_perfil: idPerfil,
    data_inicio,
    data_fim,
    status
  }
}

async function listarCronogramasPorPerfil(idPerfil) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM cronogramas
     WHERE id_perfil = ?
     ORDER BY
       CASE WHEN status = 'ATIVO' THEN 0 ELSE 1 END,
       criado_em DESC`,
    [idPerfil]
  )

  return rows
}

async function obterCronogramaPorId(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM cronogramas
     WHERE id_cronograma = ?`,
    [idCronograma]
  )

  return rows[0] || null
}

async function obterCronogramaAtivoPorPerfil(idPerfil) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM cronogramas
     WHERE id_perfil = ?
       AND status = 'ATIVO'
     ORDER BY criado_em DESC
     LIMIT 1`,
    [idPerfil]
  )

  return rows[0] || null
}

async function desativarCronogramasAtivos(idPerfil) {
  await pool.execute(
    `UPDATE cronogramas
     SET status = 'CANCELADO'
     WHERE id_perfil = ?
       AND status = 'ATIVO'`,
    [idPerfil]
  )
}

async function atualizarStatusCronograma(idCronograma, status) {
  await pool.execute(
    `UPDATE cronogramas
     SET status = ?
     WHERE id_cronograma = ?`,
    [status, idCronograma]
  )

  return {
    id_cronograma: idCronograma,
    status
  }
}

async function deletarCronograma(idCronograma) {
  await pool.execute(
    `DELETE FROM cronogramas
     WHERE id_cronograma = ?`,
    [idCronograma]
  )
}

async function obterCronogramaCompleto(idCronograma) {
  const cronograma = await obterCronogramaPorId(idCronograma)

  if (!cronograma) {
    return null
  }

  const [dias] = await pool.execute(
    `SELECT *
     FROM cronograma_dias
     WHERE id_cronograma = ?
     ORDER BY data_estudo ASC`,
    [idCronograma]
  )

  for (const dia of dias) {
    const [conteudos] = await pool.execute(
      `SELECT
        cc.id,
        cc.id_dia,
        cc.id_conteudo,
        cc.concluido,
        c.area,
        c.disciplina,
        c.titulo,
        c.tipo,
        c.link,
        c.materiais,
        c.nivel
       FROM cronograma_conteudos cc
       LEFT JOIN conteudos c
         ON c.id_conteudo = cc.id_conteudo
       WHERE cc.id_dia = ?
       ORDER BY cc.id ASC`,
      [dia.id_dia]
    )

    dia.conteudos = conteudos
  }

  cronograma.dias = dias

  return cronograma
}

async function obterCronogramaAtivoCompletoPorPerfil(idPerfil) {
  const cronograma = await obterCronogramaAtivoPorPerfil(idPerfil)

  if (!cronograma) {
    return null
  }

  return obterCronogramaCompleto(cronograma.id_cronograma)
}

module.exports = {
  criarCronograma,
  listarCronogramasPorPerfil,
  obterCronogramaPorId,
  obterCronogramaAtivoPorPerfil,
  obterCronogramaAtivoCompletoPorPerfil,
  desativarCronogramasAtivos,
  atualizarStatusCronograma,
  deletarCronograma,
  obterCronogramaCompleto
}
