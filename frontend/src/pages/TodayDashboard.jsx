import TodayPreparation from '../components/TodayPreparation'
import TodayQuickReview from '../components/TodayQuickReview'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import atividadeService from '../services/atividadeService'
import './TodayDashboard.css'
import RouteLoading from '../components/RouteLoading'
import DailyPlanActions from '../components/DailyPlanActions'
import LearningSignals from '../components/LearningSignals'
import { dailyStudy, localStudyDate } from '../utils/dailyStudy'
import { mondayOf, weekDays } from '../utils/scheduleWeek'
import continuity from '../services/studyContinuityService'
import { scopedCacheKey } from '../utils/offlineStore'
import FirstStudySteps from '../components/FirstStudySteps'
import RecoveryState from '../components/RecoveryState'
import '../components/StudyRecommendations.css'
import closures from '../services/sessionClosureService'
import StudyReturns from '../components/StudyReturns'
import {currentUser} from '../utils/offlineStore'
import {readTodayVisit,rememberTodayVisit,todayWelcome} from '../utils/todayWelcome'

const done = (item) => Number(item?.concluido) === 1 || item?.status === 'concluído'
const greeting = () => new Date().getHours() < 12 ? 'Bom dia' : new Date().getHours() < 18 ? 'Boa tarde' : 'Boa noite'

function localMinutes(week = false) {
  try {
    const sessions = JSON.parse(localStorage.getItem(scopedCacheKey('study-sessions')) || '[]')
    const start = new Date(); start.setHours(0, 0, 0, 0)
    if (week) start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
    return sessions.filter((item) => new Date(item.finishedAt).getTime() >= start.getTime()).reduce((sum, item) => sum + Number(item.minutes || 0), 0)
  } catch { return 0 }
}

