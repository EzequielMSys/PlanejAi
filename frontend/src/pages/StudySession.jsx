import AreaSignature from '../components/AreaSignature'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import cronogramaService from '../services/cronogramaService'
import aprendizagemService from '../services/aprendizagemService'
import { resolveProtectedAsset } from '../services/fileService'
import StudyGuide, { isExternalStudySource } from '../components/StudyGuide'
import DictationButton from '../components/DictationButton'
import TutorLumi from '../components/TutorLumi'
import './Chat.css'
import './StudySession.css'
import useStudyNotes from '../hooks/useStudyNotes'
import SaveFeedback from '../components/SaveFeedback'
import continuity from '../services/studyContinuityService'
import { scopedCacheKey } from '../utils/offlineStore'
import RouteLoading from '../components/RouteLoading'
import '../components/StudyRecommendations.css'
import { downloadTextCopy } from '../utils/downloadTextCopy'
import './StudyDesk.css'
import { hasUnsafeJournalDraft, hasPendingJournalDraft } from '../utils/journalDrafts'
import LearningJournalFallback from '../components/LearningJournalFallback'

function TutorUnavailable() {
  return <p className="study-desk-loading" role="alert">Não foi possível carregar a Lumi. Você pode continuar lendo e anotando. Depois de preservar seus textos, reabra a página para tentar novamente.</p>
}
const ChatInterface = lazy(() => import('../components/ChatInterface').catch(() => ({default:TutorUnavailable})))
const LearningJournal = lazy(() => import('../components/LearningJournal').catch(() => ({default:LearningJournalFallback})))
const StudyConnections = lazy(() => import('../components/StudyConnections').catch(() => ({default:()=>null})))
const sessionKey = () => scopedCacheKey('active-study-content')

function loadSavedContent() {
  try { return JSON.parse(window.sessionStorage.getItem(sessionKey()) || 'null') } catch { return null }
}

function saveStudyHistory(content, minutes, difficulty) {
  try {
    const list = JSON.parse(localStorage.getItem(scopedCacheKey('study-sessions')) || '[]')
    list.unshift({ id: content.id, idConteudo: content.id_conteudo, title: content.titulo, minutes, difficulty, finishedAt: new Date().toISOString() })
    localStorage.setItem(scopedCacheKey('study-sessions'), JSON.stringify(list.slice(0, 90)))
  } catch { /* histórico local é complementar */ }
}

function urlParaIncorporar(value) {
  try {
    const url = new window.URL(value)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`
    if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      const videoId = url.searchParams.get('v') || url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1]
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`
    }
    if (host === 'vimeo.com' || host.endsWith('.vimeo.com')) {
      const videoId = url.pathname.match(/\/(\d+)/)?.[1]
      if (videoId) return `https://player.vimeo.com/video/${videoId}`
    }
    return url.href
  } catch { return value }
}

