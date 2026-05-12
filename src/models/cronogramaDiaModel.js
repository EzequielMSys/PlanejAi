const pool = require('../config/db')

async function criarDia(idCronograma, { data_estudo, tempo_previsto = null }) {
  const [result] = await pool.execute(
    `INSERT INTO cronograma_dias
      (id_cronograma, data_estudo, tempo_previsto)
     VALUES (?, ?, ?)`,
    [idCronograma, data_estudo, tempo_previsto]
  )

  return {
    id_dia: result.insertId,
    id_cronograma: idCronograma,
    data_estudo,
    tempo_previsto
  }
}

async function listarDiasPorCronograma(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM cronograma_dias
     WHERE id_cronograma = ?
     ORDER BY data_estudo ASC`,
    [idCronograma]
  )

  return rows
}

async function obterDiaPorId(idDia) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM cronograma_dias
     WHERE id_dia = ?`,
    [idDia]
  )

  return rows[0] || null
}

async function atualizarTempoPrevisto(idDia, tempoMinutos) {
  await pool.execute(
    `UPDATE cronograma_dias
     SET tempo_previsto = ?
     WHERE id_dia = ?`,
    [tempoMinutos, idDia]
  )

  return {
    id_dia: idDia,
    tempo_previsto: tempoMinutos
  }
}

async function marcarDiaConcluido(idDia) {
  await pool.execute(
    `UPDATE cronograma_dias
     SET concluido = 1
     WHERE id_dia = ?`,
    [idDia]
  )

  return {
    id_dia: idDia,
    concluido: true
  }
}

async function marcarDiaPendente(idDia) {
  await pool.execute(
    `UPDATE cronograma_dias
     SET concluido = 0
     WHERE id_dia = ?`,
    [idDia]
  )

  return {
    id_dia: idDia,
    concluido: false
  }
}

async function contarDiasConcluidos(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM cronograma_dias
     WHERE id_cronograma = ?
       AND concluido = 1`,
    [idCronograma]
  )

  return rows[0]?.total || 0
}

async function contarDias(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM cronograma_dias
     WHERE id_cronograma = ?`,
    [idCronograma]
  )

  return rows[0]?.total || 0
}

async function obterProximoDiaPendente(idCronograma) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM cronograma_dias
     WHERE id_cronograma = ?
       AND (concluido = 0 OR concluido IS NULL)
     ORDER BY data_estudo ASC
     LIMIT 1`,
    [idCronograma]
  )

  return rows[0] || null
}

async function deletarDia(idDia) {
  await pool.execute(
    `DELETE FROM cronograma_dias
     WHERE id_dia = ?`,
    [idDia]
  )
}

module.exports = {
  criarDia,
  listarDiasPorCronograma,
  obterDiaPorId,
  atualizarTempoPrevisto,
  marcarDiaConcluido,
  marcarDiaPendente,
  contarDiasConcluidos,
  contarDias,
  obterProximoDiaPendente,
  deletarDia
}