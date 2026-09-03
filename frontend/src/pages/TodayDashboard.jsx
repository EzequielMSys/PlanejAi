import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import './TodayDashboard.css'

const done = (item) => Number(item?.concluido) === 1 || item?.status === 'concluído'
const iso = (value) => value ? new Date(value).toISOString().slice(0, 10) : ''
const greeting = () => new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

function localMinutes(week = false) {
  try {
    const sessions = JSON.parse(localStorage.getItem('planejai:study-sessions') || '[]')
    const start = new Date(); start.setHours(0, 0, 0, 0)
    if (week) start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return sessions.filter((item) => new Date(item.finishedAt).getTime() >= start.getTime()).reduce((sum, item) => sum + Number(item.minutes || 0), 0)
  } catch { return 0 }
}

function streakOf(days) {
  const completed = new Set(days.filter(done).map((day) => iso(day.data_estudo)))
  const cursor = new Date(); cursor.setHours(12, 0, 0, 0)
  let streak = 0
  for (let index = 0; index < 120; index += 1) {
    if (completed.has(cursor.toISOString().slice(0, 10))) streak += 1
    else if (index !== 0) break
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function TodayDashboard() {
  const { user, isAdmin, isDono } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ schedules: [], learning: null, reviews: [], errors: [] })
  const [loading, setLoading] = useState(true)
  const [weeklyGoal, setWeeklyGoal] = useState(() => Math.max(30, Number(localStorage.getItem('planejai:weekly-goal')) || 180))

  useEffect(() => {
    let active = true
    Promise.allSettled([cronogramaService.listarCronogramas(), aprendizagemService.resumo(), aprendizagemService.revisoes(), aprendizagemService.erros()])
      .then(([schedules, learning, reviews, errors]) => {
        if (!active) return
        setData({
          schedules: schedules.status === 'fulfilled' && Array.isArray(schedules.value) ? schedules.value : [],
          learning: learning.status === 'fulfilled' ? learning.value : null,
          reviews: reviews.status === 'fulfilled' && Array.isArray(reviews.value) ? reviews.value : [],
          errors: errors.status === 'fulfilled' && Array.isArray(errors.value) ? errors.value : []
        })
        if (learning.status === 'fulfilled' && Number(learning.value?.metaSemanal) >= 30) setWeeklyGoal(Number(learning.value.metaSemanal))
        if ([schedules, learning].every((result) => result.status === 'rejected')) toast.error('A central diária está temporariamente sem conexão.')
      }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const schedule = data.schedules[0]
  const days = useMemo(() => schedule?.dias || [], [schedule])
  const nextDay = days.find((day) => !done(day))
  const nextContent = nextDay?.conteudos?.find((item) => !done(item)) || nextDay?.conteudos?.[0]
  const todayDay = days.find((day) => iso(day.data_estudo) === new Date().toISOString().slice(0, 10))
  const agenda = (todayDay?.conteudos?.length ? todayDay.conteudos : nextDay?.conteudos || []).slice(0, 4)
  const completed = days.filter(done).length
  const progress = days.length ? Math.round((completed / days.length) * 100) : 0
  const weeklyMinutes = Number(data.learning?.minutosSemana ?? localMinutes(true))
  const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100))
  const pendingErrors = data.learning?.errosPendentes || data.errors.filter((item) => !item.resolvido).length || 0
  const reviews = data.learning?.revisoesHoje || data.reviews.length || 0
  const streak = streakOf(days)
  const name = user?.apelido || user?.nome?.split(' ')[0] || 'estudante'

  const start = (content = nextContent, day = nextDay) => content ? navigate('/estudar', { state: { conteudo: content, dia: day } }) : navigate('/cronograma')
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())

  if (loading) return <main className="dash-v2-loading"><span />Preparando sua central…</main>

  return <main className="dash-v2">
    <div className="dash-v2-wrap">
      <header className="dash-v2-heading">
        <div><span><i /> CENTRAL INTELIGENTE</span><h1>{greeting()}, {name}.</h1><p>{date}</p></div>
        <div><button type="button" onClick={() => navigate('/provas')}>Simulados</button><button type="button" onClick={() => navigate('/cronograma')}>Ver planejamento <b>→</b></button></div>
      </header>

      <section className="dash-v2-spotlight">
        <motion.article className="dash-v2-focus" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dash-v2-focus-top"><span>PRÓXIMA MISSÃO</span><small>{nextContent?.disciplina || nextContent?.area || 'Plano de estudos'}</small></div>
          <div className="dash-v2-focus-copy"><p>{nextContent ? 'Continue de onde seu plano recomenda' : 'Seu espaço de aprendizagem está pronto'}</p><h2>{nextContent?.titulo || 'Organize seu próximo ciclo de estudos'}</h2><div><span>{nextContent?.tipo || 'Planejamento'}</span><span>{nextDay?.tempo_previsto ? `${nextDay.tempo_previsto} min` : 'No seu ritmo'}</span></div></div>
          <footer><button type="button" onClick={() => start()}>{nextContent ? 'Começar agora' : 'Montar cronograma'} <b>→</b></button><span>{progress}% do plano concluído</span></footer>
        </motion.article>

        <aside className="dash-v2-score">
          <div className="dash-v2-ring" style={{ '--score': `${weeklyProgress * 3.6}deg` }}><span><strong>{weeklyProgress}%</strong><small>meta semanal</small></span></div>
          <h2>{weeklyMinutes} de {weeklyGoal} min</h2><p>Consistência vale mais do que intensidade isolada.</p>
          <label>AJUSTAR META <input type="number" min="30" step="30" value={weeklyGoal} onChange={(event) => { const value = Math.max(30, Number(event.target.value) || 30); setWeeklyGoal(value); localStorage.setItem('planejai:weekly-goal', String(value)); aprendizagemService.atualizarMetaSemanal(value).catch(() => {}) }} /></label>
        </aside>
      </section>

      <section className="dash-v2-stats">
        <article><span>HOJE</span><strong>{localMinutes()}<small> min</small></strong><p>tempo em foco</p><i>↗</i></article>
        <article><span>REVISÕES</span><strong>{reviews}</strong><p>aguardando você</p><i>◎</i></article>
        <article><span>PONTOS FRÁGEIS</span><strong>{pendingErrors}</strong><p>para transformar em domínio</p><i>!</i></article>
        <article><span>SEQUÊNCIA</span><strong>{streak}<small> dias</small></strong><p>voltando para aprender</p><i>◆</i></article>
      </section>

      <section className="dash-v2-content">
        <article className="dash-v2-agenda">
          <header><div><span>ROTEIRO RECOMENDADO</span><h2>{todayDay ? 'Sua mesa de hoje' : 'Prepare o próximo estudo'}</h2></div><button type="button" onClick={() => navigate('/cronograma')}>Abrir semana</button></header>
          <div>{agenda.map((item, index) => <button type="button" key={item.id || index} onClick={() => start(item, todayDay || nextDay)} data-done={done(item)}><i>{done(item) ? '✓' : String(index + 1).padStart(2, '0')}</i><span><b>{item.titulo || 'Conteúdo de estudo'}</b><small>{item.disciplina || item.area || 'Geral'} · {item.tipo || 'Material'}</small></span><em>→</em></button>)}{!agenda.length && <div className="dash-v2-empty"><b>Nenhuma sessão pendente.</b><p>Crie um cronograma ou aproveite para revisar.</p></div>}</div>
        </article>

        <aside className="dash-v2-insights">
          <article className="dash-v2-coach"><span>ORIENTAÇÃO DO PLANEJAI</span><h2>{data.learning?.porDisciplina?.[0] ? `Dê atenção a ${data.learning.porDisciplina[0].disciplina}` : reviews ? 'Uma revisão curta cabe agora' : 'Gere evidências do que aprendeu'}</h2><p>Questões e revisões alimentam seu mapa e tornam as próximas recomendações mais precisas.</p><button onClick={() => navigate('/aprendizagem')}>Treinar agora <b>→</b></button></article>
          <article className="dash-v2-week"><header><span>RITMO DOS ÚLTIMOS 7 DIAS</span><strong>{completed}/{days.length || 0}</strong></header><div>{[0,1,2,3,4,5,6].map((item) => <i key={item} style={{ height: `${24 + ((item * 23 + progress) % 68)}%` }} />)}</div><p>Seu histórico cresce cada vez que você retorna.</p></article>
          {(isAdmin || isDono || user?.tipo === 'docente') && <button type="button" className="dash-v2-manager" onClick={() => navigate(isDono ? '/dono' : '/dashboard-gestor')}>Acessar central de gestão <span>↗</span></button>}
        </aside>
      </section>
    </div>
  </main>
}
