const pool = require('../config/db')

const dateKey = value => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10)
const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date())
const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB']
function fail(message, status = 409) { const error = new Error(message); error.status = status; throw error }

function planAdjustment({ days, contents, dayId, action, today, availableDays, defaultMinutes }) {
  if (!['REDUZIR', 'ADIAR'].includes(action)) fail('Escolha um ajuste válido.', 400)
  const pending = days.filter(day => !Number(day.concluido) && contents.some(item => item.id_dia === day.id_dia && !Number(item.concluido)))
  const source = pending[0]
  if (!source || source.id_dia !== dayId || dateKey(source.data_estudo) > today) fail('O dia mudou. Atualize o cronograma antes de ajustar.')
  if (!availableDays.length) fail('Configure pelo menos um dia disponível no perfil.', 400)
  const remaining = contents.filter(item => item.id_dia === dayId && !Number(item.concluido))
  const completed = contents.some(item => item.id_dia === dayId && Number(item.concluido))
  const updates = []
  let newDay = null
  let moveIds = []
  if (action === 'REDUZIR') {
    updates.push({ id: dayId, date: today, minutes: 20, done: 0 })
    moveIds = remaining.slice(1).map(item => item.id)
    if (moveIds.length) newDay = { minutes: defaultMinutes }
  } else if (completed) {
    updates.push({ id: dayId, date: dateKey(source.data_estudo), minutes: source.tempo_previsto, done: 1 })
    moveIds = remaining.map(item => item.id)
    newDay = { minutes: defaultMinutes }
  }
  const occupied = new Set(days.filter(day => Number(day.concluido)).map(day => dateKey(day.data_estudo)))
  const cursor = new Date(`${today}T12:00:00Z`)
  function nextDate(minimum = today) {
    for (let count = 0; count < 3660; count++) {
      cursor.setUTCDate(cursor.getUTCDate() + 1)
      const key = dateKey(cursor)
      if (key >= minimum && availableDays.includes(weekDays[cursor.getUTCDay()]) && !occupied.has(key)) return key
    }
    fail('Não foi possível encontrar uma data disponível.', 400)
  }
  if (newDay) newDay.date = nextDate()
  const future = action === 'ADIAR' && !completed ? pending : pending.slice(1)
  // Sem conteúdo transferido, o ajuste curto não altera o restante da semana.
  if (action === 'ADIAR' || newDay) for (const day of future) {
    updates.push({ id: day.id_dia, date: nextDate(dateKey(day.data_estudo)), minutes: day.tempo_previsto, done: 0 })
  }
  return { updates, newDay, moveIds }
}

async function adjustDay(userId, dayId, action) {
  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()
    const [owners] = await connection.execute(`SELECT cr.id_cronograma, pe.id_perfil, pe.tempo_diario_min FROM cronogramas cr
      JOIN perfil_estudo pe ON pe.id_perfil=cr.id_perfil JOIN cronograma_dias d ON d.id_cronograma=cr.id_cronograma
      WHERE pe.id_usuario=? AND d.id_dia=? AND cr.status='ATIVO' FOR UPDATE`, [userId, dayId])
    if (!owners.length) fail('Dia não encontrado no seu cronograma ativo.', 404)
    const owner = owners[0]
    const [days] = await connection.execute('SELECT * FROM cronograma_dias WHERE id_cronograma=? ORDER BY data_estudo,id_dia FOR UPDATE', [owner.id_cronograma])
    const [contents] = await connection.execute(`SELECT cc.id,cc.id_dia,cc.concluido FROM cronograma_conteudos cc
      JOIN cronograma_dias d ON d.id_dia=cc.id_dia WHERE d.id_cronograma=? ORDER BY cc.id FOR UPDATE`, [owner.id_cronograma])
    const [availability] = await connection.execute('SELECT dia_semana FROM disponibilidade_semana WHERE id_perfil=? AND ocupado=0', [owner.id_perfil])
    const plan = planAdjustment({ days, contents, dayId, action, today: todayKey(), availableDays: availability.map(item => item.dia_semana), defaultMinutes: Number(owner.tempo_diario_min) || 60 })
    for (const update of plan.updates) await connection.execute('UPDATE cronograma_dias SET data_estudo=?,tempo_previsto=?,concluido=? WHERE id_dia=?', [update.date, update.minutes, update.done, update.id])
    if (plan.newDay) {
      const [inserted] = await connection.execute('INSERT INTO cronograma_dias (id_cronograma,data_estudo,tempo_previsto,concluido) VALUES (?,?,?,0)', [owner.id_cronograma, plan.newDay.date, plan.newDay.minutes])
      for (const id of plan.moveIds) await connection.execute('UPDATE cronograma_conteudos SET id_dia=? WHERE id=? AND concluido=0', [inserted.insertId, id])
    }
    await connection.execute('UPDATE cronogramas SET data_fim=GREATEST(data_fim,(SELECT MAX(data_estudo) FROM cronograma_dias WHERE id_cronograma=?)) WHERE id_cronograma=?', [owner.id_cronograma, owner.id_cronograma])
    await connection.commit()
    return { message: action === 'REDUZIR' ? `Hoje ficou com uma sessão de 20 minutos. ${plan.newDay ? 'O restante foi reorganizado nos seus dias disponíveis.' : 'As outras datas foram mantidas.'}` : 'Seu estudo foi adiado. As próximas etapas foram reorganizadas nos seus dias disponíveis.', ...plan }
  } catch (error) { await connection.rollback(); throw error }
  finally { connection.release() }
}
module.exports = { adjustDay, planAdjustment }
