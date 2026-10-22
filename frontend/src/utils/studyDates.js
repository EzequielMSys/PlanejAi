export function localDateKey(value) {
  if (!value) return ''
  // SQL DATE values represent calendar days, not midnight in UTC.
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
export function weeklyCompletion(days, today = new Date()) {
  const completed = new Set(days.filter(day => Number(day.concluido) === 1 || day.status === 'concluído').map(day => localDateKey(day.data_estudo)))
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() - 6 + index)
    const key = localDateKey(date)
    return { key, label: new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric' }).format(date), completed: completed.has(key) }
  })
}
