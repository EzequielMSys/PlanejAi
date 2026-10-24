const pool = require('../config/db');

// Literais SQL usam aspas simples, inclusive quando o servidor ativa ANSI_QUOTES.
const ORDEM_DIAS = "'DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'";

const mapaDias = {
  domingo: 'DOM',
  dom: 'DOM',
  segunda: 'SEG',
  seg: 'SEG',
  terca: 'TER',
  terça: 'TER',
  ter: 'TER',
  quarta: 'QUA',
  qua: 'QUA',
  quinta: 'QUI',
  qui: 'QUI',
  sexta: 'SEX',
  sex: 'SEX',
  sabado: 'SAB',
  sábado: 'SAB',
  sab: 'SAB'
};

function normalizarDia(dia) {
  if (!dia) return null;

  const diaTratado = String(dia).trim().toLowerCase();

  return mapaDias[diaTratado] || String(dia).trim().toUpperCase();
}

async function salvarDisponibilidade(usuarioId, dias) {
  if (!Array.isArray(dias) || dias.length > 7) throw new Error('Informe até sete dias da semana.');
  const normalized = dias.map(day => ({ ...day, dia_semana: normalizarDia(day.dia_semana), ocupado: Number(day.ocupado) === 1 ? 1 : 0 }));
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
  if (new Set(normalized.map(day => day.dia_semana)).size !== normalized.length || normalized.some(day =>
    !['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'].includes(day.dia_semana) ||
    (!day.ocupado && (!time.test(day.hora_inicio || '') || !time.test(day.hora_fim || '') || day.hora_inicio >= day.hora_fim)))) {
    throw new Error('Confira os dias e horários informados.');
  }
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const [[perfil]] = await db.execute('SELECT id_perfil FROM perfil_estudo WHERE id_usuario = ? FOR UPDATE', [usuarioId]);
    if (!perfil) throw new Error('Salve primeiro suas matérias de estudo.');
    await db.execute('DELETE FROM disponibilidade_semana WHERE id_perfil = ?', [perfil.id_perfil]);
    if (normalized.length) await db.query('INSERT INTO disponibilidade_semana (id_perfil, dia_semana, hora_inicio, hora_fim, ocupado) VALUES ?', [normalized.map(day => [perfil.id_perfil, day.dia_semana, day.hora_inicio || '08:00', day.hora_fim || '18:00', day.ocupado])]);
    await db.commit();
  } catch (error) { await db.rollback(); throw error; }
  finally { db.release(); }
}

async function obterDisponibilidade(idPerfilOrUsuario) {
  let [rows] = await pool.execute(
    `SELECT * 
     FROM disponibilidade_semana 
     WHERE id_perfil = ? 
     ORDER BY FIELD(dia_semana, ${ORDEM_DIAS})`,
    [idPerfilOrUsuario]
  );

  if (rows.length === 0) {
    [rows] = await pool.execute(
      `SELECT ds.* 
       FROM disponibilidade_semana ds
       JOIN perfil_estudo pe ON ds.id_perfil = pe.id_perfil
       WHERE pe.id_usuario = ?
       ORDER BY FIELD(ds.dia_semana, ${ORDEM_DIAS})`,
      [idPerfilOrUsuario]
    );
  }

  return rows;
}

async function obterDisponibilidadePorUsuario(usuarioId) {
  const [rows] = await pool.execute(
    `SELECT ds.* 
     FROM disponibilidade_semana ds
     JOIN perfil_estudo pe ON ds.id_perfil = pe.id_perfil
     WHERE pe.id_usuario = ?
     ORDER BY FIELD(ds.dia_semana, ${ORDEM_DIAS})`,
    [usuarioId]
  );

  return rows;
}

module.exports = {
  salvarDisponibilidade,
  obterDisponibilidade,
  obterDisponibilidadePorUsuario
};
