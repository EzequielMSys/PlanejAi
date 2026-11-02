import DeskPin from '../components/DeskPin'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import SectionLink from '../components/SectionLink'
import { motion } from 'framer-motion'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import redacaoService from '../services/redacaoService'
import '../components/EssayRecords.css'
const EssayGuide = lazy(() => import('../components/EssayGuide'))
const EssayStudio = lazy(() => import('../components/EssayStudio'))
const EssayVersions = lazy(() => import('../components/EssayVersionsPro'))
import WritingWorkshop from '../components/WritingWorkshop'
const PeerReview = lazy(() => import('../components/PeerReview'))
const EssayPortfolio = lazy(() => import('../components/EssayPortfolio'))
import './RedacoesExperience.css'
import { essayDraftKey, readEssayDraft, markEssayQueued } from '../utils/essayDraft'
import RecoveryState from '../components/RecoveryState'
import RouteLoading from '../components/RouteLoading'
import SaveFeedback from '../components/SaveFeedback'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

function formatarData(data) {
  if (!data) return '-'

  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatarNota(nota) {
  const n = Number(nota)
  return Number.isFinite(n) ? n.toFixed(1) : '-'
}

// Componente que renderiza o texto grifando palavras com erros
function TextoComErros({ texto, erros = [] }) {
  if (!texto) return null

  if (!erros || erros.length === 0) {
    return (
      <p className="text-black/80 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
        {texto}
      </p>
    )
  }

  // Constrói as partes do texto
  const partes = []
  let cursor = 0

  // A API envia offsets do texto original. Usá-los evita destacar a ocorrência
  // errada quando uma palavra se repete ou começa com letra maiúscula.
  const textoMinusculo = texto.toLocaleLowerCase()
  const posicoesUsadas = new Set()
  const errosOrdenados = [...erros]
    .filter((erro) => erro?.palavra)
    .map((erro) => {
      const posicaoInformada = Number(erro.posicao)
      const palavra = String(erro.palavra)
      const trecho = Number.isInteger(posicaoInformada) ? texto.slice(posicaoInformada, posicaoInformada + palavra.length) : ''
      let posicao = trecho.toLocaleLowerCase() === palavra.toLocaleLowerCase()
        ? posicaoInformada
        : textoMinusculo.indexOf(palavra.toLocaleLowerCase())
      while (posicao >= 0 && posicoesUsadas.has(posicao)) {
        posicao = textoMinusculo.indexOf(palavra.toLocaleLowerCase(), posicao + palavra.length)
      }
      if (posicao >= 0) posicoesUsadas.add(posicao)
      return { ...erro, posicao }
    })
    .filter((erro) => erro.posicao >= 0)
    .sort((a, b) => Number(a.posicao) - Number(b.posicao))

  for (const erro of errosOrdenados) {
    const inicio = Number(erro.posicao)
    const fim = inicio + String(erro.palavra).length
    const textoDoErro = texto.slice(inicio, fim)

    if (inicio >= cursor && textoDoErro.toLocaleLowerCase() === String(erro.palavra).toLocaleLowerCase()) {
      // Texto antes do erro
      partes.push(texto.slice(cursor, inicio))

      // Palavra com erro (grifada)
      partes.push(
        <mark
          key={`${erro.palavra}-${inicio}`}
          className="bg-red-100 text-red-700 px-0.5 rounded font-semibold border-b-2 border-red-400"
          title={erro.sugestao ? `Sugestão: ${erro.sugestao}` : 'Possível erro'}
        >
          {textoDoErro}
        </mark>
      )

      cursor = fim
    }
  }

  // Resto do texto
  partes.push(texto.slice(cursor))

  return (
    <p className="text-black/80 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
      {partes}
    </p>
  )
}

function BadgeIA({ nivel }) {
  if (!nivel) return null

  const config = {
    provavel: { label: 'Revisar sinais de autoria', cls: 'bg-red-100 text-red-700 border-red-300' },
    possivel: { label: 'Revisar sinais de autoria', cls: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
    'improvável': { label: 'Poucos sinais atípicos', cls: 'bg-green-100 text-green-700 border-green-300' }
  }

  const cfg = config[nivel] || config.improvável

  return (
    <span className={`px-3 py-1 rounded-full border text-xs font-bold ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function Redacoes() {
  const [searchParams] = useSearchParams()
  const requestedEssay = searchParams.get('redacao')
  const openedSearch = useRef(null)
  const { isAdmin, isDono, isDocente } = useAuth()
  const isGestor = isAdmin || isDono || isDocente

  const [redacoes, setRedacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [sendError, setSendError] = useState('')
  const [confirmedAt,setConfirmedAt]=useState(null)
  const [queuedVersion, setQueuedVersion] = useState(() => readEssayDraft()?.queuedVersion || null)
  const [enviando, setEnviando] = useState(false)
  const [modoEscrita, setModoEscrita] = useState(false)
  const [selecionada, setSelecionada] = useState(null)
  const [aba, setAba] = useState('minhas')
  const [extraTools, setExtraTools] = useState(false)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [editorVisit, setEditorVisit] = useState(0)
  const [editorTarget, setEditorTarget] = useState('editor')
  const [planning, setPlanning] = useState(null)
  const [pendingPlan, setPendingPlan] = useState(null)
  const guideTrigger = useRef(null)

  // Estado para avaliação manual (admin/dono)
  const [avaliando, setAvaliando] = useState(null)
  const [avaliacaoForm, setAvaliacaoForm] = useState({ nota: '', feedback: '' })
  const [salvandoAvaliacao, setSalvandoAvaliacao] = useState(false)

  const [form, setForm] = useState({
    tema: '',
    texto: ''
  })
  const currentForm = useRef(form)
  currentForm.current = form
  let rascunhoSalvo = null
  rascunhoSalvo = readEssayDraft()
  const temRascunho = Boolean(rascunhoSalvo?.tema || rascunhoSalvo?.texto)

  function openStudio(target = 'editor') { setEditorTarget(target === 'proposal' ? 'proposal' : 'editor'); setGuideOpen(false); setModoEscrita(true); setEditorVisit(value => value + 1) }
  function openGuide(step = 0) { setGuideStep(Number.isInteger(step) ? step : 0); setGuideOpen(true) }
  function openPlanning() {
    const target = document.querySelector('.writing-workshop')
    const trigger = target?.querySelector('.writing-workshop-intro>button')
    if (!target?.classList.contains('is-open')) trigger?.click()
    requestAnimationFrame(() => { target?.scrollIntoView({block:'start'}); trigger?.focus({preventScroll:true}) })
  }
  function closeGuide() { setGuideOpen(false); if (modoEscrita) setEditorVisit(value => value + 1); else requestAnimationFrame(() => guideTrigger.current?.focus()) }
  function applyPlan(replace) {
    if (replace) setForm({tema: pendingPlan.tema || '', texto: pendingPlan.rascunho || ''})
    setPlanning(pendingPlan); setPendingPlan(null); openStudio()
  }

  // Estado para sugestão de tema e repertório
  const [sugerindoTema, setSugerindoTema] = useState(false)
  const [sugestaoTema, setSugestaoTema] = useState(null)

  async function buscarSugestaoTema() {
    setSugerindoTema(true)

    try {
      const sugestao = await redacaoService.sugerirTema(form.tema.trim())
      setSugestaoTema(sugestao)

      if (!form.tema.trim() && sugestao.tema) {
        setForm((f) => ({ ...f, tema: sugestao.tema }))
      }
    } catch (error) {
      toast.error('Erro ao buscar sugestão de tema.')
    } finally {
      setSugerindoTema(false)
    }
  }

  async function carregarRedacoes() {
    setLoadError(false)
    try {
      if (isGestor && aba === 'gestor') {
        const data = await redacaoService.listarTodasRedacoes()
        setRedacoes(Array.isArray(data) ? data : [])
      } else {
        const data = await redacaoService.listarRedacoes()
        setRedacoes(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarRedacoes()
  }, [isGestor, aba])

  useEffect(() => {
    if (!requestedEssay) { openedSearch.current = null; return }
    if (loading || loadError || !requestedEssay || openedSearch.current === requestedEssay) return
    const found = redacoes.find(item => String(item.id_redacao) === requestedEssay)
    if (!found) return
    openedSearch.current = requestedEssay
    setSelecionada(found)
    const frame = requestAnimationFrame(() => {
      const card = document.getElementById(`essay-record-${found.id_redacao}`)
      card?.scrollIntoView({block:'start',behavior:'auto'})
      const heading = card?.querySelector('h3')
      heading?.setAttribute('tabindex','-1'); heading?.focus({preventScroll:true})
    })
    return () => window.cancelAnimationFrame(frame)
  }, [loading, loadError, requestedEssay, redacoes])

  const handleEnviar = async (e) => {
    e.preventDefault()
    if (enviando || queuedVersion === JSON.stringify(form)) return

    if (!form.tema.trim() || !form.texto.trim()) {
      toast.error('Preencha o tema e o texto da redação.')
      return
    }

    setEnviando(true)
    setSendError('')
    const ownerDraft = essayDraftKey()

    try {
      const novaRedacao = await redacaoService.enviarRedacao(form)
      if (essayDraftKey() !== ownerDraft) return
      if (novaRedacao?.offline) {
        setQueuedVersion(JSON.stringify(form)); markEssayQueued(form, currentForm.current)
        return
      }
      if(!novaRedacao?.id_redacao)throw Error('unconfirmed')

      setRedacoes((prev) => [novaRedacao, ...prev])
      setConfirmedAt(new Date().toISOString())
      if (JSON.stringify(currentForm.current) !== JSON.stringify(form)) {
        toast.success('A versão enviada foi confirmada. As alterações posteriores continuam no rascunho.')
        return
      }
      setForm({ tema: '', texto: '' })
      try { localStorage.removeItem(ownerDraft) } catch { /* A confirmação do servidor não depende da limpeza local. */ }
      setQueuedVersion(null)
      setModoEscrita(false)
      toast.success('Redação enviada. Confira o feedback e a análise de erros!')
    } catch (error) {
      setSendError(error.response?.data?.message || 'Não conseguimos confirmar o envio. Seu texto continua no editor. Tente novamente quando a conexão voltar.')
      toast.error(error.response?.data?.message || 'Erro ao enviar redação.')
    } finally {
      setEnviando(false)
    }
  }

  const handleAvaliar = async (e) => {
    e.preventDefault()

    if (!avaliando) return

    const nota = Number(avaliacaoForm.nota)

    if (Number.isNaN(nota) || nota < 0 || nota > 1000) {
      toast.error('Informe uma nota entre 0 e 1000 (padrão ENEM).')
      return
    }

    if (!avaliacaoForm.feedback.trim()) {
      toast.error('Escreva um feedback.')
      return
    }

    setSalvandoAvaliacao(true)

    try {
      await redacaoService.avaliarRedacao(avaliando.id_redacao, {
        notaManual: nota,
        feedbackManual: avaliacaoForm.feedback
      })

      setAvaliando(null)
      setAvaliacaoForm({ nota: '', feedback: '' })
      await carregarRedacoes()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao avaliar redação.')
    } finally {
      setSalvandoAvaliacao(false)
    }
  }

  if (loading) return <RouteLoading label="Buscando suas redações…" />

  return (
    <>
    {guideOpen && <Suspense fallback={<RouteLoading label="Abrindo o guia de escrita…" />}><EssayGuide initialStep={guideStep} onClose={closeGuide} onStart={openStudio} /></Suspense>}
    <main hidden={guideOpen} className="redacoes-page min-h-screen px-4 sm:px-6 lg:px-8 py-10">
      {loadError && <RecoveryState title="Não conseguimos consultar o histórico de redações." onRetry={carregarRedacoes}><p>Você ainda pode abrir o estúdio e continuar seu rascunho. Não foi possível confirmar a lista de textos salvos na conta.</p></RecoveryState>}
      {!loadError && requestedEssay && !redacoes.some(item => String(item.id_redacao) === requestedEssay) && <p role="status">A redação encontrada na busca não está mais neste histórico. Confira os textos disponíveis abaixo.</p>}
      <div className="redacoes-shell max-w-6xl mx-auto">
      {confirmedAt && !modoEscrita && <SaveFeedback status="saved" savedAt={confirmedAt} message="Redação salva na sua conta. Ela já está no histórico abaixo." />}
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className={`redacoes-intro redacoes-intro--compact${modoEscrita ? ' is-writing' : ''}`} aria-labelledby="redacoes-title">
            <div className="redacoes-intro-copy">
              <span className="redacoes-eyebrow">SEU CADERNO DE REDAÇÃO</span>
              <h1 id="redacoes-title">Uma ideia. Sua voz. Um texto.</h1>
              <p>{modoEscrita ? 'Seu texto continua no estúdio. Consulte o guia quando precisar.' : 'Escolha um tema, organize suas ideias e escreva. O próximo passo fica sempre à mão.'}</p>
              <div className="redacoes-intro-actions">
                <button type="button" onClick={()=>openStudio(modoEscrita || temRascunho ? 'editor' : 'proposal')}>{modoEscrita ? 'Voltar ao texto' : temRascunho ? 'Continuar rascunho' : 'Começar uma redação'} <span aria-hidden="true">↗</span></button>
                <button ref={guideTrigger} className="essay-guide-open" type="button" onClick={()=>openGuide()}>Como fazer uma redação</button>
              </div>
            </div>
          </section>
          {!modoEscrita && aba === 'minhas' && <>
            <nav className="essay-journey" aria-label="Seu caminho na redação">
              <button type="button" onClick={()=>openStudio('proposal')}><span>01</span><strong>Proposta</strong><small>Leia o tema e os apoios</small></button>
              <button type="button" onClick={openPlanning}><span>02</span><strong>Planejar</strong><small>Organize sua posição</small></button>
              <button type="button" onClick={openStudio}><span>03</span><strong>Escrever</strong><small>Abra seu estúdio</small></button>
              <SectionLink target="redacoes-historico"><span>04</span><strong>Revisar</strong><small>Retome textos enviados</small></SectionLink>
            </nav>
            <div className="essay-lumi-link"><span>Quer pensar em voz alta?</span><Link to="/lumi" state={{ perguntaInicial: 'Quero planejar uma redação no modelo ENEM. Ajude-me a definir uma tese, dois argumentos e uma proposta de intervenção sem escrever o texto por mim.' }}>Destrave seu argumento com a Lumi →</Link></div>
          </>}

          {isGestor && (
            <div className="redacoes-tabs" role="tablist" aria-label="Área de redações">
              <button
                type="button"
                role="tab"
                aria-selected={aba === 'minhas'}
                onClick={() => setAba('minhas')}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  aba === 'minhas'
                    ? 'bg-study-accent text-white shadow-lg'
                    : 'text-black/60 hover:text-black hover:bg-study-accent/15'
                }`}
              >
                Minhas redações
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={aba === 'gestor'}
                onClick={() => setAba('gestor')}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  aba === 'gestor'
                    ? 'bg-study-accent text-white shadow-lg'
                    : 'text-black/60 hover:text-black hover:bg-study-accent/15'
                }`}
              >
                Avaliar redações
              </button>
            </div>
          )}

          {!modoEscrita && aba === 'minhas' && <><WritingWorkshop onWrite={setPendingPlan} onGuide={openGuide} /><button className="sd-button" type="button" onClick={() => setExtraTools(value => !value)} aria-expanded={extraTools}>{extraTools ? 'Recolher ferramentas extras' : 'Abrir portfólio e revisão em pares'}</button>{extraTools && <Suspense fallback={<RouteLoading embedded />}><EssayPortfolio /><PeerReview /></Suspense>}</>}
          {pendingPlan && <section className="essay-plan-preview" aria-label="Conferir planejamento antes de abrir o estúdio"><h2>Levar seu planejamento para o texto</h2><p>Confira o tema e o rascunho antes de continuar. As anotações do plano ficarão disponíveis para consulta no estúdio.</p><strong>{pendingPlan.tema || 'Tema ainda não definido'}</strong><pre>{pendingPlan.rascunho || 'Você ainda não escreveu um rascunho na oficina.'}</pre>{temRascunho || form.texto || form.tema ? <p>Já existe um rascunho no estúdio. Você pode mantê-lo ou substituí-lo pelo tema e pelo texto acima.</p> : null}<div><button type="button" onClick={()=>applyPlan(true)}>Usar tema e rascunho da oficina</button><button type="button" onClick={()=>applyPlan(false)}>Manter meu rascunho e consultar o plano</button><button type="button" onClick={()=>setPendingPlan(null)}>Cancelar transferência</button></div></section>}
          {modoEscrita ? (<Suspense fallback={<RouteLoading embedded label="Abrindo seu estúdio…" />}><EssayStudio
            focusRequest={editorVisit}
            focusTarget={editorTarget}
            onGuide={()=>setGuideOpen(true)}
            planning={planning}
            form={form}
            setForm={setForm}
            onSubmit={handleEnviar}
            onCancel={() => setModoEscrita(false)}
            enviando={enviando}
            queued={queuedVersion === JSON.stringify(form)}
            sendError={sendError}
            sugestao={sugestaoTema}
            sugerindo={sugerindoTema}
            onSugerir={buscarSugestaoTema}
          /></Suspense>) : (
            <>
              {loadError && !redacoes.length ? null : redacoes.length === 0 ? (
                <section id="redacoes-historico" className="essay-history-empty" aria-labelledby="essay-history-empty-title"><div><span className="redacoes-eyebrow">MEUS TEXTOS</span><h2 id="essay-history-empty-title">{aba === 'gestor' ? 'Nenhuma redação para avaliar' : 'Nenhuma redação enviada'}</h2><p>{aba === 'gestor' ? 'Os textos enviados pelos estudantes aparecerão aqui.' : 'Depois de enviar, abra seu texto aqui para conferir o feedback e revisar.'}</p></div>{aba !== 'gestor' && <button type="button" onClick={openStudio}>Escrever redação</button>}</section>
              ) : (
                <section id="redacoes-historico" className="essay-records grid gap-4" aria-label="Redações enviadas">
                  <div className="redacoes-history-heading"><div><span className="redacoes-eyebrow">SEU ARQUIVO</span><h2>{aba === 'gestor' ? 'Textos para acompanhar' : 'Textos que contam sua evolução'}</h2><p>Abra uma produção para reler o feedback e planejar a próxima versão.</p></div><strong>{redacoes.length} {redacoes.length === 1 ? 'redação' : 'redações'}</strong></div>
                  {redacoes.map((redacao) => {
                    const nota =
                      redacao.nota_manual ??
                      redacao.nota_estimada ??
                      redacao.nota ??
                      redacao.notaEstimada

                    const feedback =
                      redacao.feedback_manual ??
                      redacao.feedback_ia ??
                      redacao.feedback ??
                      redacao.feedbackIa

                    const feedbackManual = redacao.feedback_manual
                    const temFeedbackManual = Boolean(feedbackManual)

                    const erros = redacao.erros_texto || []
                    const sugestoes = redacao.sugestoes || []
                    const flagIa = Number(redacao.flag_ia) === 1
                    const iaNivel = redacao.ia_nivel || (flagIa ? 'provavel' : 'improvável')
                    const iaInfo = redacao.deteccao_ia || null

                    const selecionadaE =
                      selecionada?.id_redacao === redacao.id_redacao

                    const autorNome = redacao.autor_nome || redacao.autor_apelido

                    return (
                      <div
                        key={redacao.id_redacao}
                        id={`essay-record-${redacao.id_redacao}`}
                        className="essay-record bg-study-paper rounded-[2rem] p-5 shadow-xl border border-study-line/20"
                      >
                        <div className="essay-record__header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-1">
                              {formatarData(redacao.enviada_em)}
                            </p>

                            <h3 className="text-xl font-black text-black">
                              {redacao.tema}
                            </h3>

                            {aba !== 'gestor' && <DeskPin type="redacao" id={redacao.id_redacao}/>}
                            {aba === 'gestor' && autorNome && (
                              <p className="text-sm text-black/60 font-semibold">
                                Autor: {autorNome}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-3 flex-wrap">
                            {!temFeedbackManual && flagIa && (
                              <BadgeIA nivel={iaNivel} />
                            )}

                            <span className={`px-4 py-2 rounded-full border text-sm font-bold ${
                              temFeedbackManual
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-study-accent/10 text-study-accent border-study-line/30'
                            }`}>
                              {temFeedbackManual ? 'Avaliada' : nota == null ? 'Sem nota estimada' : `Estimativa: ${formatarNota(nota)}`}
                            </span>

                            <button
                              type="button"
                              aria-expanded={selecionadaE}
                              onClick={() =>
                                setSelecionada(
                                  selecionadaE ? null : redacao
                                )
                              }
                              className="bg-study-canvas border border-study-line/40 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-study-accent/20 transition"
                            >
                              {selecionadaE ? 'Fechar' : 'Ver detalhes'}
                            </button>
                            {!isGestor && <Link to="/chat" state={{ redacaoSelecionada: { id: redacao.id_redacao, tema: redacao.tema } }} className="rounded-full border border-study-line/40 px-4 py-2 text-sm font-bold text-study-accent hover:bg-study-accent/10">Conversar com a Lumi</Link>}
                          </div>
                        </div>

                        {selecionadaE && (
                          <div className="essay-record__details mt-4 pt-4 border-t border-study-line/20 space-y-4">
                            <div className="essay-record__manuscript">
                              <p className="text-xs uppercase tracking-[0.25em] font-black text-black/40 mb-2">
                                Texto
                              </p>
                              <TextoComErros texto={redacao.texto} erros={erros} />
                            </div>

                            {!isGestor && <Suspense fallback={<RouteLoading embedded />}><EssayVersions redacao={redacao} /></Suspense>}

                            {erros.length > 0 && (
                              <div className="essay-record__panel essay-record__errors p-4 rounded-[1.5rem] bg-red-50 border border-red-200">
                                <p className="text-xs uppercase tracking-[0.25em] font-black text-red-600 mb-2">
                                  Erros ortográficos ({erros.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {erros.map((erro, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1 rounded-full bg-study-paper border border-red-300 text-red-700 text-xs font-semibold"
                                    >
                                      <span className="line-through">{erro.palavra}</span>
                                      {erro.sugestao && (
                                        <span className="text-green-600 ml-1">
                                          → {erro.sugestao}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {sugestoes.length > 0 && (
                              <div className="essay-record__panel essay-record__suggestions p-4 rounded-[1.5rem] bg-blue-50 border border-blue-200">
                                <p className="text-xs uppercase tracking-[0.25em] font-black text-blue-600 mb-2">
                                  Sugestões de melhoria
                                </p>
                                <ul className="space-y-1">
                                  {sugestoes.map((s, idx) => (
                                    <li key={idx} className="text-sm text-black/80 flex items-start gap-2">
                                      <span className="text-blue-600 font-bold">•</span>
                                      {s.mensagem}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Competências ENEM (0-1000) */}
                            {(() => {
                              let comps = []
                              try {
                                const raw = redacao.competencias_enem
                                comps = typeof raw === 'string' ? JSON.parse(raw) : (Array.isArray(raw) ? raw : [])
                              } catch (e) {
                                comps = []
                              }

                              const repertorioSugerido = (() => {
                                try {
                                  const r = redacao.repertorio_sugerido
                                  return typeof r === 'string' ? JSON.parse(r) : (Array.isArray(r) ? r : [])
                                } catch (e) {
                                  return []
                                }
                              })()

                              return (comps.length > 0 || repertorioSugerido.length > 0) ? (
                                <div className="essay-record__scoreboard p-4 rounded-[1.5rem] bg-study-canvas border border-study-line/30">
                                  <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-3">
                                    Avaliação formativa da Lumi (0–1000, não oficial)
                                  </p>

                                  {comps.length > 0 && (
                                    <div className="grid sm:grid-cols-2 gap-2 mb-3">
                                      {comps.map((c) => (
                                        <div
                                          key={c.codigo}
                                          className="essay-record__competency flex items-center justify-between px-3 py-2 rounded-[1rem] bg-study-paper border border-study-line/20"
                                          style={{ '--score-ratio': Math.min(1, Math.max(0, Number(c.nota) / 200)) }}
                                        >
                                          <span className="text-xs text-black/70 font-semibold">Competência {c.codigo}{c.evidencia ? ` · ${c.evidencia}` : ''}</span>
                                          <span className="text-sm font-black text-study-accent">
                                            {c.nota}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {repertorioSugerido.length > 0 && (
                                    <div className="mt-2">
                                      <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-2">
                                        Repertório sugerido
                                      </p>
                                      <div className="essay-record__repertoire flex flex-wrap gap-2">
                                        {repertorioSugerido.map((rep, idx) => (
                                          <span
                                            key={idx}
                                            className="px-3 py-1 rounded-full bg-study-paper border border-study-line/30 text-study-accent text-xs font-semibold capitalize"
                                          >
                                            {rep.titulo || rep}
                                            {rep.tipo && <span className="text-study-accent"> • {rep.tipo}</span>}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : null
                            })()}

                            {flagIa && (
                              <div className="essay-record__panel essay-record__authorship p-4 rounded-[1.5rem] bg-purple-50 border border-purple-200">
                                <p className="text-xs uppercase tracking-[0.25em] font-black text-purple-600 mb-2">
                                  Sinais de estilo e autoria
                                </p>
                                <p className="text-sm text-black/80">
                                  Alguns padrões merecem revisão, mas não comprovam uso de IA. A avaliação deve considerar o histórico de escrita e o contexto do aluno.
                                  {iaInfo?.aviso && <span className="mt-2 block text-xs">{iaInfo.aviso}</span>}
                                </p>
                                {iaInfo?.evidencias && iaInfo.evidencias.length > 0 && (
                                  <ul className="space-y-1 mt-2">
                                    {iaInfo.evidencias.map((ev, idx) => (
                                      <li key={idx} className="text-xs text-purple-700 flex items-start gap-2">
                                        <span className="font-bold">•</span>
                                        {ev}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}

                            {feedback && (
                              <div className="essay-record__feedback p-4 rounded-[1.5rem] bg-study-canvas border border-study-line/20">
                                <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-2">
                                  {temFeedbackManual ? 'Feedback do avaliador' : 'Feedback automático'}
                                </p>
                                <p className="text-black/80 leading-relaxed whitespace-pre-wrap">
                                  {feedback}
                                </p>
                              </div>
                            )}

                            {/* Formulário de avaliação para admin/dono */}
                            {isGestor && aba === 'gestor' && (
                              avaliando?.id_redacao === redacao.id_redacao ? (
                                <form
                                  onSubmit={handleAvaliar}
                                  className="essay-record__assessment p-4 rounded-[1.5rem] bg-study-canvas border border-study-line/30"
                                >
                                  <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-3">
                                    Avaliar redação
                                  </p>

                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-bold text-black mb-1">
                                        Nota (0-1000, padrão ENEM)
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="1000"
                                        step="20"
                                        value={avaliacaoForm.nota}
                                        onChange={(e) =>
                                          setAvaliacaoForm((f) => ({
                                            ...f,
                                            nota: e.target.value
                                          }))
                                        }
                                        placeholder="Ex: 880"
                                        className="w-full rounded-[1rem] px-4 py-2 bg-study-paper border border-study-line/40 text-black focus:ring-2 focus:ring-[#4B4C9D] focus:outline-none"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-bold text-black mb-1">
                                        Feedback
                                      </label>
                                      <textarea
                                        value={avaliacaoForm.feedback}
                                        onChange={(e) =>
                                          setAvaliacaoForm((f) => ({
                                            ...f,
                                            feedback: e.target.value
                                          }))
                                        }
                                        rows={4}
                                        placeholder="Escreva seu feedback para o aluno..."
                                        className="w-full rounded-[1rem] px-4 py-2 bg-study-paper border border-study-line/40 text-black focus:ring-2 focus:ring-[#4B4C9D] focus:outline-none resize-y"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex gap-3 mt-4">
                                    <button
                                      type="submit"
                                      disabled={salvandoAvaliacao}
                                      className="bg-study-accent text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-black transition disabled:opacity-60"
                                    >
                                      {salvandoAvaliacao ? 'Salvando...' : 'Salvar avaliação'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setAvaliando(null)
                                        setAvaliacaoForm({ nota: '', feedback: '' })
                                      }}
                                      className="bg-study-paper border border-study-line/40 text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-study-accent/20 transition"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </form>
                              ) : (
                                !temFeedbackManual && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAvaliando(redacao)
                                      setAvaliacaoForm({
                                        nota: redacao.nota_estimada || '',
                                        feedback: ''
                                      })
                                    }}
                                    className="bg-study-accent text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-black transition"
                                  >
                                    Avaliar redação
                                  </button>
                                )
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </section>
              )}
            </>
          )}
        </motion.div>
      </div>
    </main>
    </>
  )
}
