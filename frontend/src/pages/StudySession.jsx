import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import { resolveProtectedAsset } from '../services/fileService'
import StudyGuide, { isExternalStudySource } from '../components/StudyGuide'
import DictationButton from '../components/DictationButton'
import ChatInterface from '../components/ChatInterface'
import TutorLumi from '../components/TutorLumi'
import './Chat.css'
import './StudySession.css'
import useStudyNotes from '../hooks/useStudyNotes'
import SaveFeedback from '../components/SaveFeedback'

const SESSION_CONTENT_KEY = 'planejai:active-study-content'

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

function urlParaIncorporar(value) {
  try {
    const url = new window.URL(value)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    if (host.endsWith('youtube.com')) {
      const videoId = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`
    }
    if (host.endsWith('vimeo.com')) {
      const videoId = url.pathname.match(/\/(\d+)/)?.[1]
      if (videoId) return `https://player.vimeo.com/video/${videoId}`
    }
    return url.href
  } catch { return value }
}

function StudyMaterial({ content }) {
  const source = content?.link || content?.url || ''
  const [url, setUrl] = useState('')
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    let active = true
    resolveProtectedAsset(source).then((value) => active && setUrl(value)).catch(() => active && setLoadError('Não foi possível autorizar este arquivo.'))
    return () => { active = false }
  }, [source])
  const type = String(content?.tipo || '').toUpperCase()
  const externalSource = isExternalStudySource(url)
  const pdf = type.includes('PDF') || /\.pdf(?:$|[?#])/i.test(url)
  const video = type.includes('VIDEO') && /\.(mp4|webm|ogg)(?:$|[?#])/i.test(url)

  if (loadError) return <div className="session-no-material" role="alert"><span>ACESSO INDISPONÍVEL</span><h2>{loadError}</h2></div>
  if (!source) return <StudyGuide material={content} />
  if (!url) return <div className="session-no-material" role="status"><span>CARREGANDO</span><h2>Preparando material…</h2></div>
  if (externalSource) return <div className="session-embedded-source"><iframe className="session-frame" src={urlParaIncorporar(url)} title={`Material: ${content.titulo || 'fonte principal'}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><a href={url} target="_blank" rel="noopener noreferrer">Se o material não aparecer, abrir em nova aba ↗</a></div>
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
  const [tab, setTab] = useState('guide')
  const [finishing, setFinishing] = useState(false)
  const [difficulty, setDifficulty] = useState('LEMBREI')
  const startedAt = useRef(Date.now())

  const { notes, setNotes, status: noteStatus, retry: retryNotes, loading: loadingNotes, flush: flushNotes } = useStudyNotes(content?.id_conteudo, content?.id)
  useEffect(() => {
    if (content) window.sessionStorage.setItem(SESSION_CONTENT_KEY, JSON.stringify({ conteudo: content, dia: day }))
  }, [content, day])

  async function finish() {
    if (!content) return
    setFinishing(true)
    const minutes = Math.max(1, Math.round((Date.now() - startedAt.current) / 60000))
    try {
      const noteResult = await flushNotes()
      if (!noteResult.confirmed && !noteResult.local && !noteResult.unchanged) {
        toast.error('Não conseguimos proteger suas anotações. Mantenha a sessão aberta e tente salvar novamente.')
        return
      }
      if (content.id && !Number(content.concluido)) await cronogramaService.concluirConteudo(content.id)
      if (content.id_conteudo) {
        await aprendizagemService.adicionarRevisao(content.id_conteudo)
        await aprendizagemService.avaliarRevisao(content.id_conteudo, difficulty)
      }
      const sessionResult = await aprendizagemService.registrarSessao({ idConteudo: content.id_conteudo, minutos: minutes, resultado: difficulty })
      saveStudyHistory(content, minutes, difficulty)
      if (sessionResult?.offline || sessionResult?.queued) toast('O registro desta sessão ficou na fila deste aparelho e será enviado quando a conexão voltar.')
      else toast.success('Sessão concluída e próxima revisão agendada.')
      if (!noteResult.confirmed && !noteResult.unchanged) toast('As anotações ficaram apenas neste aparelho. Reabra este conteúdo para tentar enviá-las à sua conta.')
      navigate('/inicio')
    } catch {
      saveStudyHistory(content, minutes, difficulty)
      toast.error('A sessão ficou salva neste aparelho, mas o servidor não confirmou a conclusão.')
    } finally { setFinishing(false) }
  }

  if (!content) return <main className="pj-page"><div className="session-missing pj-panel"><span className="pj-eyebrow">Sala de estudo</span><h1>Nenhum conteúdo foi escolhido.</h1><p>Abra o cronograma e escolha “Começar sessão” em um dos materiais.</p><button className="pj-button pj-button--primary" onClick={() => navigate('/cronograma')}>Ir ao cronograma</button></div></main>

  const materialUrl = content.link || content.url || ''
  const estudoAtual = { titulo: content.titulo || 'Este conteúdo', disciplina: content.disciplina || content.area || '', data: day?.data_estudo ? String(day.data_estudo).slice(0, 10) : '' }

  return <main className="session-page pj-page">
    <div className="pj-wrap">
      <header className="session-topbar student-page-heading">
        <button type="button" className="session-back" onClick={() => navigate(-1)}>← Voltar</button>
        <div><span className="pj-eyebrow">PlanejAI / Sala de estudo</span><h1>{content.titulo || 'Sessão de estudo'}</h1><p>{content.disciplina || content.area || 'Geral'} {day?.data_estudo ? `· ${new Date(`${String(day.data_estudo).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</p></div>
        <button type="button" className="pj-button pj-button--primary" disabled={finishing || loadingNotes} onClick={finish}>{finishing ? 'Salvando…' : 'Concluir sessão'}</button>
      </header>

      <section className="session-layout">
        <div className="session-workspace pj-panel">
          <nav className="session-tabs" aria-label="Ferramentas da sessão"><button className={tab === 'guide' ? 'is-active' : ''} onClick={() => setTab('guide')}>Guia de estudo</button><button className={tab === 'material' ? 'is-active' : ''} onClick={() => setTab('material')}>{materialUrl ? 'Fonte principal' : 'Material'}</button><button className={tab === 'notes' ? 'is-active' : ''} onClick={() => setTab('notes')}>Anotações <span>{noteStatus === 'saved' ? 'na conta' : noteStatus === 'local' ? 'neste aparelho' : ''}</span></button></nav>
          <div className="session-canvas">
            {tab === 'material' ? <StudyMaterial content={content} /> : tab === 'guide' ? <div className="session-guide-wrap"><StudyGuide material={content} sourceUrl={isExternalStudySource(materialUrl) ? materialUrl : undefined} /></div> : <div className="session-notes">
              <header className="session-notes-header"><div><span className="pj-eyebrow">CADERNO DA SESSÃO</span><h2>Organize suas ideias.</h2><p>Anote o que entendeu e o que quer perguntar à Lumi.</p></div><div className="session-notes-tools"><SaveFeedback status={noteStatus} onRetry={retryNotes} /><DictationButton onText={(texto) => setNotes((atual) => `${atual}${atual ? '\n' : ''}${texto}`)}/></div></header>
              <div className="session-note-prompts"><span>ESTRUTURE SUA REVISÃO</span><div><button type="button" onClick={() => setNotes((atual) => `${atual}${atual ? '\n\n' : ''}Ideia principal\n`)}>+ Ideia principal</button><button type="button" onClick={() => setNotes((atual) => `${atual}${atual ? '\n\n' : ''}Minha dúvida\n`)}>+ Minha dúvida</button><button type="button" onClick={() => setNotes((atual) => `${atual}${atual ? '\n\n' : ''}Exemplo próprio\n`)}>+ Exemplo próprio</button></div></div>
              <label className="session-notes-editor"><span className="sr-only">Anotações da sessão</span><textarea disabled={loadingNotes} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Escreva com suas palavras…\n\nO que ficou claro? O que ainda precisa de outra explicação?" /><small>{notes.length} caracteres</small></label>
            </div>}
          </div>
        </div>

        <aside className="session-tools">
          <article className="session-lumi pj-panel"><header><TutorLumi tamanho={32} rotulo="Lumi"/><div><span className="pj-eyebrow">APRENDA COM A LUMI</span><h2>Vamos dar sentido ao tema.</h2><p>Outra explicação, um exemplo ou uma pergunta para praticar.</p></div></header><ChatInterface className="session-lumi-chat" compacto estudoAtual={estudoAtual}/></article>
          <article className="session-check pj-panel"><span className="pj-eyebrow">Antes de sair</span><h2>Como esse conteúdo ficou?</h2><p>Sua resposta define quando ele volta para revisão.</p><div>{[['DIFICIL','Ainda difícil'],['LEMBREI','Entendi'],['DOMINEI','Consigo explicar']].map(([value,label]) => <button type="button" key={value} className={difficulty === value ? 'is-active' : ''} onClick={() => setDifficulty(value)}>{label}</button>)}</div></article>
        </aside>
      </section>
    </div>
  </main>
}
