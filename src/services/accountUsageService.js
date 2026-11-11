const pool = require('../config/db')
const { readFile } = require('node:fs/promises')
const path = require('node:path')

const SAMPLE_SECONDS = 15
const localDay = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' })
const schemaUpdates = new WeakMap()

async function executeUsage(db, sql, params) {
  try {
    return await db.execute(sql, params)
  } catch (error) {
    if (error.code !== 'ER_NO_SUCH_TABLE') throw error
  }

  if (!schemaUpdates.has(db)) {
    const update = readFile(path.join(__dirname, '../../migrations/account_usage_v91.sql'), 'utf8')
      .then(migration => db.query(migration))
      .finally(() => schemaUpdates.delete(db))
    schemaUpdates.set(db, update)
  }
  await schemaUpdates.get(db)
  return db.execute(sql, params)
}

async function record(id, now = new Date(), db = pool) {
  const slot = Math.floor(now.getTime() / (SAMPLE_SECONDS * 1000))
  await executeUsage(db,
    `INSERT INTO uso_diario_conta (id_usuario, dia, segundos, ultimo_intervalo)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       segundos = segundos + IF(ultimo_intervalo < ?, ?, 0),
       ultimo_intervalo = GREATEST(ultimo_intervalo, ?)`,
    [id, localDay.format(now), SAMPLE_SECONDS, slot, slot, SAMPLE_SECONDS, slot]
  )
}

const deliveries = `
  SELECT id_atividade, MIN(respondido_em) AS entregue_em
  FROM respostas_usuario
  WHERE id_usuario = ? AND status IN ('ENTREGUE', 'CORRIGIDA')
  GROUP BY id_atividade`

function pendingActivityFor(userId) {
  return `a.status = 'PUBLICADA' AND (a.publicar_em IS NULL OR a.publicar_em <= CURRENT_TIMESTAMP)
    AND (a.atribuicao IS NULL OR a.atribuicao = 'TODOS'
      OR JSON_CONTAINS(a.destinatarios, JSON_QUOTE(CAST(${userId} AS CHAR)))
      OR JSON_CONTAINS(a.destinatarios, CAST(${userId} AS CHAR)))
    AND (a.id_turma IS NULL OR EXISTS (
      SELECT 1 FROM turma_alunos ta JOIN turmas t ON t.id_turma = ta.id_turma
      WHERE ta.id_turma = a.id_turma AND ta.id_aluno = ${userId} AND ta.ativo = 1 AND t.ativa = 1
    ))
    AND NOT EXISTS (
      SELECT 1 FROM respostas_usuario r
      WHERE r.id_usuario = ${userId} AND r.id_atividade = a.id_atividade AND r.status IN ('ENTREGUE', 'CORRIGIDA')
    )`
}

function recentUsageStart(now = new Date()) {
  return new Date(Date.parse(localDay.format(now)) - 6 * 86400000).toISOString().slice(0, 10)
}

function lastMonths(now) {
  const [year, month] = localDay.format(now).split('-').map(Number)
  return Array.from({ length: 12 }, (_, index) =>
    new Date(Date.UTC(year, month - 12 + index, 1)).toISOString().slice(0, 7))
}

