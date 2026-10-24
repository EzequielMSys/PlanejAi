const pool = require('../config/db');
async function postpone(owner, id, days, db = pool) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0 || ![1, 3, 7].includes(days)) {
    throw Object.assign(new Error('Escolha amanhã, em 3 dias ou em 7 dias.'), { status: 400 });
  }
  const [result] = await db.execute(
    'UPDATE revisoes_estudo SET proxima_revisao = DATE_ADD(CURRENT_DATE, INTERVAL ? DAY) WHERE id_revisao = ? AND id_usuario = ? AND proxima_revisao <= CURRENT_DATE',
    [days, Number(id), owner]
  );
  if (!result.affectedRows) throw Object.assign(new Error('Esta revisão não está mais na sua fila de hoje. Atualize a lista.'), { status: 404 });
  return { message: 'Revisão reagendada. Seu domínio e suas respostas foram preservados.', days };
}
module.exports = { postpone };
