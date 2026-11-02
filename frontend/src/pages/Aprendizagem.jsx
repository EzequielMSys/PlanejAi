import AreaSignature from '../components/AreaSignature'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import aprendizagem from '../services/aprendizagemService'
import adaptive from '../services/adaptiveService'
import SimulatorSetup, { SimulationReady } from '../components/SimulatorSetup'
import SimulatorSession from '../components/SimulatorSession'
import EnemCompetencies from '../components/EnemCompetencies'
import LearningSignals from '../components/LearningSignals'
import RecoveryState from '../components/RecoveryState'
import RouteLoading from '../components/RouteLoading'
import ReviewRecommendation from '../components/ReviewRecommendation'

import SimulationReport from '../components/SimulationReport'
import './Aprendizagem.css'
import LearningJournalFallback from '../components/LearningJournalFallback'
const LearningJournal = lazy(() => import('../components/LearningJournal').catch(() => ({default:LearningJournalFallback})))
const tabs = [
  ['revisoes', 'Revisões'], ['simulado', 'Simulado'], ['erros', 'Caderno de erros'], ['dominio', 'Mapa de domínio'], ['diario','Minhas palavras e dúvidas']
]

function Stat({ label, value, detail }) {
  return <article className="learning-stat">
    <p>{label}</p>
    <strong>{value}</strong>
    <span>{detail}</span>
  </article>
}

