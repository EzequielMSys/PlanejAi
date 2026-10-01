const pool = require('../config/db');

/**
 * Cria ou atualiza perfil de estudo para um usuário
 * Maps frontend fields to database columns
 */
async function criarOuAtualizarPerfil(usuarioId, perfil) {
  const {
    ano_escolar,
    objetivo,
    areas_foco,
    tempo_diario_min,
    prazo_estimado
  } = perfil;

  const [rows] = await pool.execute(
    'SELECT id_perfil FROM perfil_estudo WHERE id_usuario = ?',
    [usuarioId]
  );

  if (rows.length > 0) {
    const id_perfil = rows[0].id_perfil;
await pool.execute(
      `UPDATE perfil_estudo
       SET ano_escolar = ?, objetivo = ?, areas_foco = ?, tempo_diario_min = ?, prazo_estimado = ?
       WHERE id_perfil = ?`,
      [ano_escolar, objetivo, areas_foco, tempo_diario_min, prazo_estimado, id_perfil]
    );
    return { id_perfil, id_usuario: usuarioId, ...perfil };
  } else {
    const [result] = await pool.execute(
      `INSERT INTO perfil_estudo
       (id_usuario, ano_escolar, objetivo, areas_foco, tempo_diario_min, prazo_estimado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, ano_escolar, objetivo, areas_foco, tempo_diario_min, prazo_estimado]
    );
    return { id_perfil: result.insertId, id_usuario: usuarioId, ...perfil };
  }
}

/**
 * Obtém perfil de estudo por usuário ID
 */
async function obterPerfilPorUsuario(usuarioId) {
  const [rows] = await pool.execute(
    'SELECT * FROM perfil_estudo WHERE id_usuario = ?',
    [usuarioId]
  );
  return rows[0];
}

/**
 * Obtém perfil por ID de perfil
 */
async function obterPerfilPorId(idPerfil) {
  const [rows] = await pool.execute(
    'SELECT * FROM perfil_estudo WHERE id_perfil = ?',
    [idPerfil]
  );
  return rows[0];
}

module.exports = {
  criarOuAtualizarPerfil,
  obterPerfilPorUsuario,
  obterPerfilPorId
};