export default function TodayDashboard() {
  const [lastVisit]=useState(readTodayVisit)
  useEffect(()=>{rememberTodayVisit()},[])
  const { user, isAdmin, isDono, perfilCompleto } = useAuth()
  const [priority, setPriority] = useState(null)
  useEffect(() => {
    setPriority(null)
    if (user?.tipo !== 'aluno') return
    const request = new AbortController()
    atividadeService.prioritaria(request.signal).then(activity => {
      if (!request.signal.aborted) setPriority(activity)
    }).catch(() => {})
    return () => request.abort()
  }, [user?.tipo, user?.id, user?.id_usuario])
  const [returns,setReturns]=useState(null)
  const [returnsStatus,setReturnsStatus]=useState('loading')
  const [returnsAttempt,setReturnsAttempt]=useState(0)
  const [openingReturn,setOpeningReturn]=useState(false)
  useEffect(()=>{
    const abort=new window.AbortController(),owner=currentUser()
    setReturnsStatus('loading')
    closures.pending(abort.signal).then(value=>{if(!abort.signal.aborted && owner===currentUser()){if(!value || !Object.hasOwn(value,'principal'))throw Error('invalid');setReturns(value);setReturnsStatus('ready')}}).catch(()=>{if(!abort.signal.aborted && owner===currentUser())setReturnsStatus('error')})
    return()=>abort.abort()
  },[returnsAttempt,user?.id,user?.id_usuario])
  const [resume, setResume] = useState(null)
  const [resumeStatus, setResumeStatus] = useState('loading')
  useEffect(() => {
    let active = true
    continuity.current().then(saved => { if (active) { setResume(saved?.conteudo ? saved : null); setResumeStatus('ready') } }).catch(() => { if (active) setResumeStatus('error') })
    return () => { active = false }
  }, [])
  const reloadResume = async () => {
    setResumeStatus('loading')
    try { const saved = await continuity.current(); setResume(saved?.conteudo ? saved : null); setResumeStatus('ready') }
    catch { setResumeStatus('error') }
  }
  const navigate = useNavigate()
  const [data, setData] = useState({ schedules: [], learning: null, reviews: [], evolution: [] })
  const [loading, setLoading] = useState(true)
  const [planError, setPlanError] = useState(false)
  const [learningFailed, setLearningFailed] = useState(false)
  const [retryingLearning, setRetryingLearning] = useState(false)
  // A meta é uma preferência da conta, não do dispositivo. O resumo inicial a
  // hidrata a partir do banco para manter a mesma experiência em qualquer PC.
  const [weeklyGoal, setWeeklyGoal] = useState(180)
  const [goalDraft, setGoalDraft] = useState('180')
  const [editingGoal, setEditingGoal] = useState(false)
  const [savingGoal, setSavingGoal] = useState(false)

  useEffect(() => {
    let active = true
    // Os indicadores secundários não devem atrasar a primeira visão do dia.
    cronogramaService.listarCronogramas()
      .then((schedules) => {
        if (!Array.isArray(schedules)) throw new Error('Cronograma indisponível')
        if (!active) return
        setData((current) => ({ ...current,
          schedules,
        }))
      }).catch(() => { if (active) { setPlanError(true); toast.error('Não foi possível carregar seu plano. Tente novamente em instantes.') } })
      .finally(() => active && setLoading(false))
    aprendizagemService.resumo().then(learning => {
      if (!active) return
      setData(current => ({ ...current, learning }))
      if (Number(learning?.metaSemanal) >= 30) setWeeklyGoal(Number(learning.metaSemanal))
    }).catch(() => { if (active) setLearningFailed(true) })
    aprendizagemService.revisoes()
      .then((reviews) => { if (active && Array.isArray(reviews)) setData((current) => ({ ...current, reviews })) })
      .catch(() => {})
    aprendizagemService.evolucao().then(evolution => { if (active && Array.isArray(evolution)) setData(current => ({ ...current, evolution })) }).catch(() => {})
    return () => { active = false }
  }, [])

  const { schedule, days, day: nextDay, content: nextContent, canStart } = useMemo(() => dailyStudy(data.schedules), [data.schedules])
  const today = localStudyDate()
  const week = weekDays(days, mondayOf(today))
  const todayComplete = days.some(day => localStudyDate(day.data_estudo) === today && day.conteudos?.length)
    && days.filter(day => localStudyDate(day.data_estudo) === today).every(day => done(day) || (day.conteudos?.length && day.conteudos.every(done)))
  const todayDay = days.find((day) => localStudyDate(day.data_estudo) === localStudyDate())
  const agenda = (todayDay?.conteudos?.length ? todayDay.conteudos : nextDay?.conteudos || []).slice(0, 4)
  const completed = days.filter(done).length
  const weeklyMinutes = Math.max(0, Number(data.learning?.minutosSemana ?? localMinutes(true)) || 0)
  const hasLearningHistory = Boolean(weeklyMinutes || data.evolution.length || data.learning?.porDisciplina?.length)
  const weeklyProgress = Math.min(100, Math.round((weeklyMinutes / weeklyGoal) * 100))
  const remainingMinutes = Math.max(0, weeklyGoal - weeklyMinutes)
  const reviews = Number(data.learning?.revisoesHoje ?? data.reviews.length) || 0
  const name = user?.apelido || user?.nome?.split(' ')[0] || 'estudante'

  const weakSubject = data.learning?.porDisciplina?.find((item) => Number(item.tentativas) >= 3 && Number(item.acerto) < 70)
  const firstReview = data.reviews[0]
  const pendingContents = days.reduce((total, day) => total + (day.conteudos || []).filter(item => !done(item)).length, 0)
  const resumeDate = resume?.atualizadoEm && !Number.isNaN(Date.parse(resume.atualizadoEm)) ? new Date(resume.atualizadoEm).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : null
  const returnSuggestion=returnsStatus==='ready'?returns?.principal:null
  const returnLabels={lembrete:'Retomar meu próximo passo',explicacao:'Explicar novamente',duvida:'Investigar minha dúvida',revisao:'Começar revisão'}
  const nextAction = resume
    ? { kind: 'resume', title: resume.conteudo.titulo, subject: resume.conteudo.disciplina || 'Sessão em andamento', reason: `Esta foi sua última sessão aberta${resumeDate ? `, em ${resumeDate}` : ''}, ainda sem conclusão. Você pode reler as anotações confirmadas na conta e escolher um próximo passo.`, duration: 'Continue no seu ritmo', label: 'Retomar minha sessão' }
    : returnSuggestion
    ? {kind:'return',entry:returnSuggestion,title:returnSuggestion.titulo,subject:returnSuggestion.disciplina || 'Seu fio de estudo',reason:returnSuggestion.motivo,duration:`${returnSuggestion.minutos} min sugeridos para começar`,label:returnLabels[returnSuggestion.tipo] || 'Retomar meu estudo'}
    : nextContent && canStart
    ? { kind: 'lesson', title: nextContent.titulo || 'Atividade do plano', subject: nextContent.disciplina || nextContent.area || 'Plano de estudos', reason: localStudyDate(nextDay.data_estudo) < today ? 'Atividade pendente de um dia anterior.' : 'Atividade pendente de hoje.', duration: Number(nextDay.tempo_previsto) > 0 ? `${nextDay.tempo_previsto} min previstos para o dia` : null, label: 'Continuar meus estudos' }
    : todayComplete
    ? { kind: 'complete', title: 'Atividades de hoje concluídas', subject: 'Plano de estudos', reason: 'O que você concluiu já aparece no cronograma.', label: 'Ver cronograma', route: '/cronograma' }
    : firstReview || reviews > 0
    ? { kind: 'review', title: firstReview?.titulo || 'Revisar o que já estudou', subject: firstReview?.disciplina || 'Revisão', reason: `${reviews} ${reviews === 1 ? 'revisão' : 'revisões'} pronta${reviews === 1 ? '' : 's'} para hoje, conforme seu histórico de estudo.`, duration: 'Sessão curta', label: 'Começar revisão', route: '/aprendizagem' }
    : weakSubject
      ? { kind: 'practice', title: `Praticar ${weakSubject.disciplina}`, subject: weakSubject.disciplina, reason: `${weakSubject.acerto}% de acerto em ${weakSubject.tentativas} tentativas registradas nessa matéria.`, duration: 'No seu ritmo', label: 'Praticar agora', route: '/aprendizagem' }
      : nextContent
        ? { kind: 'plan', title: nextContent.titulo, subject: nextContent.disciplina || 'Próximo estudo', reason: `Sua próxima etapa está prevista para ${new Date(`${localStudyDate(nextDay.data_estudo)}T12:00:00`).toLocaleDateString('pt-BR')}.`, label: 'Ver próxima etapa', route: '/cronograma' }
        : schedule
          ? { kind: 'plan', title: 'Confira seu cronograma', subject: 'Planejamento', reason: days.length ? 'O plano atual não tem conteúdo pendente.' : 'O plano ativo ainda não tem atividades disponíveis.', label: 'Abrir planejamento', route: '/cronograma' }
          : { kind: 'plan', title: 'Seu próximo ciclo começa aqui.', subject: 'Planejamento', reason: 'Ainda não há um cronograma ativo. Organize seus estudos conforme sua disponibilidade.', label: 'Criar cronograma', route: perfilCompleto ? '/cronograma' : '/onboarding' }

  const start = (content = nextContent, day = nextDay) => content && !day?.bloqueado && localStudyDate(day?.data_estudo) <= localStudyDate() ? navigate('/estudar', { state: { conteudo: content, dia: day } }) : navigate('/cronograma')
  const reloadPlan = async () => {
    const schedules = await cronogramaService.listarCronogramas()
    if (!Array.isArray(schedules)) throw new Error('Cronograma indisponível')
    setData(current => ({ ...current, schedules }))
    setPlanError(false)
  }
  const reloadLearning = async () => {
    setRetryingLearning(true)
    try {
      const learning = await aprendizagemService.resumo()
      setData(current => ({ ...current, learning }))
      if (Number(learning?.metaSemanal) >= 30) setWeeklyGoal(Number(learning.metaSemanal))
      setLearningFailed(false)
    } catch { setLearningFailed(true) } finally { setRetryingLearning(false) }
  }
  async function openReturn(item) {
    if(openingReturn)return
    if(item.tipo==='explicacao'||item.tipo==='duvida')return navigate('/aprendizagem',{state:{aba:'diario',registro:item.id,tipo:item.tipo}})
    if(item.tipo==='revisao')return navigate('/aprendizagem',{state:{aba:'revisoes',idRevisao:item.id}})
    setOpeningReturn(true)
    const owner=currentUser()
    try{const saved=await closures.resume(item.id);if(owner===currentUser() && saved?.conteudo)navigate('/estudar',{state:saved})}
    catch(error){toast.error(error?.response?.data?.message || 'Não conseguimos abrir o conteúdo. Seu lembrete continua salvo.')}
    finally{setOpeningReturn(false)}
  }
  async function finishReturn(id) {
    if(openingReturn)return
    setOpeningReturn(true)
    try{const result=await closures.done(id);if(!result?.confirmado)throw Error('unconfirmed');setReturnsAttempt(n=>n+1);toast.success('Próximo passo marcado como feito.')}
    catch{toast.error('O servidor não confirmou a alteração. O lembrete continua disponível.')}
    finally{setOpeningReturn(false)}
  }
  const openNextAction = () => nextAction.kind === 'return' ? openReturn(nextAction.entry) : nextAction.kind === 'resume' ? navigate('/estudar', { state: resume }) : nextAction.kind === 'lesson' ? start() : navigate(nextAction.route, nextAction.kind === 'practice' ? { state: { aba: 'simulado', disciplina: weakSubject?.disciplina } } : undefined)
  const openShortReturn = () => navigate('/estudar', { state: { ...(resume || { conteudo: nextContent, dia: nextDay }), retomadaCurta: true } })
  const askLumiAboutNextAction = () => navigate('/lumi', { state: { perguntaInicial: `Meu próximo passo sugerido é ${nextAction.title}. O dado disponível é: ${nextAction.reason} Me ajude a começar com uma atividade curta e explique como você usou esse dado, sem presumir outras dificuldades.` } })
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

  if (loading) return <RouteLoading />
  if (planError && !returnSuggestion && !resume && !priority) return <main className="dash-v2"><section className="daily-adjust" role="alert"><h1>Seu plano continua salvo.</h1><p>Não conseguimos consultá-lo agora. Tente carregar novamente para continuar.</p><button type="button" className="study-button" onClick={() => { setLoading(true); reloadPlan().catch(() => setPlanError(true)).finally(() => setLoading(false)) }}>Tentar novamente</button></section></main>
  const firstStudy = resumeStatus === 'ready' && returnsStatus==='ready' && !returnSuggestion && user?.tipo === 'aluno' && !resume && !data.schedules.length && data.learning && !weeklyMinutes && !reviews && !data.learning.errosPendentes && !data.learning.porDisciplina?.length && !data.evolution.length
  const welcome=todayWelcome({firstStudy,resume,lastVisit})
  const otherWays = <details className="today-alternatives"><summary>Outras maneiras de continuar<span>Registros, cartões e projetos</span></summary><div className="today-shortcut-links">{user?.tipo === 'aluno' && <button type="button" onClick={() => navigate('/sessao-guiada')}>Montar sessão guiada</button>}<button type="button" onClick={() => navigate('/cronograma')}>Ver cronograma <b>→</b></button></div><TodayPreparation/>{!firstStudy && <>
      <StudyReturns data={returns} status={returnsStatus} onRetry={()=>setReturnsAttempt(n=>n+1)} onOpen={openReturn} onDone={finishReturn} busy={openingReturn}/>
      </>}<TodayQuickReview/></details>

  return <main className="dash-v2">
    <div className="dash-v2-wrap">
      <header className="dash-v2-heading" data-moment={welcome.kind}>
        <div><p className="today-date">{date}</p><h1>{greeting()}, {name}.</h1><p>{welcome.text}</p></div>
      </header>
      {planError && <div role="alert" className="study-return-note"><p>O cronograma não pôde ser consultado. Você ainda pode retomar os registros confirmados abaixo.</p><button type="button" onClick={()=>reloadPlan().catch(()=>setPlanError(true))}>Consultar cronograma novamente</button></div>}

      {resumeStatus !== 'ready' && <div className="study-return-note" role="status"><p>{resumeStatus === 'loading' ? 'Conferindo onde você parou…' : 'Não conseguimos consultar sua última sessão. Seu histórico não foi apagado.'}</p>{resumeStatus === 'error' && <button type="button" onClick={reloadResume}>Consultar minha retomada</button>}</div>}
      <section className="dash-v2-spotlight">
        <article className="dash-v2-focus">
          <div className="dash-v2-focus-top"><span>SEU PRÓXIMO PASSO</span><small>{nextAction.subject}</small></div>
          <div className="dash-v2-focus-copy"><h2>{nextAction.title}</h2><p className="dash-v2-reason"><strong>Por quê?</strong> {nextAction.reason}</p>{nextAction.duration && <div><span>{nextAction.duration}</span></div>}</div>
          {nextAction.entry?.texto && <p className="study-return-reminder">{nextAction.entry.texto}</p>}
          <footer><button type="button" disabled={(nextAction.kind === 'lesson' && resumeStatus !== 'ready') || (nextAction.kind==='return' && openingReturn)} onClick={openNextAction}>{nextAction.label} <b>→</b></button>{['resume', 'lesson'].includes(nextAction.kind) && resumeStatus === 'ready' ? <button type="button" className="dash-v2-lumi-action" onClick={openShortReturn}>Retomar por 5 minutos</button> : <button type="button" className="dash-v2-lumi-action" onClick={askLumiAboutNextAction}>Planejar com a Lumi</button>}</footer>
          {['resume', 'lesson'].includes(nextAction.kind) && <div className="study-return-note"><p>Um conteúdo de cada vez. {pendingContents} {pendingContents === 1 ? 'pendente no plano' : 'pendentes no plano'}.</p></div>}

          {nextAction.kind === 'lesson' && <button type="button" className="today-text-action" onClick={() => navigate('/cronograma')}>Ver cronograma completo</button>}
        </article>


      </section>

      {priority && <section className="today-overview-panel today-priority" aria-labelledby="today-priority">
        <h2 id="today-priority">Atividade prioritária</h2>
        <h3>{priority.titulo}</h3>
        <p>{[priority.disciplina, priority.turma].filter(Boolean).join(' · ') || 'Atividade publicada'}</p>
        <p>{priority.prazo
          ? `${priority.atrasada ? 'Atrasada' : 'Prazo mais próximo'} · ${new Date(priority.prazo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' })}`
          : 'Atividade pendente sem prazo definido.'}</p>
        <button className="today-text-action" type="button" onClick={() => navigate('/minhas-atividades', { state: { atividadeId: priority.id_atividade } })}>Abrir atividade</button>
      </section>}
      <div className="today-overview">
        <section className="today-overview-panel" aria-labelledby="today-week-title">
          <h2 id="today-week-title">Sua semana</h2>
          <ol className="today-week-days">
            {week.map(({ date: key, entries }) => {
              const label = new Date(`${key}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'short' })
              const planned = entries.length > 0
              const status = planError ? 'A consultar' : planned ? 'Com plano' : 'Sem plano'
              return <li key={key} aria-current={key === today ? 'date' : undefined}><span>{label} {key.slice(-2)}</span><small>{status}</small></li>
            })}
          </ol>
          <p>{planError ? 'O planejamento está indisponível.' : !schedule ? 'Seu planejamento ainda não foi configurado.' : !days.length ? 'O cronograma ativo ainda não tem dias disponíveis.' : 'Confira o cronograma para ver os conteúdos e horários de cada dia.'}</p>
          <button type="button" className="today-text-action" onClick={() => navigate(!schedule && !planError && !perfilCompleto ? '/onboarding' : '/cronograma')}>{schedule || planError ? 'Abrir cronograma' : 'Criar cronograma'}</button>
        </section>
        <section className="today-overview-panel" aria-labelledby="today-review-title">
          <h2 id="today-review-title">Revisões</h2>
          <p>{!data.learning ? 'Fila de revisões a consultar.' : reviews ? `${reviews} ${reviews === 1 ? 'revisão pendente' : 'revisões pendentes'}` : hasLearningHistory ? 'Revisões em dia' : 'As revisões aparecem conforme você avança nos estudos.'}</p>
          {reviews > 0 && firstReview?.titulo && <p>Próxima revisão: {firstReview.titulo}</p>}
          <button type="button" className="today-text-action" onClick={() => navigate('/aprendizagem', { state: { aba: 'revisoes' } })}>{reviews ? 'Abrir revisões' : 'Ver aprendizagem'}</button>
        </section>
      </div>
      <DailyPlanActions schedules={data.schedules} onSaved={reloadPlan} />
      <section className="today-continuity" aria-labelledby="today-continuity-title">
        <h2 id="today-continuity-title">Continue de onde parou</h2>
        <div className="today-shortcut-links">
          <button type="button" onClick={() => navigate('/mesa')}>Minha mesa</button>
          <button type="button" onClick={() => navigate('/aprendizagem')}>Praticar e revisar</button>
          <button type="button" onClick={() => navigate('/lumi')}>Lumi</button>
        </div>
        {otherWays}
      </section>
      {firstStudy && <FirstStudySteps prepared={perfilCompleto} />}

      {!firstStudy && <details className="today-details"><summary>Ver detalhes do meu dia <span>{learningFailed ? 'Progresso indisponível · abrir para tentar novamente' : 'Meta da semana, roteiro e progresso'}</span></summary>
        <aside className="dash-v2-score">
          {learningFailed ? <RecoveryState title="Seu progresso não pôde ser consultado." onRetry={reloadLearning} busy={retryingLearning}>O estudo pode continuar. Tente consultar novamente para recuperar sua meta e os minutos registrados.</RecoveryState> : !data.learning ? <RouteLoading embedded label="Consultando seu progresso…" /> : <>
          <div className="dash-v2-score-head"><span>META DA SEMANA</span><button type="button" onClick={() => { setGoalDraft(String(weeklyGoal)); setEditingGoal(!editingGoal) }} aria-expanded={editingGoal}>{editingGoal ? 'Fechar' : 'Editar meta'} <span aria-hidden="true">↗</span></button></div>
          <div className="dash-v2-score-main">
            <div className="dash-v2-ring" style={{ '--score': `${weeklyProgress * 3.6}deg` }} aria-hidden="true"><span><strong>{weeklyProgress}%</strong><small>concluído</small></span></div>
            <div className="dash-v2-score-copy"><h2><strong>{weeklyMinutes}</strong><span>min estudados</span></h2><p>de {weeklyGoal} min planejados</p></div>
          </div>
          <div className="dash-v2-score-progress" role="progressbar" aria-label="Progresso da meta semanal" aria-valuemin="0" aria-valuemax="100" aria-valuenow={weeklyProgress}><span style={{ width: `${weeklyProgress}%` }} /></div>
          <p className="dash-v2-score-message">{remainingMinutes === 0 ? 'Meta cumprida! Seu esforço desta semana já passou do planejado.' : weeklyMinutes === 0 ? `Faltam ${remainingMinutes} min. Que tal começar com uma sessão hoje?` : `Faltam ${remainingMinutes} min para fechar sua meta da semana.`}</p>
          {editingGoal && <form className="dash-v2-score-form" onSubmit={updateWeeklyGoal}><label htmlFor="weekly-goal">Nova meta semanal <span>(30 a 1680 min)</span></label><div><input id="weekly-goal" type="number" min="30" max="1680" step="1" value={goalDraft} onChange={(event) => setGoalDraft(event.target.value)} required /><button type="submit" disabled={savingGoal}>{savingGoal ? 'Salvando…' : 'Salvar'}</button></div></form>}</>}
        </aside>
      {data.learning && !learningFailed && <LearningSignals summary={data.learning} reviews={data.reviews} evolution={data.evolution} />}

      <section className="dash-v2-content">
        <article className="dash-v2-agenda">
          <header><div><span>ROTEIRO RECOMENDADO</span><h2>{todayDay ? 'Sua mesa de hoje' : 'Prepare o próximo estudo'}</h2></div><button type="button" onClick={() => navigate('/cronograma')}>Abrir semana</button></header>
          <div>{agenda.map((item, index) => <button type="button" key={item.id || index} onClick={() => start(item, todayDay || nextDay)} data-done={done(item)}><i>{done(item) ? '✓' : String(index + 1).padStart(2, '0')}</i><span><b>{item.titulo || 'Conteúdo de estudo'}</b><small>{item.disciplina || item.area || 'Geral'} · {item.tipo || 'Material'}</small></span><em>→</em></button>)}{!agenda.length && <div className="dash-v2-empty"><b>Nenhuma sessão pendente.</b><p>Crie um cronograma ou aproveite para revisar.</p></div>}</div>
        </article>

        <aside className="dash-v2-insights">
          <article className="dash-v2-coach"><span>ORIENTAÇÃO DO PLANEJAI</span><h2>{data.learning?.porDisciplina?.[0] ? `Dê atenção a ${data.learning.porDisciplina[0].disciplina}` : reviews ? 'Uma revisão curta cabe agora' : 'Gere evidências do que aprendeu'}</h2><p>Questões e revisões alimentam seu mapa e tornam as próximas recomendações mais precisas.</p><button onClick={() => navigate('/aprendizagem')}>Treinar agora <b>→</b></button></article>
          {days.length > 0 && <p>{completed} de {days.length} dias do plano concluídos.</p>}
          {(isAdmin || isDono || user?.tipo === 'docente') && <button type="button" className="dash-v2-manager" onClick={() => navigate(isDono ? '/dono' : '/dashboard-gestor')}>Acessar central de gestão <span>↗</span></button>}
        </aside>
      </section></details>}
    </div>
  </main>
}
