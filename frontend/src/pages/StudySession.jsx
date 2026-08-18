import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import { resolveBackendAsset } from '../config/api'
import './StudySession.css'

const SESSION_CONTENT_KEY = 'planejai:active-study-content'

function getYoutubeEmbed(url) {
  try {
    const parsed = new URL(url)
    let id = parsed.hostname.includes('youtu.be') ? parsed.pathname.split('/').filter(Boolean)[0] : parsed.searchParams.get('v')
    if (!id && parsed.pathname.includes('/embed/')) id = parsed.pathname.split('/embed/')[1]?.split('/')[0]
    if (!id && parsed.pathname.includes('/shorts/')) id = parsed.pathname.split('/shorts/')[1]?.split('/')[0]
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
  } catch { return '' }
}

function fmt(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function loadSavedContent() {
  try { return JSON.parse(window.sessionStorage.getItem(SESSION_CONTENT_KEY) || 'null') } catch { return null }
}

function saveStudyHistory(content, minutes, difficulty) {
  try {
    const list = JSON.parse(localStorage.getItem('planejai:study-sessions') || '[]')
    list.unshift({ id: content.id, idConteudo: content.id_conteudo, title: content.titulo, minutes, difficulty, finishedAt: new Date().toISOString() })
    localStorage.setItem('planejai:study-sessions', JSON.stringify(list.slice(0, 90)))
  } catch { /* histórico local é complementar */ }
}

function StudyMaterial({ content }) {
  const url = resolveBackendAsset(content?.link || content?.url || '')
  const type = String(content?.tipo || '').toUpperCase()
  const youtube = getYoutubeEmbed(url)
  const pdf = type.includes('PDF') || /\.pdf(?:$|[?#])/i.test(url)
  const video = type.includes('VIDEO') && /\.(mp4|webm|ogg)(?:$|[?#])/i.test(url)

  if (!url) return <div className="session-no-material"><span>SEM ANEXO</span><h2>Use esta sessão para estudar pelo seu próprio material.</h2><p>As anotações e o tempo ainda serão salvos neste navegador.</p></div>
  if (youtube) return <iframe className="session-frame" src={youtube} title={content.titulo} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
  if (video) return <video className="session-frame" src={url} controls />
  if (pdf) return <iframe className="session-frame" src={`${url}#view=FitH&toolbar=1`} title={content.titulo} />
  return <iframe className="session-frame" src={url} title={content.titulo} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
}

export default function StudySession() {
  const location = useLocation()
  const navigate = useNavigate()
  const initial = location.state?.conteudo ? { conteudo: location.state.conteudo, dia: location.state.dia } : loadSavedContent()
  const [content] = useState(initial?.conteudo || null)
  const [day] = useState(initial?.dia || null)
  const [tab, setTab] = useState('material')
  const [notes, setNotes] = useState('')
  const [saved, setSaved] = useState(null)
  const [seconds, setSeconds] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [finishing, setFinishing] = useState(false)
  const [difficulty, setDifficulty] = useState('LEMBREI')
  const startedAt = useRef(Date.now())
  const noteKey = useMemo(() => `planejai:study-note:${content?.id_conteudo || content?.id || 'free'}`, [content])

  useEffect(() => {
    if (!content) return
    window.sessionStorage.setItem(SESSION_CONTENT_KEY, JSON.stringify({ conteudo: content, dia: day }))
    setNotes(localStorage.getItem(noteKey) || '')
  }, [content, day, noteKey])

  useEffect(() => {
    if (!running) return undefined
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer); setRunning(false); toast.success('Ciclo de foco concluído. Faça uma pausa curta.'); return 0
        }
        return value - 1
      })
      setElapsed((value) => value + 1)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(noteKey, notes)
      setSaved(new Date())
    }, 500)
    return () => window.clearTimeout(timer)
  }, [notes, noteKey])

  function selectCycle(minutes) { setRunning(false); setSeconds(minutes * 60) }

  async function finish() {
    if (!content) return
    setFinishing(true)
    const minutes = Math.max(1, Math.round(Math.max(elapsed, (Date.now() - startedAt.current) / 1000) / 60))
    try {
      if (content.id && !Number(content.concluido)) await cronogramaService.concluirConteudo(content.id)
      if (content.id_conteudo) {
        await aprendizagemService.adicionarRevisao(content.id_conteudo)
        await aprendizagemService.avaliarRevisao(content.id_conteudo, difficulty)
      }
      saveStudyHistory(content, minutes, difficulty)
      toast.success('Sessão concluída e próxima revisão agendada.')
      navigate('/inicio')
    } catch {
      saveStudyHistory(content, minutes, difficulty)
      toast.error('A sessão ficou salva neste aparelho, mas o servidor não confirmou a conclusão.')
    } finally { setFinishing(false) }
  }

  if (!content) return <main className="pj-page"><div className="session-missing pj-panel"><span className="pj-eyebrow">Sala de estudo</span><h1>Nenhum conteúdo foi escolhido.</h1><p>Abra o cronograma e escolha “Começar sessão” em um dos materiais.</p><button className="pj-button pj-button--primary" onClick={() => navigate('/cronograma')}>Ir ao cronograma</button></div></main>

  return <main className="session-page pj-page">
    <div className="pj-wrap">
      <header className="session-topbar">
        <button type="button" className="session-back" onClick={() => navigate(-1)}>← Voltar</button>
        <div><span className="pj-eyebrow">PlanejAI / Sala de estudo</span><h1>{content.titulo || 'Sessão de estudo'}</h1><p>{content.disciplina || content.area || 'Geral'} {day?.data_estudo ? `· ${new Date(`${String(day.data_estudo).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</p></div>
        <button type="button" className="pj-button pj-button--primary" disabled={finishing} onClick={finish}>{finishing ? 'Salvando…' : 'Concluir sessão'}</button>
      </header>

      <section className="session-layout">
        <div className="session-workspace pj-panel">
          <nav className="session-tabs" aria-label="Ferramentas da sessão"><button className={tab === 'material' ? 'is-active' : ''} onClick={() => setTab('material')}>Material</button><button className={tab === 'notes' ? 'is-active' : ''} onClick={() => setTab('notes')}>Anotações <span>{saved ? 'salvas' : ''}</span></button></nav>
          <div className="session-canvas">
            {tab === 'material' ? <StudyMaterial content={content} /> : <div className="session-notes"><header><div><span className="pj-eyebrow">Caderno da sessão</span><h2>Escreva para entender.</h2></div><small>{saved ? `Salvo às ${saved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Salvamento automático'}</small></header><textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={'Ideia principal:\n\nO que ainda não entendi:\n\nComo eu explicaria isso para alguém:'} /></div>}
          </div>
        </div>

        <aside className="session-tools">
          <article className="session-timer pj-panel"><span className="pj-eyebrow">Ciclo de foco</span><strong>{fmt(seconds)}</strong><p>{running ? 'Agora: apenas esta tarefa.' : 'Escolha um ritmo possível.'}</p><div>{[25,50,5].map((minutes) => <button key={minutes} onClick={() => selectCycle(minutes)}>{minutes === 5 ? 'Pausa 5' : `${minutes} min`}</button>)}</div><button className="pj-button pj-button--primary" onClick={() => setRunning((value) => !value)}>{running ? 'Pausar' : seconds === 0 ? 'Recomeçar' : 'Iniciar foco'}</button></article>
          <article className="session-check pj-panel"><span className="pj-eyebrow">Antes de sair</span><h2>Como esse conteúdo ficou?</h2><p>Sua resposta define quando ele volta para revisão.</p><div>{[['DIFICIL','Ainda difícil'],['LEMBREI','Entendi'],['DOMINEI','Consigo explicar']].map(([value,label]) => <button type="button" key={value} className={difficulty === value ? 'is-active' : ''} onClick={() => setDifficulty(value)}>{label}</button>)}</div></article>
          <article className="session-audio-note"><span>♫</span><div><b>Trilha de foco</b><small>O player do Spotify pode ser arrastado pela alça ⠿.</small></div></article>
        </aside>
      </section>
    </div>
  </main>
}
