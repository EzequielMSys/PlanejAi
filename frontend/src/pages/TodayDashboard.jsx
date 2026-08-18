import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import './TodayDashboard.css'

const isDone = (item) => Number(item?.concluido) === 1 || item?.status === 'concluído'
const isoDay = (value) => value ? new Date(value).toISOString().slice(0, 10) : ''

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function formatDay(value) {
  if (!value) return 'Sem data definida'
  return new Date(`${isoDay(value)}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
}

function getLocalMinutes() {
  try {
    const sessions = JSON.parse(localStorage.getItem('planejai:study-sessions') || '[]')
    const today = new Date().toISOString().slice(0, 10)
    return sessions.filter((item) => String(item.finishedAt || '').startsWith(today)).reduce((sum, item) => sum + Number(item.minutes || 0), 0)
  } catch { return 0 }
}

function getWeekMinutes() {
  try {
    const sessions = JSON.parse(localStorage.getItem('planejai:study-sessions') || '[]')
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7))
    return sessions.filter((item) => new Date(item.finishedAt).getTime() >= inicio.getTime()).reduce((sum, item) => sum + Number(item.minutes || 0), 0)
  } catch { return 0 }
}

function calculateStreak(days) {
  const completed = new Set(days.filter(isDone).map((day) => isoDay(day.data_estudo)))
  let cursor = new Date(); cursor.setHours(12, 0, 0, 0)
  let streak = 0
  for (let i = 0; i < 120; i += 1) {
    const key = cursor.toISOString().slice(0, 10)
    if (completed.has(key)) streak += 1
    else if (i === 0) {
      cursor.setDate(cursor.getDate() - 1)
      continue
    } else break
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function Metric({ label, value, hint, tone = 'purple' }) {
  return <article className={`today-metric is-${tone}`}><span>{label}</span><strong>{value}</strong><small>{hint}</small></article>
}

export default function TodayDashboard() {
  const { user, isAdmin, isDono } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ schedules: [], learning: null, reviews: [], errors: [] })
  const [loading, setLoading] = useState(true)
  const [weeklyGoal, setWeeklyGoal] = useState(() => Math.max(30, Number(localStorage.getItem('planejai:weekly-goal')) || 180))

  useEffect(() => {
    let active = true
    Promise.allSettled([
      cronogramaService.listarCronogramas(),
      aprendizagemService.resumo(),
      aprendizagemService.revisoes(),
      aprendizagemService.erros()
    ]).then(([schedules, learning, reviews, errors]) => {
      if (!active) return
      setData({
        schedules: schedules.status === 'fulfilled' && Array.isArray(schedules.value) ? schedules.value : [],
        learning: learning.status === 'fulfilled' ? learning.value : null,
        reviews: reviews.status === 'fulfilled' && Array.isArray(reviews.value) ? reviews.value : [],
        errors: errors.status === 'fulfilled' && Array.isArray(errors.value) ? errors.value : []
      })
      if ([schedules, learning].every((result) => result.status === 'rejected')) toast.error('A central diária está temporariamente sem conexão com o servidor.')
    }).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const schedule = data.schedules[0]
  const days = useMemo(() => schedule?.dias || [], [schedule])
  const pendingDays = useMemo(() => days.filter((day) => !isDone(day)), [days])
  const nextDay = pendingDays[0]
  const nextContent = nextDay?.conteudos?.find((item) => !isDone(item)) || nextDay?.conteudos?.[0]
  const completed = days.filter(isDone).length
  const progress = days.length ? Math.round((completed / days.length) * 100) : 0
  const today = new Date().toISOString().slice(0, 10)
  const todayDay = days.find((day) => isoDay(day.data_estudo) === today)
  const todayItems = todayDay?.conteudos || []
  const todayDone = todayItems.filter(isDone).length
  const streak = calculateStreak(days)
  const weeklyMinutes = getWeekMinutes()
  const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100))
  const focusDiscipline = data.learning?.porDisciplina?.[0]
  const name = user?.apelido || user?.nome?.split(' ')[0] || 'estudante'

  function start(content = nextContent, day = nextDay) {
    if (!content) return navigate('/cronograma')
    navigate('/estudar', { state: { conteudo: content, dia: day } })
  }

  if (loading) return <main className="pj-page"><div className="today-loading"><i /><b>Montando seu dia…</b></div></main>

  return <main className="pj-page">
    <div className="pj-wrap">
      <motion.header className="today-hero pj-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <div className="today-hero-copy">
          <span className="pj-eyebrow">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</span>
          <h1>{greeting()}, <em>{name}</em>.</h1>
          <p>{nextContent ? `Sua próxima ação é ${nextContent.titulo || 'continuar o plano'}. O resto pode esperar.` : 'Seu espaço está pronto. Escolha uma direção e avance um pouco hoje.'}</p>
          <div className="today-hero-actions">
            <button type="button" className="pj-button pj-button--primary" onClick={() => start()}>{nextContent ? 'Começar sessão' : 'Organizar cronograma'} <span>→</span></button>
            <button type="button" className="pj-button pj-button--secondary" onClick={() => navigate('/aprendizagem')}>Abrir revisões</button>
          </div>
        </div>
        <div className="today-progress-card" aria-label={`${progress}% do cronograma concluído`}>
          <div className="today-progress-ring" style={{ '--progress': `${progress * 3.6}deg` }}><span><strong>{progress}%</strong><small>do plano</small></span></div>
          <p><b>{completed}</b> de {days.length || 0} dias fechados</p>
        </div>
      </motion.header>

      <section className="today-metrics" aria-label="Resumo de hoje">
        <Metric label="Foco de hoje" value={`${getLocalMinutes()} min`} hint="tempo concluído" tone="mint" />
        <Metric label="Revisões" value={data.learning?.revisoesHoje || data.reviews.length || 0} hint="na fila adaptativa" />
        <Metric label="Pendências" value={data.learning?.errosPendentes || data.errors.filter((item) => !item.resolvido).length || 0} hint="no caderno de erros" tone="amber" />
        <Metric label="Sequência" value={`${streak} dia${streak === 1 ? '' : 's'}`} hint="consistência real" tone="rose" />
      </section>

      <section className="today-grid">
        <article className="today-agenda pj-panel">
          <header><div><span className="pj-eyebrow">Mesa de hoje</span><h2>{todayDay ? 'Seu roteiro está aqui' : 'Próxima parada'}</h2></div><span className="pj-tag">{todayDay ? `${todayDone}/${todayItems.length} feitos` : formatDay(nextDay?.data_estudo)}</span></header>
          <div className="today-agenda-list">
            {(todayItems.length ? todayItems : nextDay?.conteudos || []).slice(0, 4).map((item, index) => <button type="button" key={item.id || index} onClick={() => start(item, todayDay || nextDay)} className={`today-agenda-item ${isDone(item) ? 'is-done' : ''}`}>
              <span className="today-agenda-index">{isDone(item) ? '✓' : String(index + 1).padStart(2, '0')}</span>
              <span><b>{item.titulo || 'Conteúdo de estudo'}</b><small>{item.disciplina || item.area || 'Geral'} · {item.tipo || 'Material'}</small></span>
              <i>→</i>
            </button>)}
            {!nextDay && <div className="today-empty"><b>Plano concluído</b><p>Você pode revisar pontos frágeis ou gerar um novo cronograma.</p></div>}
          </div>
          <footer><button type="button" className="pj-button pj-button--quiet" onClick={() => navigate('/cronograma')}>Ver semana completa</button></footer>
        </article>

        <aside className="today-side">
          <article className="today-coach pj-panel">
            <span className="pj-eyebrow">Próximo melhor passo</span>
            <h2>{focusDiscipline ? `Reforce ${focusDiscipline.disciplina}` : data.reviews.length ? 'Faça uma revisão curta' : 'Construa evidência'}</h2>
            <p>{focusDiscipline ? `Seu histórico mostra ${focusDiscipline.acerto}% de acerto nessa área. Uma sessão curta agora vale mais que releitura passiva.` : 'Responda questões e registre dificuldade para o PlanejAI adaptar as próximas sessões.'}</p>
            <button type="button" className="pj-button pj-button--secondary" onClick={() => navigate('/aprendizagem')}>Treinar agora →</button>
          </article>
          <article className="today-pulse pj-panel"><div><span>Ritmo da semana</span><strong>{todayDone}/{todayItems.length || 0}</strong></div><div className="today-pulse-bars">{[0,1,2,3,4,5,6].map((n) => <i key={n} style={{ height: `${28 + ((n * 19 + progress) % 58)}%` }} />)}</div><small>Não é sobre estudar o dia inteiro. É sobre voltar amanhã.</small></article>
          <article className="today-goal pj-panel">
            <div><span className="pj-eyebrow">Meta da semana</span><strong>{weeklyMinutes} / {weeklyGoal} min</strong></div>
            <div className="today-goal-track" aria-label={`${weeklyProgress}% da meta semanal concluída`}><i style={{ width: `${weeklyProgress}%` }} /></div>
            <label>Meta em minutos
              <input type="number" min="30" step="30" value={weeklyGoal} onChange={(event) => {
                const next = Math.max(30, Number(event.target.value) || 30)
                setWeeklyGoal(next)
                localStorage.setItem('planejai:weekly-goal', String(next))
              }} />
            </label>
          </article>
          {(isAdmin || isDono || user?.tipo === 'docente') && <button type="button" className="today-manager" onClick={() => navigate(isDono ? '/dono' : '/dashboard-gestor')}>Abrir visão de gestão <span>↗</span></button>}
        </aside>
      </section>
    </div>
  </main>
}
