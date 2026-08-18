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

module.exports = { replanejarAtrasados };

