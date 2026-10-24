const pool = require('../config/db')

async function criarCronograma(idPerfil, { data_inicio, data_fim, status = 'ATIVO' }, db = pool) {
  const [result] = await db.execute(
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

async function desativarCronogramasAtivos(idPerfil, db = pool) {
  await db.execute(
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

  if (dias.length) {
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
       JOIN cronograma_dias d ON d.id_dia = cc.id_dia
       LEFT JOIN conteudos c
         ON c.id_conteudo = cc.id_conteudo
       WHERE d.id_cronograma = ?
       ORDER BY cc.id ASC`,
      [idCronograma]
    )

    const porDia = new Map(dias.map(dia => [Number(dia.id_dia), []]))
    for (const conteudo of conteudos) porDia.get(Number(conteudo.id_dia))?.push(conteudo)
    for (const dia of dias) dia.conteudos = porDia.get(Number(dia.id_dia))
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