export default function Aprendizagem() {
  const location = useLocation()
  const [aba, setAba] = useState(tabs.some(([id]) => id === location.state?.aba) ? location.state.aba : 'revisoes')
  const [resumo, setResumo] = useState(null)
  const [revisoes, setRevisoes] = useState([])
  const [erros, setErros] = useState([])
  const [questoes, setQuestoes] = useState([])
  const [indice, setIndice] = useState(0)
  const [resposta, setResposta] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const inicioQuestao = useRef(Date.now())
  const [tempoRestante, setTempoRestante] = useState(null)
  const [relatorio, setRelatorio] = useState(null)
  const [evolucao, setEvolucao] = useState([])
  const [confianca, setConfianca] = useState('DUVIDA')
  const [pistas, setPistas] = useState([])
  const [disciplinaPratica, setDisciplinaPratica] = useState(location.state?.disciplina || '')

  const [montando, setMontando] = useState(false)
  const [simuladoError, setSimuladoError] = useState('')
  const [pronto, setPronto] = useState(false)
  const [opcoesSimulado, setOpcoesSimulado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [respostaError, setRespostaError] = useState('')
  const [buscandoPista, setBuscandoPista] = useState(false)
  const startLock = useRef(false), answerLock = useRef(false)
  const workspace = useRef(null), focusRequested = useRef(false)
  const resultsRef = useRef([])
  const sessionVersion = useRef(0), deadline = useRef(null)

  function abrirAba(next) { focusRequested.current = true; setAba(next) }
  useEffect(() => {
    if (!focusRequested.current) return
    focusRequested.current = false
    const target = document.getElementById('practice-question-heading') || workspace.current
    target?.focus({preventScroll:true}); workspace.current?.scrollIntoView({block:'start',behavior:'auto'})
  }, [aba, pronto, indice, questoes.length, relatorio])

  async function carregar() {
    setLoadError(false)
    try {
      const [r, rv, e, ev] = await Promise.all([aprendizagem.resumo(), aprendizagem.revisoes(), aprendizagem.erros(), aprendizagem.evolucao()])
      setResumo(r); setRevisoes(rv); setErros(e); setEvolucao(ev)
    } catch { setLoadError(true) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])
  useEffect(()=>{
    const target=aba==='revisoes'?location.state?.idRevisao:aba==='erros'?location.state?.idErro:null
    if(!target||carregando)return
    const element=document.getElementById(`learning-${aba==='erros'?'error':'review'}-${Number(target)}`)
    element?.focus();element?.scrollIntoView({block:'center',behavior:'auto'})
  },[aba,carregando,location.state?.idRevisao,location.state?.idErro])

  async function iniciarSimulado(opcoes = { quantidade: 10 }) {
    if (startLock.current) return
    startLock.current = true; setMontando(true); setSimuladoError(''); abrirAba('simulado')
    try {
      const payload = opcoes.adaptativo ? await adaptive.simulado(opcoes) : await aprendizagem.simulado(opcoes)
      const lista = opcoes.adaptativo ? payload?.questoes : payload
      if (!Array.isArray(lista) || lista.some(q => !q.id_questao || !Array.isArray(q.alternativas) || q.alternativas.length !== 4 || !q.embaralhamento)) throw new Error('invalid-payload')
      if (!lista.length) { setSimuladoError(opcoes.origem === 'erros' ? 'Não há erros pendentes para praticar agora.' : 'Não há questões disponíveis com essa combinação de disciplina e dificuldade.'); return }
      sessionVersion.current++; setOpcoesSimulado(opcoes); setQuestoes(lista); setPronto(true); setIndice(0); setResposta(null); setFeedback(null); setConfianca('DUVIDA'); setPistas([]); resultsRef.current = []; setRelatorio(null); setTempoRestante(null); setRespostaError(''); focusRequested.current = true
    } catch (error) { setSimuladoError(error.code === 'ECONNABORTED' ? 'A montagem demorou além do esperado. Tente novamente em instantes.' : 'Não foi possível carregar as questões agora. Confira sua conexão e tente novamente.') }
    finally { startLock.current = false; setMontando(false) }
  }

  function comecarSimulado() {
    focusRequested.current = true; setPronto(false); inicioQuestao.current = Date.now()
    deadline.current = Number(opcoesSimulado?.minutos) > 0 ? Date.now() + Number(opcoesSimulado.minutos) * 60000 : null
    setTempoRestante(deadline.current ? Math.ceil((deadline.current - Date.now()) / 1000) : null)
  }

  function concluirSimulado(reason = 'concluido') {
    sessionVersion.current++; focusRequested.current = true
    setRelatorio({ items: resultsRef.current, total: questoes.length, reason }); setQuestoes([]); setPronto(false); setTempoRestante(null); setResposta(null); setFeedback(null); setRespostaError(''); carregar()
  }

  async function confirmarResposta() {
    if (resposta === null || answerLock.current || feedback) return
    answerLock.current = true; setEnviando(true); setRespostaError('')
    const version = sessionVersion.current
    try {
      const resultado = await aprendizagem.responder(questao.id_questao, resposta, Math.round((Date.now() - inicioQuestao.current) / 1000), questao.embaralhamento, confianca, pistas.length)
      if (version !== sessionVersion.current) return
      setFeedback(resultado.offline ? { offline: true, explicacao: 'A correção ficará disponível depois da sincronização. Esta resposta ainda não conta como acerto ou erro.' } : resultado)
      const item = { id: questao.id_questao, disciplina: questao.disciplina, enunciado: questao.enunciado, answer: resposta, correctAnswer: resultado.respostaCorreta, acertou: resultado.offline ? null : resultado.acertou, explanation: resultado.explicacao }
      resultsRef.current = [...resultsRef.current, item]
    } catch (error) { if (version === sessionVersion.current) setRespostaError(/expirada|adulterada/i.test(error.response?.data?.message || '') ? 'Esta tentativa expirou. Encerre e monte outro simulado; as respostas já enviadas continuam registradas.' : 'Não foi possível confirmar o registro. Sua alternativa continua selecionada; tente enviar novamente.') }
    finally { answerLock.current = false; setEnviando(false) }
  }

  function proximaQuestao() {
    if (indice + 1 >= questoes.length) { concluirSimulado(); return }
    sessionVersion.current++; focusRequested.current = true; setIndice(i => i + 1); setResposta(null); setFeedback(null); setRespostaError(''); setConfianca('DUVIDA'); setPistas([]); inicioQuestao.current = Date.now()
  }

  async function pedirPista() {
    if (buscandoPista) return
    const version = sessionVersion.current, id = questao.id_questao
    setBuscandoPista(true)
    try { const lista = await adaptive.pistas(id); if (version === sessionVersion.current) setPistas(lista.slice(0, Math.min(3, pistas.length + 1))) }
    catch { toast.error('Não foi possível carregar uma pista.') }
    finally { setBuscandoPista(false) }
  }

  useEffect(() => {
    if (!questoes.length || pronto || tempoRestante === null || tempoRestante <= 0) return undefined
    const intervalo = window.setInterval(() => setTempoRestante(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000))), 1000)
    return () => window.clearInterval(intervalo)
  }, [questoes.length, pronto, tempoRestante])

  useEffect(() => {
    if (tempoRestante !== 0 || !questoes.length || enviando) return
    concluirSimulado('tempo')
  }, [tempoRestante, enviando])

  async function avaliar(item, resultado) {
    try { await aprendizagem.avaliarRevisao(item.id_conteudo, resultado); setRevisoes((lista) => lista.filter((r) => r.id_revisao !== item.id_revisao)); carregar(); toast.success('Próxima revisão recalculada.') }
    catch { toast.error('Não foi possível registrar a revisão.') }
  }

  const questao = pronto ? null : questoes[indice]
  const disciplinaCritica = useMemo(() => resumo?.porDisciplina?.[0], [resumo])
  const totalRespostas = Number(resumo?.questoesRespondidas || 0)
  const revisoesHoje = Number(resumo?.revisoesHoje || 0)
  const errosPendentes = Number(resumo?.errosPendentes || 0)
  const proximaAcao = revisoesHoje > 0
    ? { titulo: 'Sua memória pede uma revisão.', texto: `${revisoesHoje} ${revisoesHoje === 1 ? 'conteúdo espera' : 'conteúdos esperam'} por você hoje.`, botao: 'Abrir revisões', aba: 'revisoes' }
    : errosPendentes > 0
      ? { titulo: 'Transforme um erro em avanço.', texto: `${errosPendentes} ${errosPendentes === 1 ? 'questão merece' : 'questões merecem'} uma nova tentativa.`, botao: 'Abrir caderno de erros', aba: 'erros' }
      : { titulo: totalRespostas ? 'Mantenha o ritmo de prática.' : 'Seu mapa começa na primeira questão.', texto: totalRespostas ? 'Um simulado curto ajuda a revelar seu próximo foco.' : 'Responda algumas questões para descobrir onde começar.', botao: 'Preparar simulado', aba: 'simulado' }
  function imprimirRelatorio() { window.print() }

  if (carregando) return <RouteLoading label="Preparando sua trilha…" />
  if (loadError && !questoes.length && aba !== 'simulado') return <RecoveryState title="Não conseguimos consultar seu progresso." onRetry={() => { setCarregando(true); carregar() }} />

  return <main className="learning-page min-h-screen bg-study-canvas px-4 py-6 text-study-ink dark:bg-study-canvas dark:text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      {!questao && aba !== 'simulado' && <><AreaSignature area="learning"/><motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="learning-hero">
        <div className="learning-hero-copy"><span>SEU DIÁRIO DE APRENDIZAGEM</span><h1>Seu esforço<br /><em>ganha forma.</em></h1><p>Veja o que melhorou, retome o que ainda pede atenção e escolha sua próxima prática.</p><div className="learning-hero-actions"><button type="button" onClick={() => iniciarSimulado({ quantidade: 10, minutos: 15 })}>Começar simulado <span aria-hidden="true">→</span></button><button type="button" onClick={() => iniciarSimulado({ quantidade: 8, minutos: 15, adaptativo: true })}>Prática adaptativa</button></div></div>
        <aside className="learning-next"><span>PRÓXIMO PASSO SUGERIDO</span><div aria-hidden="true">↗</div><h2>{proximaAcao.titulo}</h2><p>{proximaAcao.texto}</p><button type="button" onClick={() => abrirAba(proximaAcao.aba)}>{proximaAcao.botao} <span aria-hidden="true">→</span></button></aside>
      </motion.header>
      <LearningSignals summary={resumo} reviews={revisoes} evolution={evolucao} onAction={(next, disciplina) => { setDisciplinaPratica(disciplina || ""); setOpcoesSimulado(null); abrirAba(next) }} /></>}

      {!questao && aba !== 'simulado' && <><div className="learning-tools-entry"><span>Uma boa fonte para sua próxima dúvida<small>Leituras, provas oficiais e recursos de redação, com o tipo de acesso indicado.</small></span><Link to="/fontes-estudo">Explorar fontes para estudar →</Link></div><div className="learning-tools-entry"><span>Precisa preparar seus estudos?<small>Metas por matéria, diagnóstico, cartões e trilhas ficam nas ferramentas extras.</small></span><Link to="/ferramentas-estudo">Abrir ferramentas de estudo →</Link></div></>}
      {!questao && <div className={`learning-toolbar ${aba === 'simulado' ? 'is-practice-nav' : ''}`}>{aba === 'simulado' && <button type="button" className="practice-mobile-back" onClick={() => abrirAba('revisoes')}>← Praticar e revisar</button>}<nav className="learning-tabs" aria-label="Seções de aprendizagem">
        {tabs.map(([id, label]) => <button key={id} type="button" aria-pressed={aba === id} onClick={() => abrirAba(id)}>{label}</button>)}
      </nav>{(aba !== 'simulado' || relatorio) && <button type="button" onClick={imprimirRelatorio} className="learning-print print:hidden">Imprimir relatório / PDF</button>}</div>}

      {loadError && aba === 'simulado' && <p className="practice-error" role="status">Não conseguimos atualizar os indicadores de progresso. Seu simulado continua disponível nesta tela.</p>}
      <section className={`learning-workspace ${aba === 'simulado' ? 'is-practice' : ''}`} ref={workspace} tabIndex={-1} aria-label={aba === 'simulado' ? 'Seu simulado' : 'Área de prática'}>
        {aba === 'diario' && <Suspense fallback={<RouteLoading label="Preparando seu diário…"/>}><LearningJournal initialRegistro={location.state?.registro} initialTipo={location.state?.tipo}/></Suspense>}
        {aba === 'revisoes' && <div><h2 className="text-2xl font-black">Fila de hoje</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Diga honestamente como a lembrança veio. O intervalo se ajusta sozinho.</p>
          <div className="mt-6 grid gap-4">{revisoes.length === 0 ? <Empty title="Tudo em dia por aqui." text="Sua fila está limpa. Um simulado curto pode revelar o próximo conteúdo que vale revisar." action={() => abrirAba('simulado')} actionLabel="Preparar simulado" /> : revisoes.map((item) => <article key={item.id_revisao} id={`learning-review-${item.id_revisao}`} tabIndex={-1} className="learning-review rounded-2xl border border-study-line/15 bg-study-canvas p-5 dark:bg-study-paper"><p className="text-xs font-black uppercase tracking-wider text-study-accent dark:text-study-accent">{item.disciplina}</p><h3 className="mt-1 text-xl font-black">{item.titulo}</h3><p className="mt-2 text-xs text-black/50 dark:text-white/50">Domínio {Number(item.nivel_dominio) * 10}% · última resposta {item.ultimo_resultado || 'ainda não avaliada'}</p><ReviewRecommendation item={item} onSaved={carregar} /><div className="mt-4 flex flex-wrap gap-2">{[['ESQUECI','Esqueci'],['DIFICIL','Foi difícil'],['LEMBREI','Lembrei'],['DOMINEI','Dominei']].map(([id,label]) => <button key={id} onClick={() => avaliar(item,id)} className="rounded-full border border-study-line/25 px-4 py-2 text-xs font-black hover:bg-study-accent hover:text-white">{label}</button>)}</div></article>)}</div></div>}

        {aba === 'simulado' && (relatorio ? <SimulationReport report={relatorio} onRetry={() => { setRelatorio(null); focusRequested.current = true }} onClose={() => { setRelatorio(null); abrirAba('dominio') }} /> : pronto ? <SimulationReady count={questoes.length} requested={opcoesSimulado?.quantidade || 10} options={opcoesSimulado || {}} onBegin={comecarSimulado} onEdit={() => { focusRequested.current = true; setPronto(false); setQuestoes([]) }}/> : questao ? <SimulatorSession question={questao} index={indice} total={questoes.length} answer={resposta} onAnswer={setResposta} feedback={feedback} busy={enviando} error={respostaError} confidence={confianca} onConfidence={setConfianca} hints={pistas} hintBusy={buscandoPista} onHint={pedirPista} remaining={tempoRestante} onConfirm={confirmarResposta} onNext={proximaQuestao} onFinish={() => concluirSimulado('encerrado')}/> : <SimulatorSetup onStart={iniciarSimulado} busy={montando} error={simuladoError} initialOptions={opcoesSimulado} errosPendentes={Number(resumo?.errosPendentes || 0)} key={disciplinaPratica} initialDisciplina={disciplinaPratica} />)}

        {aba === 'erros' && <div><h2 className="text-2xl font-black">Caderno de erros</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Aqui o erro não vira punição: vira evidência, reflexão e nova tentativa.</p><div className="mt-6 grid gap-4">{erros.length === 0 ? <Empty title="Nenhum erro pendente" text="Quando uma questão escapar, ela aparecerá aqui automaticamente com data de retomada." /> : erros.map((item) => <article key={item.id_erro} id={`learning-error-${item.id_erro}`} tabIndex={-1} className={`rounded-2xl border p-5 ${item.resolvido ? 'border-emerald-500/20 opacity-65' : 'border-study-line/15'}`}><div className="flex flex-wrap justify-between gap-2"><b className="text-sm text-study-accent dark:text-study-accent">{item.disciplina}</b><span className="text-xs font-bold">{item.total_erros} erro(s)</span></div><h3 className="mt-2 font-black">{item.enunciado}</h3><p className="mt-3 text-sm text-black/55 dark:text-white/55">{item.explicacao}</p><select defaultValue={item.tipo_erro || 'NAO_CLASSIFICADO'} onChange={(e) => aprendizagem.atualizarErro(item.id_erro,{ tipoErro:e.target.value })} className="mt-4 rounded-xl border p-2 text-sm text-black"><option value="NAO_CLASSIFICADO">Classificar erro</option><option value="CONCEITO">Conceito</option><option value="INTERPRETACAO">Interpretação</option><option value="CALCULO">Cálculo</option><option value="DISTRACAO">Distração</option></select><textarea defaultValue={item.reflexao || ''} onBlur={(e) => aprendizagem.atualizarErro(item.id_erro,{ reflexao:e.target.value })} placeholder="O que me confundiu?" className="mt-3 min-h-20 w-full rounded-xl border border-study-line/20 bg-transparent p-3 text-sm"/><textarea defaultValue={item.como_evitar || ''} onBlur={(e) => aprendizagem.atualizarErro(item.id_erro,{ comoEvitar:e.target.value })} placeholder="Como vou evitar este erro na próxima vez?" className="mt-2 min-h-20 w-full rounded-xl border border-study-line/20 bg-transparent p-3 text-sm"/><button onClick={async()=>{const lista=await aprendizagem.atualizarErro(item.id_erro,{resolvido:!item.resolvido});setErros(lista)}} className="mt-3 rounded-full border border-study-line/30 px-4 py-2 text-xs font-black">{item.resolvido ? 'Reabrir' : 'Marcar como retomado'}</button></article>)}</div></div>}

        {aba === 'dominio' && <div><h2 className="text-2xl font-black">Mapa de domínio</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Leitura baseada nas respostas registradas — não em sensação de produtividade.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Stat label="Tempo nesta semana" value={`${resumo?.minutosSemana || 0} min`} detail={`meta: ${resumo?.metaSemanal || 180} min`} /><Stat label="Dias concluídos" value={resumo?.diasConcluidos || 0} detail="no cronograma" /><Stat label="Desafio atual" value={resumo?.porDificuldade?.[0] ? `${resumo.porDificuldade[0].acerto}%` : '—'} detail={resumo?.porDificuldade?.[0] ? `${resumo.porDificuldade[0].dificuldade.toLowerCase()} · ${resumo.porDificuldade[0].tentativas} tentativas` : 'responda para medir'} /></div><div className="mt-7 grid gap-4">{resumo?.porDisciplina?.length ? resumo.porDisciplina.map((item) => <div key={item.disciplina}><div className="mb-2 flex justify-between text-sm font-black"><span>{item.disciplina}</span><span>{item.acerto}% · {item.tentativas} tentativas</span></div><div className="h-3 overflow-hidden rounded-full bg-[#EEE8F3] dark:bg-study-paper"><motion.div initial={{width:0}} animate={{width:`${item.acerto}%`}} className="h-full rounded-full bg-gradient-to-r from-[#6437B8] to-[#A874FF]" /></div></div>) : <Empty title="Seu mapa começa no primeiro simulado" text="Responda algumas questões para descobrir forças e lacunas reais por disciplina." action={iniciarSimulado} actionLabel="Começar agora" />}</div>{resumo?.recomendacoes?.length > 0 && <div className="mt-7 rounded-2xl bg-study-tint p-4 text-sm dark:bg-study-paper"><b>Próximos passos recomendados</b><ul className="mt-2 list-disc space-y-1 pl-5">{resumo.recomendacoes.map((item) => <li key={item.tipo}>{item.texto}</li>)}</ul></div>}{disciplinaCritica && <p className="mt-4 rounded-2xl border border-study-line/15 p-4 text-sm"><b>Próximo foco sugerido:</b> {disciplinaCritica.disciplina}, hoje com {disciplinaCritica.acerto}% de acerto.</p>}</div>}
        {aba === 'dominio' && evolucao.length > 0 && <section className="mt-7 rounded-2xl border border-study-line/15 p-5"><h3 className="font-black">Comparação dos últimos 60 dias</h3><p className="mt-2 text-sm">Últimos 30 dias e os 30 dias anteriores. São necessárias pelo menos 3 respostas em cada período.</p><div className="mt-3 grid gap-2">{evolucao.map(item => <p key={item.disciplina} className="text-sm"><b>{item.disciplina}</b>: {item.comparavel ? `${item.anterior}% → ${item.atual}% (${Number(item.variacao) > 0 ? '+' : ''}${item.variacao} pontos percentuais)` : 'ainda sem respostas suficientes para comparar'} · {item.amostra_atual || 0} respostas recentes / {item.amostra_anterior || 0} anteriores</p>)}</div></section>}
        {aba === 'dominio' && <EnemCompetencies competencias={resumo?.competenciasEnem || []} />}
      </section>
    </div>
  </main>
}

function Empty({ title, text, action, actionLabel }) {
  return <div className="learning-empty"><span aria-hidden="true">✦</span><h3>{title}</h3><p>{text}</p>{action && <button type="button" onClick={action}>{actionLabel} <span aria-hidden="true">→</span></button>}</div>
}
