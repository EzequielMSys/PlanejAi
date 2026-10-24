import { useEffect, useState } from 'react'
import { localStudyDate } from '../utils/dailyStudy'
import { mondayOf, scheduleWeeks, shiftDate, weekDays } from '../utils/scheduleWeek'
import './ScheduleWeek.css'

const dateLabel = (date, options) => new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone:'UTC', ...options })
const done = day => Number(day.concluido) === 1 || day.status === 'concluído'
export default function ScheduleWeek({ days, onOpenDay, initialWeek, onWeekChange }) {
  const today = localStudyDate()
  const { first, last, initial } = scheduleWeeks(days, today)
  const [selected, setSelected] = useState(initialWeek || initial)
  const selectWeek = value => { setSelected(value); onWeekChange?.(value) }
  useEffect(() => { setSelected(current => current < first ? first : current > last ? last : current) }, [first,last])
  const monday = selected < first ? first : selected > last ? last : selected
  const week = weekDays(days,monday)
  const total = week.reduce((sum,day) => sum + day.minutes,0)
  const sessions = week.reduce((sum,day) => sum + day.entries.length,0)
  const currentWeek = mondayOf(today)
  return <section className="schedule-week" aria-label="Visão semanal do cronograma">
    <header className="schedule-week-heading"><div><span className="schedule-week-eyebrow">O PLANO, NO SEU TEMPO</span><h3>{dateLabel(monday,{day:'2-digit',month:'short'})} — {dateLabel(shiftDate(monday,6),{day:'2-digit',month:'short',year:'numeric'})}</h3><p role="status" aria-live="polite">{sessions} {sessions === 1 ? 'etapa' : 'etapas'} · {total} min planejados nesta semana</p></div><div className="schedule-week-navigation"><button type="button" aria-label="Semana anterior" disabled={monday <= first} onClick={() => selectWeek(shiftDate(monday,-7))}>←</button><button type="button" disabled={currentWeek < first || currentWeek > last || monday === currentWeek} onClick={() => selectWeek(currentWeek)}>Esta semana</button><button type="button" aria-label="Próxima semana" disabled={monday >= last} onClick={() => selectWeek(shiftDate(monday,7))}>→</button></div></header>
    <ol className="schedule-week-grid">{week.map(({date,entries,minutes}) => <li key={date} className={`schedule-week-day${date === today ? ' is-today' : ''}${!entries.length ? ' is-empty' : ''}`} aria-current={date === today ? 'date' : undefined}><header><span>{dateLabel(date,{weekday:'short'})}</span><strong>{dateLabel(date,{day:'2-digit'})}</strong>{date === today && <small>Hoje</small>}</header>{entries.length ? <><p className="schedule-week-duration">{minutes} min previstos</p>{entries.map(day => {
      const contents = day.conteudos || []
      const completed = contents.filter(item => Number(item.concluido) === 1).length
      const state = done(day) ? 'Concluída' : day.bloqueado ? day.requer_desafio ? 'Desafio disponível' : 'Aguardando liberação' : 'Disponível'
      return <article className="schedule-week-entry" data-state={done(day) ? 'done' : day.bloqueado ? 'locked' : 'ready'} key={day.id_dia || day.id}><span className="schedule-week-state">{done(day) ? '✓ ' : day.bloqueado ? '◇ ' : '○ '}{state}</span><h4>{contents[0]?.disciplina || contents[0]?.area || 'Etapa de estudo'}</h4><p>{contents[0]?.titulo || 'Confira as atividades desta etapa'}</p>{contents.length > 1 && <small>+ {contents.length-1} {contents.length === 2 ? 'conteúdo' : 'conteúdos'}</small>}<small>{completed} de {contents.length} feitos</small><button type="button" aria-label={`Ver etapa de ${dateLabel(date,{weekday:'long',day:'2-digit',month:'long'})}`} onClick={() => onOpenDay(day.id_dia || day.id)}>Ver etapa <span aria-hidden="true">↗</span></button></article>
    })}</> : <div className="schedule-week-empty"><span aria-hidden="true">—</span><p>Sem sessão no plano</p></div>}</li>)}</ol>
    <p className="schedule-week-footnote">A semana mostra o que está no cronograma, sem alterar datas. Abra uma etapa para ver os conteúdos; use “Seu dia mudou?” para confirmar um ajuste de rotina.</p>
  </section>
}