async function report(id, requester, now = new Date(), db = pool) {
  const [[account]] = await db.execute('SELECT tipo FROM usuarios WHERE id_usuario = ?', [id])
  if (!account || (requester !== 'dono' && account.tipo !== 'aluno')) return null
  const months = lastMonths(now)
  const today = localDay.format(now)
  const monthStart = today.slice(0, 7) + '-01'
  const tomorrow = new Date(Date.parse(today) + 86400000).toISOString().slice(0, 10)
  const from = months[0] + '-01'
  const [year, month] = months.at(-1).split('-').map(Number)
  const to = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10)
  const [totals, usage, completed, pending, dailyUsage, dailyDeliveries] = await Promise.all([
    executeUsage(db, `SELECT SUM(segundos) AS total, DATE_FORMAT(MIN(dia), '%Y-%m-%d') AS inicio, MAX(ultimo_intervalo) AS ultimo_intervalo,
      (SELECT DATE_FORMAT(MIN(dia), '%Y-%m-%d') FROM uso_diario_conta) AS medicao_desde
      FROM uso_diario_conta WHERE id_usuario = ?`, [id]),
    executeUsage(db, "SELECT DATE_FORMAT(dia, '%Y-%m') AS mes, SUM(segundos) AS segundos FROM uso_diario_conta WHERE id_usuario = ? AND dia >= ? AND dia < ? GROUP BY mes", [id, from, to]),
    db.execute(`SELECT d.id_atividade, a.titulo, DATE_FORMAT(d.entregue_em, '%Y-%m-%d') AS data,
       COUNT(*) OVER () AS total
       FROM (${deliveries}) d JOIN atividades a ON a.id_atividade = d.id_atividade
       ORDER BY d.entregue_em DESC, d.id_atividade DESC LIMIT 20`, [id]),
    account.tipo === 'aluno' ? db.execute(`
      SELECT a.id_atividade, a.titulo, DATE_FORMAT(a.prazo, '%Y-%m-%d') AS data, COUNT(*) OVER () AS total,
        SUM(CASE WHEN a.prazo < CURRENT_TIMESTAMP THEN 1 ELSE 0 END) OVER () AS atrasadas,
        IF(a.prazo < CURRENT_TIMESTAMP, 1, 0) AS atrasada
      FROM atividades a
      WHERE ${pendingActivityFor('?')}
      ORDER BY a.prazo IS NULL, a.prazo, a.id_atividade DESC LIMIT 20`, [id, id, id, id]) : Promise.resolve([[]]),
    executeUsage(db, "SELECT DATE_FORMAT(dia, '%Y-%m-%d') AS dia, segundos FROM uso_diario_conta WHERE id_usuario = ? AND dia >= ? AND dia < ?", [id, from, tomorrow]),
    db.execute(`SELECT DATE_FORMAT(entregue_em, '%Y-%m-%d') AS dia, COUNT(*) AS entregues
      FROM (${deliveries}) d WHERE entregue_em >= ? AND entregue_em < ? GROUP BY dia`, [id, from, tomorrow])
  ])
  const [monthlyDeliveries] = await db.execute(`
    SELECT DATE_FORMAT(entregue_em, '%Y-%m') AS mes, COUNT(*) AS entregues
    FROM (${deliveries}) d WHERE entregue_em >= ? AND entregue_em < ? GROUP BY mes`, [id, from, to])
  const [{ total, inicio, medicao_desde, ultimo_intervalo }] = totals[0]
  const summarize = rows => ({
    total: Number(rows[0]?.total || 0),
    atrasadas: Number(rows[0]?.atrasadas || 0),
    itens: rows.map(({ id_atividade, titulo, data, atrasada }) => ({ id_atividade, titulo, data, atrasada: Boolean(atrasada) }))
  })
  const usageByDay = new Map(dailyUsage[0].map(row => [row.dia, Number(row.segundos)]))
  const deliveriesByDay = new Map(dailyDeliveries[0].map(row => [row.dia, Number(row.entregues)]))
  const history = Array.from({ length: (Date.parse(tomorrow) - Date.parse(from)) / 86400000 }, (_, index) => {
    const dia = new Date(Date.parse(from) + index * 86400000).toISOString().slice(0, 10)
    return { dia, segundos: medicao_desde && dia >= medicao_desde ? usageByDay.get(dia) || 0 : null, entregues: deliveriesByDay.get(dia) || 0 }
  })
  return {
    segundos: medicao_desde ? Number(total || 0) : null,
    inicio,
    medicao_desde,
    hoje: today,
    consultado_em: now.toISOString(),
    ultimo_registro: ultimo_intervalo == null ? null : new Date(Number(ultimo_intervalo) * SAMPLE_SECONDS * 1000).toISOString(),
    entregues: summarize(completed[0]),
    pendentes: account.tipo === 'aluno' ? summarize(pending[0]) : null,
    dias: history.filter(item => item.dia >= monthStart),
    historico_diario: history,
    meses: months.map(mes => ({
      mes,
      segundos: medicao_desde && mes >= medicao_desde.slice(0, 7) ? Number(usage[0].find(row => row.mes === mes)?.segundos || 0) : null,
      entregues: Number(monthlyDeliveries.find(row => row.mes === mes)?.entregues || 0)
    }))
  }
}

module.exports = { record, report, pendingActivityFor, recentUsageStart, executeUsage }
