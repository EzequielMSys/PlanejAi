const pool = require('../config/db');

async function replanejarAtrasados(idUsuario) {
  const [dias] = await pool.execute(
    `SELECT cd.id_dia, cd.data_estudo
     FROM cronograma_dias cd
     JOIN cronogramas c ON c.id_cronograma = cd.id_cronograma
     JOIN perfil_estudo p ON p.id_perfil = c.id_perfil
     WHERE p.id_usuario = ? AND c.status = 'ATIVO' AND cd.data_estudo < CURRENT_DATE
       AND EXISTS (SELECT 1 FROM cronograma_conteudos cc WHERE cc.id_dia = cd.id_dia AND cc.concluido = 0)
     ORDER BY cd.data_estudo ASC`, [idUsuario]
  );
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (let i = 0; i < dias.length; i += 1) {
      await connection.execute('UPDATE cronograma_dias SET data_estudo = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY) WHERE id_dia = ?', [i + 1, dias[i].id_dia]);
    }
    await connection.commit();
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
  return { reagendados: dias.length };
}

async function analisarAtrasos(idUsuario) {
  const [[dados]] = await pool.execute(
    `SELECT COUNT(DISTINCT cd.id_dia) AS dias_atrasados, COUNT(cc.id) AS conteudos_pendentes
     FROM cronograma_dias cd JOIN cronogramas c ON c.id_cronograma = cd.id_cronograma
     JOIN perfil_estudo p ON p.id_perfil = c.id_perfil JOIN cronograma_conteudos cc ON cc.id_dia = cd.id_dia
     WHERE p.id_usuario = ? AND c.status = 'ATIVO' AND cd.data_estudo < CURRENT_DATE AND cc.concluido = 0`, [idUsuario]
  )
  const dias = Number(dados.dias_atrasados || 0); const conteudos = Number(dados.conteudos_pendentes || 0)
  return { dias_atrasados: dias, conteudos_pendentes: conteudos, opcoes: [
    { id: 'MANTER', titulo: 'Manter ritmo', impacto: 'Preserva o plano atual; pendências continuarão visíveis.' },
    { id: 'REDISTRIBUIR', titulo: 'Redistribuir', impacto: `Move ${dias} dia(s) atrasado(s) para os próximos dias.` },
    { id: 'REDUZIR', titulo: 'Reduzir carga', impacto: 'Redistribui pendências e reduz o tempo previsto por dia para tornar a retomada viável.' }
  ] }
}

module.exports = { replanejarAtrasados, analisarAtrasos };
