export const studyDone = item => Number(item?.concluido) === 1
export const localStudyDate = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(date)
}
export function dailyStudy(schedules, today = localStudyDate()) {
  const schedule = schedules.find(item => item.status === 'ATIVO') || schedules.find(item => !item.status)
  const days = [...(schedule?.dias || [])].sort((a, b) => localStudyDate(a.data_estudo).localeCompare(localStudyDate(b.data_estudo)))
  const day = days.find(item => !studyDone(item) && item.conteudos?.some(content => !studyDone(content)))
  const pending = day?.conteudos.filter(item => !studyDone(item)) || []
  const minutes = Math.max(5, Math.round((Number(day?.tempo_previsto) || 25) / Math.max(1, pending.length)))
  return { schedule, days, day, content: pending[0], pending, minutes, canStart: !!day && !day.bloqueado && localStudyDate(day.data_estudo) <= today, canAdjust: !!day && localStudyDate(day.data_estudo) <= today }
}
