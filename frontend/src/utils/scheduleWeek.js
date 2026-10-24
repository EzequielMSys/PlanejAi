import { localStudyDate } from './dailyStudy'
function calendarDate(value) {
  if (!value || (!(value instanceof Date) && !/^\d{4}-\d{2}-\d{2}(?:$|T| )/.test(String(value)))) return null
  try {
    const key = localStudyDate(value)
    const date = new Date(`${key}T12:00:00Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === key ? key : null
  } catch { return null }
}
export function shiftDate(key, amount) {
  const date = new Date(`${key}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + amount)
  return date.toISOString().slice(0, 10)
}
export function mondayOf(key) {
  const day = new Date(`${key}T12:00:00Z`).getUTCDay()
  return shiftDate(key, -((day + 6) % 7))
}
export function scheduleWeeks(days, reference = localStudyDate()) {
  const dated = days.map(day => ({ ...day, date: calendarDate(day.data_estudo) })).filter(day => day.date).sort((a,b) => a.date.localeCompare(b.date))
  const first = mondayOf(dated[0]?.date || reference)
  const last = mondayOf(dated.at(-1)?.date || reference)
  const current = mondayOf(reference)
  return { first, last, initial: current < first ? first : current > last ? last : current, dated }
}
export function weekDays(days, monday) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = shiftDate(monday, index)
    const entries = days.filter(day => calendarDate(day.data_estudo) === date)
    return { date, entries, minutes: entries.reduce((sum,day) => sum + Math.max(0,Number(day.tempo_previsto)||0),0) }
  })
}