function StudyMaterial({ content, onTutorRequest }) {
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
  if (!source) return <div className="session-guide-wrap"><StudyGuide material={content} onTutorRequest={onTutorRequest} /></div>
  if (!url) return <div className="session-no-material" role="status"><span>CARREGANDO</span><h2>Preparando material…</h2></div>
  if (externalSource) {
    const embedded = urlParaIncorporar(url)
    if (/^https:\/\/(?:www\.youtube-nocookie\.com\/embed\/|player\.vimeo\.com\/video\/)/.test(embedded)) return <div className="session-embedded-source"><iframe className="session-frame" src={embedded} title={`Material: ${content.titulo || 'fonte principal'}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" /><a href={url} target="_blank" rel="noopener noreferrer">Abrir vídeo na fonte original ↗</a></div>
    return <div className="session-guide-wrap"><div className="study-guide study-guide-sources"><span>FONTE EXTERNA</span><h2>{content.titulo || 'Material da sessão'}</h2><p>Este material está em {new URL(url).hostname}. Abra a leitura em outra aba e volte para registrar sua tentativa.</p><a href={url} target="_blank" rel="noopener noreferrer">Abrir material na fonte original ↗</a></div><StudyGuide material={content} onTutorRequest={onTutorRequest} sourceUrl={url} /></div>
  }
  if (video) return <video className="session-frame" src={url} controls />
  if (pdf) return <iframe className="session-frame" src={`${url}#view=FitH&toolbar=1`} title={content.titulo} />
  return <iframe className="session-frame" src={url} title={content.titulo} sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
}

export default function StudySession() {
  const location = useLocation()
  const navigate = useNavigate()
  const initial = location.state?.conteudo ? { conteudo: location.state.conteudo, dia: location.state.dia } : loadSavedContent()
  const [content, setContent] = useState(initial?.conteudo || null)
  const [day, setDay] = useState(initial?.dia || null)
  const [shortReturn, setShortReturn] = useState(Boolean(location.state?.retomadaCurta))
  const [resuming, setResuming] = useState(!initial?.conteudo)
  const [resumeError, setResumeError] = useState(false)
  const [continuityStatus, setContinuityStatus] = useState('ready')
  useEffect(() => {
    if (initial?.conteudo) return
    let active = true
    continuity.current().then(saved => { if (active && saved?.conteudo) { setContent(saved.conteudo); setDay(saved.dia) } }).catch(() => { if (active) setResumeError(true) }).finally(() => { if (active) setResuming(false) })
    return () => { active = false }
  }, [])
  const [tab, setTab] = useState(location.state?.ferramenta === 'notes' ? 'notes' : 'guide')
  const [finishing, setFinishing] = useState(false)
  const [difficulty, setDifficulty] = useState('LEMBREI')
  const [praticaAtual, setPraticaAtual] = useState(null)
  const [readingMode, setReadingMode] = useState(false)
  const [lumiOpen, setLumiOpen] = useState(false)
  const [lumiVisited, setLumiVisited] = useState(false)
  const lumiRef = useRef(null)
  useEffect(() => { if (praticaAtual) { lumiRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); lumiRef.current?.querySelector('button')?.focus({preventScroll:true}) } }, [praticaAtual])
  const pensarComLumi = pratica => { setReadingMode(false); setLumiOpen(true); setLumiVisited(true); setPraticaAtual({ ...pratica, id: Date.now() + Math.random() }) }
  const toggleLumi = () => { setLumiOpen(value => !value); setLumiVisited(true) }
  const openLumi = () => { setReadingMode(false); setLumiOpen(true); setLumiVisited(true); requestAnimationFrame(() => { lumiRef.current?.scrollIntoView({block:'start',behavior:'auto'}); lumiRef.current?.querySelector('button')?.focus({preventScroll:true}) }) }
  const startedAt = useRef(Date.now())

  const { notes, setNotes, status: noteStatus, retry: retryNotes, loading: loadingNotes, flush: flushNotes } = useStudyNotes(content?.id_conteudo, content?.id)
  function recordConnection(connection) {
    const marker=`Conexão de estudo: ${connection.fromTitle} → ${connection.toTitle}`
    setNotes(value=>value.includes(marker) ? value : `${value}${value?'\n\n':''}${marker}\n${connection.why}\n\nPergunta: ${connection.question}\nMinha explicação:\n`)
    setTab('notes')
    requestAnimationFrame(()=>document.querySelector('.session-notes textarea')?.focus())
  }
  useEffect(() => {
    if (!content) return
    try { window.sessionStorage.setItem(sessionKey(), JSON.stringify({ conteudo: content, dia: day })) } catch { /* A conta ainda pode confirmar a retomada. */ }
    if (!content.id) return
    let active = true
    setContinuityStatus('saving')
    continuity.save(content.id).then(() => { if (active) setContinuityStatus('saved') }).catch(() => { if (active) setContinuityStatus('local') })
    return () => { active = false }
  }, [content, day])

  async function finish() {
    if (!content) return
    if (hasUnsafeJournalDraft()) {
      toast.error('Uma explicação ou dúvida está sem cópia local. Salve na conta ou baixe o rascunho antes de concluir.')
      return
    }
    if (hasPendingJournalDraft(content.id_conteudo)) {
      toast.error('Você começou uma explicação ou dúvida deste conteúdo. Salve na conta ou descarte o rascunho antes de concluir.')
      return
    }
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
      try { window.sessionStorage.removeItem(sessionKey()) } catch { /* Complemento local. */ }
      continuity.clear(content.id).catch(() => {})
      navigate('/inicio')
    } catch {
      saveStudyHistory(content, minutes, difficulty)
      toast.error('A sessão ficou salva neste aparelho, mas o servidor não confirmou a conclusão.')
    } finally { setFinishing(false) }
  }

  if (resuming) return <RouteLoading label="Buscando sua sessão em andamento…" />
  if (!content) return <main className="pj-page"><div className="session-missing pj-panel"><span className="pj-eyebrow">Sala de estudo</span><h1>{resumeError ? 'Não conseguimos consultar sua sessão.' : 'Nenhum conteúdo foi escolhido.'}</h1><p>Seu progresso continua na conta. Escolha um conteúdo no cronograma para estudar.</p>{resumeError && <button type="button" onClick={() => window.location.reload()}>Tentar novamente</button>}<button className="pj-button pj-button--primary" onClick={() => navigate('/cronograma')}>Ir ao cronograma</button></div></main>

  const materialUrl = content.link || content.url || ''
  const estudoAtual = { titulo: content.titulo || 'Este conteúdo', disciplina: content.disciplina || content.area || '', data: day?.data_estudo ? String(day.data_estudo).slice(0, 10) : '' }

  return <main className={`session-page pj-page study-desk${readingMode ? ' is-reading-mode' : ''}`}>
    <div className="pj-wrap">
      <AreaSignature area="study"/>
      {noteStatus === 'unavailable' && tab !== 'notes' && <SaveFeedback status={noteStatus} onRetry={retryNotes} />}
      <header className="session-topbar student-page-heading">
        <button type="button" className="session-back" onClick={() => navigate(-1)}>← Voltar</button>
        <div><span className="pj-eyebrow">PlanejAI / Sala de estudo</span><h1>{content.titulo || 'Sessão de estudo'}</h1><p>{content.disciplina || content.area || 'Geral'} {day?.data_estudo ? `· ${new Date(`${String(day.data_estudo).slice(0,10)}T12:00:00`).toLocaleDateString('pt-BR')}` : ''}</p></div>
        <div className="study-desk-actions"><button type="button" aria-pressed={readingMode} onClick={() => setReadingMode(value => !value)}>{readingMode ? 'Sair do modo leitura' : 'Modo leitura'}</button><button type="button" aria-controls="study-desk-lumi-body" onClick={openLumi}>Abrir Lumi</button><button type="button" className="pj-button pj-button--primary" disabled={finishing || loadingNotes} onClick={finish}>{finishing ? 'Salvando…' : 'Concluir sessão'}</button></div>
      </header>
      <div className="study-desk-context"><p><span className="study-desk-dot" aria-hidden="true" />Um conteúdo de cada vez. Leia, experimente e registre o que fez sentido.</p>{content.id && <SaveFeedback status={continuityStatus} message={continuityStatus === 'saved' ? 'Retomada desta sessão salva na sua conta. Você pode continuar em outro aparelho.' : continuityStatus === 'local' ? 'A retomada em outro aparelho ainda não foi confirmada. Suas anotações têm um aviso próprio de salvamento.' : 'Confirmando a retomada na sua conta…'} onRetry={() => { setContinuityStatus('saving'); continuity.save(content.id).then(() => setContinuityStatus('saved')).catch(() => setContinuityStatus('local')) }} />}</div>

      {shortReturn && <section className="study-short-return" aria-labelledby="short-return-title"><h2 id="short-return-title">Cinco minutos já são um começo.</h2><p>Uma sugestão de ritmo, sem cronômetro obrigatório. A sessão só será concluída quando você escolher concluir.</p><ol><li><strong>1 minuto:</strong> releia suas anotações ou a ideia principal.</li><li><strong>3 minutos:</strong> tente explicar um conceito com suas palavras.</li><li><strong>1 minuto:</strong> anote uma dúvida ou o próximo passo para depois.</li></ol><button type="button" onClick={() => { setTab('notes'); setShortReturn(false) }}>Abrir minhas anotações</button></section>}
      <section className="session-layout">
        <div className="session-workspace pj-panel">
          <nav className="session-tabs" aria-label="Ferramentas da sessão">{[['guide','Guia de estudo'],['material',materialUrl ? 'Fonte principal' : 'Material'],['notes','Anotações']].map(([key,label]) => <button key={key} type="button" aria-pressed={tab === key} aria-controls="session-canvas" className={tab === key ? 'is-active' : ''} onClick={() => setTab(key)}>{label}{key === 'notes' && <span> {noteStatus === 'saved' ? 'na conta' : noteStatus === 'local' ? 'neste aparelho' : ''}</span>}</button>)}</nav>
          {noteStatus === 'unsaved' && <button type="button" className="study-button" onClick={() => downloadTextCopy(notes, 'planejai-anotacoes.txt')}>Baixar cópia das anotações</button>}
          <div id="session-canvas" className="session-canvas" data-view={tab}>
            {tab === 'material' ? <StudyMaterial content={content} onTutorRequest={pensarComLumi} /> : tab === 'guide' ? <div className="session-guide-wrap"><StudyGuide material={content} onTutorRequest={pensarComLumi} sourceUrl={isExternalStudySource(materialUrl) ? materialUrl : undefined} /></div> : <div className="session-notes">
              <header className="session-notes-header"><div><span className="pj-eyebrow">CADERNO DA SESSÃO</span><h2>Organize suas ideias.</h2><p>Anote o que entendeu e o que quer perguntar à Lumi.</p></div><div className="session-notes-tools"><SaveFeedback status={noteStatus} onRetry={retryNotes} />{!loadingNotes && <DictationButton onText={(texto) => setNotes((atual) => `${atual}${atual ? '\n' : ''}${texto}`)}/>}</div></header>
              <div className="session-note-prompts"><span>ESTRUTURE SUA REVISÃO</span><div><button type="button" disabled={loadingNotes} onClick={() => setNotes((atual) => `${atual}${atual ? '\n\n' : ''}Ideia principal\n`)}>+ Ideia principal</button><button type="button" disabled={loadingNotes} onClick={() => setNotes((atual) => `${atual}${atual ? '\n\n' : ''}Minha dúvida\n`)}>+ Minha dúvida</button><button type="button" disabled={loadingNotes} onClick={() => setNotes((atual) => `${atual}${atual ? '\n\n' : ''}Exemplo próprio\n`)}>+ Exemplo próprio</button></div></div>
              <label className="session-notes-editor"><span className="sr-only">Anotações da sessão</span><textarea disabled={loadingNotes} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Escreva com suas palavras…\n\nO que ficou claro? O que ainda precisa de outra explicação?" /><small>{notes.length} caracteres</small></label>
            </div>}
          </div>
        </div>

        <aside className="session-tools" hidden={readingMode} aria-label="Apoio ao estudo">
          <div className="study-desk-tools-heading"><span className="pj-eyebrow">NA SUA MESA</span><h2>Apoio quando precisar.</h2><p>Seu material fica no centro. Escolha uma ferramenta para seguir.</p></div>
          <article ref={lumiRef} className="study-desk-lumi pj-panel"><header><TutorLumi tamanho={40} rotulo="Lumi"/><div><h2>Lumi, por perto.</h2><p>Outra explicação. Um exemplo. Uma boa pergunta.</p></div></header><button type="button" className="study-desk-tool-toggle" aria-expanded={lumiOpen} aria-controls="study-desk-lumi-body" onClick={toggleLumi}>{lumiOpen ? 'Recolher Lumi' : 'Conversar com a Lumi'}<span aria-hidden="true">{lumiOpen ? '−' : '+'}</span></button><div id="study-desk-lumi-body" hidden={!lumiOpen}>{lumiVisited && <Suspense fallback={<p className="study-desk-loading" role="status">Preparando a conversa…</p>}><ChatInterface className="session-lumi-chat" compacto estudoAtual={estudoAtual} praticaAtual={praticaAtual}/></Suspense>}</div></article>
          <article className="study-desk-note-link pj-panel"><span aria-hidden="true">✎</span><h2>Uma ideia merece ficar.</h2><p>Anote com suas palavras. Os avisos distinguem a cópia neste aparelho do que já chegou à conta.</p><button type="button" onClick={() => { setTab('notes'); requestAnimationFrame(() => document.querySelector('.session-notes textarea')?.focus()) }}>Abrir anotações <span aria-hidden="true">↗</span></button></article>
        </aside>
      </section>
      <Suspense fallback={null}><StudyConnections key={content.id_conteudo || content.titulo} content={content} onAddNote={recordConnection} noteDisabled={loadingNotes}/></Suspense>
      <Suspense fallback={<p role="status">Preparando seus registros…</p>}><LearningJournal content={content} notes={notes} embedded/></Suspense>
      <section className="session-check study-desk-wrap-up pj-panel" aria-labelledby="session-wrap-up-title"><div><span className="pj-eyebrow">PARA FECHAR ESTE PASSO</span><h2 id="session-wrap-up-title">Como esse conteúdo ficou?</h2><p>Sua resposta define quando ele volta para revisão. Você também pode sair e retomar depois. As explicações e dúvidas são opcionais; use “Salvar na minha conta” antes de sair para acessá-las em outro aparelho.</p></div><div className="study-desk-assessment" role="group" aria-label="Como ficou o conteúdo">{[['DIFICIL','Ainda difícil'],['LEMBREI','Entendi'],['DOMINEI','Consigo explicar']].map(([value,label]) => <button type="button" key={value} disabled={finishing} aria-pressed={difficulty === value} className={difficulty === value ? 'is-active' : ''} onClick={() => setDifficulty(value)}>{label}</button>)}</div><button type="button" className="pj-button pj-button--primary" disabled={finishing || loadingNotes} onClick={finish}>{finishing ? 'Salvando…' : 'Concluir sessão'}</button></section>
    </div>
  </main>
}
