const pool = require('../config/db')

async function atribuirConteudoAoDia(idDia, idConteudo = null) {
  const [result] = await pool.execute(
    `INSERT INTO cronograma_conteudos
      (id_dia, id_conteudo, concluido)
     VALUES (?, ?, 0)`,
    [idDia, idConteudo]
  )

  return {
    id: result.insertId,
    id_dia: idDia,
    id_conteudo: idConteudo,
    concluido: 0
  }
}

async function listarConteudosPorDia(idDia) {
  const [rows] = await pool.execute(
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
      c.nivel
     FROM cronograma_conteudos cc
     LEFT JOIN conteudos c
       ON c.id_conteudo = cc.id_conteudo
     WHERE cc.id_dia = ?
     ORDER BY cc.id ASC`,
    [idDia]
  )

  return rows
}

async function listarConteudosPorCronograma(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT
      cc.id,
      cc.id_dia,
      cc.id_conteudo,
      cc.concluido,
      cd.data_estudo,
      cd.tempo_previsto,
      c.area,
      c.disciplina,
      c.titulo,
      c.tipo,
      c.link,
      c.nivel
     FROM cronograma_conteudos cc
     INNER JOIN cronograma_dias cd
       ON cd.id_dia = cc.id_dia
     LEFT JOIN conteudos c
       ON c.id_conteudo = cc.id_conteudo
     WHERE cd.id_cronograma = ?
     ORDER BY cd.data_estudo ASC, cc.id ASC`,
    [idCronograma]
  )

  return rows
}

async function obterConteudoCronogramaPorId(idConteudoCronograma) {
  const [rows] = await pool.execute(
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
      c.nivel
     FROM cronograma_conteudos cc
     LEFT JOIN conteudos c
       ON c.id_conteudo = cc.id_conteudo
     WHERE cc.id = ?`,
    [idConteudoCronograma]
  )

  return rows[0] || null
}

async function marcarConcluido(idConteudoCronograma) {
  await pool.execute(
    `UPDATE cronograma_conteudos
     SET concluido = 1
     WHERE id = ?`,
    [idConteudoCronograma]
  )

  return {
    id: idConteudoCronograma,
    concluido: 1
  }
}

async function marcarNaoConcluido(idConteudoCronograma) {
  await pool.execute(
    `UPDATE cronograma_conteudos
     SET concluido = 0
     WHERE id = ?`,
    [idConteudoCronograma]
  )

  return {
    id: idConteudoCronograma,
    concluido: 0
  }
}

async function marcarTodosConcluidos(idDia) {
  await pool.execute(
    `UPDATE cronograma_conteudos
     SET concluido = 1
     WHERE id_dia = ?`,
    [idDia]
  )

  return {
    id_dia: idDia,
    concluido: 1
  }
}

async function marcarTodosPendentes(idDia) {
  await pool.execute(
    `UPDATE cronograma_conteudos
     SET concluido = 0
     WHERE id_dia = ?`,
    [idDia]
  )

  return {
    id_dia: idDia,
    concluido: 0
  }
}

async function contarConteudosPorDia(idDia) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM cronograma_conteudos
     WHERE id_dia = ?`,
    [idDia]
  )

  return rows[0]?.total || 0
}

async function contarConteudosConcluidosPorDia(idDia) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM cronograma_conteudos
     WHERE id_dia = ?
       AND concluido = 1`,
    [idDia]
  )

  return rows[0]?.total || 0
}

async function contarConteudosPorCronograma(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM cronograma_conteudos cc
     INNER JOIN cronograma_dias cd
       ON cd.id_dia = cc.id_dia
     WHERE cd.id_cronograma = ?`,
    [idCronograma]
  )

  return rows[0]?.total || 0
}

async function contarConteudosConcluidosPorCronograma(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM cronograma_conteudos cc
     INNER JOIN cronograma_dias cd
       ON cd.id_dia = cc.id_dia
     WHERE cd.id_cronograma = ?
       AND cc.concluido = 1`,
    [idCronograma]
  )

  return rows[0]?.total || 0
}

async function removerConteudo(idConteudoCronograma) {
  await pool.execute(
    `DELETE FROM cronograma_conteudos
     WHERE id = ?`,
    [idConteudoCronograma]
  )
}

async function removerConteudosDia(idDia) {
  await pool.execute(
    `DELETE FROM cronograma_conteudos
     WHERE id_dia = ?`,
    [idDia]
  )
}

module.exports = {
  atribuirConteudoAoDia,
  listarConteudosPorDia,
  listarConteudosPorCronograma,
  obterConteudoCronogramaPorId,
  marcarConcluido,
  marcarNaoConcluido,
  marcarTodosConcluidos,
  marcarTodosPendentes,
  contarConteudosPorDia,
  contarConteudosConcluidosPorDia,
  contarConteudosPorCronograma,
  contarConteudosConcluidosPorCronograma,
  removerConteudo,
  removerConteudosDia
}