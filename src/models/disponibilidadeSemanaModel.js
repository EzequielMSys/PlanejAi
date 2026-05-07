const pool = require('../config/db');
const perfilModel = require('./perfilEstudoModel');

const ORDEM_DIAS = '"DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"';

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

async function resolverIdPerfil(idPerfilOrUsuarioId) {
  const perfil = await perfilModel.obterPerfilPorUsuario(idPerfilOrUsuarioId);

  if (perfil) {
    return perfil.id_perfil;
  }

  return idPerfilOrUsuarioId;
}

async function salvarDisponibilidade(idPerfilOrUsuarioId, dias) {
  const idPerfil = await resolverIdPerfil(idPerfilOrUsuarioId);

  await pool.execute(
    'DELETE FROM disponibilidade_semana WHERE id_perfil = ?',
    [idPerfil]
  );

  if (!dias || dias.length === 0) {
    return;
  }

  const values = dias
    .map((d) => [
      idPerfil,
      normalizarDia(d.dia_semana),
      d.hora_inicio || '08:00:00',
      d.hora_fim || '18:00:00',
      d.ocupado ? 1 : 0
    ])
    .filter((d) => d[1]);

  if (values.length > 0) {
    await pool.query(
      `INSERT INTO disponibilidade_semana 
        (id_perfil, dia_semana, hora_inicio, hora_fim, ocupado) 
       VALUES ?`,
      [values]
    );
  }
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