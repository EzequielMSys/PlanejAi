import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import './TodayDashboard.css'
import RouteLoading from '../components/RouteLoading'

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
  // A meta é uma preferência da conta, não do dispositivo. O resumo inicial a
  // hidrata a partir do banco para manter a mesma experiência em qualquer PC.
  const [weeklyGoal, setWeeklyGoal] = useState(180)
  const [goalDraft, setGoalDraft] = useState('180')
  const [editingGoal, setEditingGoal] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)

  useEffect(() => {
    let active = true
    // Os indicadores secundários não devem atrasar a primeira visão do dia.
    Promise.allSettled([cronogramaService.listarCronogramas(), aprendizagemService.resumo()])
      .then(([schedules, learning]) => {
        if (!active) return
        setData((current) => ({ ...current,
          schedules: schedules.status === 'fulfilled' && Array.isArray(schedules.value) ? schedules.value : [],
          learning: learning.status === 'fulfilled' ? learning.value : null,
        }))
        if (learning.status === 'fulfilled' && Number(learning.value?.metaSemanal) >= 30) setWeeklyGoal(Number(learning.value.metaSemanal))
        if ([schedules, learning].every((result) => result.status === 'rejected')) toast.error('A central diária está temporariamente sem conexão.')
      }).finally(() => active && setLoading(false))
    aprendizagemService.revisoes()
      .then((reviews) => { if (active && Array.isArray(reviews)) setData((current) => ({ ...current, reviews })) })
      .catch(() => {})
    aprendizagemService.erros()
      .then((errors) => { if (active && Array.isArray(errors)) setData((current) => ({ ...current, errors })) })
      .catch(() => {})
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
  const weeklyMinutes = Math.max(0, Number(data.learning?.minutosSemana ?? localMinutes(true)) || 0)
  const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100))
  const remainingMinutes = Math.max(0, weeklyGoal - weeklyMinutes)
  const pendingErrors = data.learning?.errosPendentes || data.errors.filter((item) => !item.resolvido).length || 0
  const reviews = data.learning?.revisoesHoje || data.reviews.length || 0
  const streak = streakOf(days)
  const name = user?.apelido || user?.nome?.split(' ')[0] || 'estudante'

  const start = (content = nextContent, day = nextDay) => content ? navigate('/estudar', { state: { conteudo: content, dia: day } }) : navigate('/cronograma')
  const updateWeeklyGoal = async (event) => {
    event.preventDefault()
    const nextGoal = Number(goalDraft)
    if (!Number.isInteger(nextGoal) || nextGoal < 30 || nextGoal > 1680) {
      toast.error('Escolha uma meta entre 30 e 1680 minutos.')
      return
    }
    setSavingGoal(true)
    try {
      const saved = await aprendizagemService.atualizarMetaSemanal(nextGoal)
      setWeeklyGoal(Number(saved?.minutosMeta) || nextGoal)
      setEditingGoal(false)
    } catch {
      toast.error('Não foi possível salvar a meta semanal. Tente novamente.')
    } finally {
      setSavingGoal(false)
    }
  }
  const date = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }).format(new Date())
  const recentDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date()
    day.setDate(day.getDate() - 6 + index)
    const key = new Intl.DateTimeFormat('en-CA').format(day)
    const count = days.filter((item) => done(item) && String(item.data_estudo).slice(0, 10) === key).length
    return { label: day.toLocaleDateString('pt-BR', { weekday: 'short' }), count }
  })
  const maxRecent = Math.max(1, ...recentDays.map((day) => day.count))

  if (loading) return <RouteLoading />

  return <main className="dash-v2">
    <div className="dash-v2-wrap">
      <header className="dash-v2-heading">
        <div><span>SEU CADERNO DE ESTUDOS</span><h1>{greeting()}, {name}.</h1><p>{date}</p></div>
        <div><button type="button" onClick={() => navigate('/provas')}>Simulados</button><button type="button" onClick={() => navigate('/cronograma')}>Ver planejamento <b>→</b></button></div>
      </header>

      <section className="dash-v2-spotlight">
        <motion.article className="dash-v2-focus" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="dash-v2-focus-top"><span>UM PASSO DE CADA VEZ</span><small>{nextContent?.disciplina || nextContent?.area || 'Plano de estudos'}</small></div>
          <div className="dash-v2-focus-copy"><p>{nextContent ? 'Continue de onde seu plano recomenda' : 'Seu espaço de aprendizagem está pronto'}</p><h2>{nextContent?.titulo || 'Organize seu próximo ciclo de estudos'}</h2><div><span>{nextContent?.tipo || 'Planejamento'}</span><span>{nextDay?.tempo_previsto ? `${nextDay.tempo_previsto} min` : 'No seu ritmo'}</span></div></div>
          <footer><button type="button" onClick={() => start()}>{nextContent ? 'Começar agora' : 'Montar cronograma'} <b>→</b></button><span>{progress}% do plano concluído</span></footer>
        </motion.article>

        <aside className="dash-v2-score">
          <div className="dash-v2-score-head"><span>META DA SEMANA</span><button type="button" onClick={() => { setGoalDraft(String(weeklyGoal)); setEditingGoal(!editingGoal) }} aria-expanded={editingGoal}>{editingGoal ? 'Fechar' : 'Editar meta'} <span aria-hidden="true">↗</span></button></div>
          <div className="dash-v2-score-main">
            <div className="dash-v2-ring" style={{ '--score': `${weeklyProgress * 3.6}deg` }} aria-hidden="true"><span><strong>{weeklyProgress}%</strong><small>concluído</small></span></div>
            <div className="dash-v2-score-copy"><h2><strong>{weeklyMinutes}</strong><span>min estudados</span></h2><p>de {weeklyGoal} min planejados</p></div>
          </div>
          <div className="dash-v2-score-progress" role="progressbar" aria-label="Progresso da meta semanal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={weeklyProgress}><span style={{ width: `${weeklyProgress}%` }} /></div>
          <p className="dash-v2-score-message">{remainingMinutes === 0 ? 'Meta cumprida! Seu esforço desta semana já passou do planejado.' : weeklyMinutes === 0 ? `Faltam ${remainingMinutes} min. Que tal começar com uma sessão hoje?` : `Faltam ${remainingMinutes} min para fechar sua meta da semana.`}</p>
          {editingGoal ? <form className="dash-v2-score-form" onSubmit={updateWeeklyGoal}><label htmlFor="weekly-goal">Nova meta semanal <span>(30 a 1680 min)</span></label><div><input id="weekly-goal" type="number" min="30" max="1680" step="1" value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} required /><button type="submit" disabled={savingGoal}>{savingGoal ? 'Salvando…' : 'Salvar'}</button></div></form> : <button type="button" className="dash-v2-score-cta" onClick={() => start()}>{nextContent ? 'Continuar estudando' : 'Montar cronograma'} <span aria-hidden="true">→</span></button>}
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
          <article className="dash-v2-week"><header><span>DIAS DO PLANO CONCLUÍDOS</span><strong>{completed}/{days.length || 0}</strong></header><div role="img" aria-label={recentDays.map((day) => `${day.label}: ${day.count}`).join('; ')}>{recentDays.map((day, index) => <i key={index} title={`${day.label}: ${day.count}`} style={{ height: `${Math.max(4, day.count / maxRecent * 100)}%`, opacity: day.count ? 1 : .2 }} />)}</div><p>Últimos 7 dias do cronograma. Dias sem conclusão aparecem na linha de base.</p></article>
          {(isAdmin || isDono || user?.tipo === 'docente') && <button type="button" className="dash-v2-manager" onClick={() => navigate(isDono ? '/dono' : '/dashboard-gestor')}>Acessar central de gestão <span>↗</span></button>}
        </aside>
      </section>
    </div>
  </main>
}
