import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { Link, useLocation } from 'react-router-dom'
import aprendizagem from '../services/aprendizagemService'
import adaptive from '../services/adaptiveService'
import SimulatorSetup from '../components/SimulatorSetup'
import EnemCompetencies from '../components/EnemCompetencies'
import LearningSignals from '../components/LearningSignals'
import RecoveryState from '../components/RecoveryState'
import RouteLoading from '../components/RouteLoading'

import SimulationReport from '../components/SimulationReport'
import './Aprendizagem.css'
const tabs = [
  ['revisoes', 'Revisões'], ['simulado', 'Simulado'], ['erros', 'Caderno de erros'], ['dominio', 'Mapa de domínio']
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
  const [resultados, setResultados] = useState([])
  const [relatorio, setRelatorio] = useState(null)
  const [evolucao, setEvolucao] = useState([])
  const [confianca, setConfianca] = useState('DUVIDA')
  const [pistas, setPistas] = useState([])
  const [disciplinaPratica, setDisciplinaPratica] = useState(location.state?.disciplina || '')

  async function carregar() {
    setLoadError(false)
    try {
      const [r, rv, e, ev] = await Promise.all([aprendizagem.resumo(), aprendizagem.revisoes(), aprendizagem.erros(), aprendizagem.evolucao()])
      setResumo(r); setRevisoes(rv); setErros(e); setEvolucao(ev)
    } catch { setLoadError(true) }
    finally { setCarregando(false) }
  }

  useEffect(() => { carregar() }, [])

  async function iniciarSimulado(opcoes = { quantidade: 10 }) {
    try {
      const respostaSimulado = opcoes.adaptativo ? await adaptive.simulado(opcoes) : await aprendizagem.simulado(opcoes)
      const lista = opcoes.adaptativo ? respostaSimulado.questoes : respostaSimulado
      if (!lista.length) return toast.error(opcoes.origem === 'erros' ? 'Seu caderno não possui erros pendentes para este filtro.' : 'Nenhuma questão encontrada para esse recorte.')
      setQuestoes(lista); setIndice(0); setResposta(null); setFeedback(null); setResultados([]); setRelatorio(null); setTempoRestante(Number(opcoes.minutos) > 0 ? Number(opcoes.minutos) * 60 : null); inicioQuestao.current = Date.now(); setAba('simulado')
    } catch { toast.error('Não foi possível montar o simulado.') }
  }

  async function confirmarResposta() {
    if (resposta === null) return toast.error('Escolha uma alternativa.')
    try {
      const resultado = await aprendizagem.responder(questao.id_questao, resposta, Math.round((Date.now() - inicioQuestao.current) / 1000), questao.embaralhamento, confianca, pistas.length)
      if (resultado.offline) {
        setFeedback({ offline: true, respostaCorreta: -2, explicacao: 'A correção e o domínio serão calculados quando a conexão voltar.' })
        setResultados((items) => [...items, { id: questao.id_questao, disciplina: questao.disciplina, enunciado: questao.enunciado, answer: resposta, acertou: null }])
        toast('Resposta salva neste aparelho. A correção aparecerá após sincronizar.', { icon: '📥' })
        return
      }
      setFeedback(resultado)
      if (resultado.acertou) toast.success('Boa! Resposta correta.')
      setResultados((items) => [...items, {
        id: questao.id_questao,
        disciplina: questao.disciplina,
        enunciado: questao.enunciado,
        answer: resposta,
        correctAnswer: resultado.respostaCorreta,
        acertou: resultado.acertou,
        explanation: resultado.explicacao
      }])
    } catch { toast.error('Não foi possível registrar a resposta.') }
  }

  function proximaQuestao() {
    if (indice + 1 >= questoes.length) { toast.success('Simulado concluído. Revise o relatório antes de sair.'); setRelatorio({ items: resultados, total: questoes.length }); setQuestoes([]); carregar(); return }
    setIndice((i) => i + 1); setResposta(null); setFeedback(null); setConfianca('DUVIDA'); setPistas([]); inicioQuestao.current = Date.now()
  }

  async function pedirPista() {
    try { const lista = await adaptive.pistas(questao.id_questao); setPistas(lista.slice(0, Math.min(3, pistas.length + 1))) }
    catch { toast.error('Não foi possível carregar uma pista.') }
  }

  useEffect(() => {
    if (!questoes.length || tempoRestante === null || tempoRestante <= 0) return undefined
    const intervalo = window.setInterval(() => setTempoRestante((atual) => Math.max(0, atual - 1)), 1000)
    return () => window.clearInterval(intervalo)
  }, [questoes.length, tempoRestante])

  useEffect(() => {
    if (tempoRestante !== 0 || !questoes.length) return
    toast('Tempo encerrado. Seu resultado parcial foi salvo.', { icon: '⏱️' })
    setQuestoes([]); setResposta(null); setFeedback(null); carregar(); setAba('dominio')
  }, [tempoRestante])

  async function avaliar(item, resultado) {
    try { await aprendizagem.avaliarRevisao(item.id_conteudo, resultado); setRevisoes((lista) => lista.filter((r) => r.id_revisao !== item.id_revisao)); carregar(); toast.success('Próxima revisão recalculada.') }
    catch { toast.error('Não foi possível registrar a revisão.') }
  }

  const questao = questoes[indice]
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
  if (loadError && !questoes.length) return <RecoveryState title="Não conseguimos consultar seu progresso." onRetry={() => { setCarregando(true); carregar() }} />

  return <main className="learning-page min-h-screen bg-study-canvas px-4 py-6 text-study-ink dark:bg-study-canvas dark:text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      {!questao && <><motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="learning-hero">
        <div className="learning-hero-copy"><span>PLANEJAI / LABORATÓRIO DE APRENDIZAGEM</span><h1>Aprender é<br /><em>voltar melhor.</em></h1><p>Pratique, entenda seus erros e volte ao que importa. Seu progresso ganha forma a cada resposta.</p><div className="learning-hero-actions"><button type="button" onClick={() => iniciarSimulado({ quantidade: 10, minutos: 15 })}>Começar simulado <span aria-hidden="true">→</span></button><button type="button" onClick={() => iniciarSimulado({ quantidade: 8, minutos: 15, adaptativo: true })}>Prática adaptativa</button></div></div>
        <aside className="learning-next"><span>PRÓXIMO PASSO SUGERIDO</span><div aria-hidden="true">↗</div><h2>{proximaAcao.titulo}</h2><p>{proximaAcao.texto}</p><button type="button" onClick={() => setAba(proximaAcao.aba)}>{proximaAcao.botao} <span aria-hidden="true">→</span></button></aside>
      </motion.header>
      <LearningSignals summary={resumo} reviews={revisoes} evolution={evolucao} onAction={(next, disciplina) => { setDisciplinaPratica(disciplina || ""); setAba(next) }} /></>}

      {!questao && <><div className="learning-tools-entry"><span>Uma boa fonte para sua próxima dúvida<small>Leituras, provas oficiais e recursos de redação, com o tipo de acesso indicado.</small></span><Link to="/fontes-estudo">Explorar fontes para estudar →</Link></div><div className="learning-tools-entry"><span>Precisa preparar seus estudos?<small>Metas por matéria, diagnóstico, cartões e trilhas ficam nas ferramentas extras.</small></span><Link to="/ferramentas-estudo">Abrir ferramentas de estudo →</Link></div></>}
      {!questao && <div className="learning-toolbar"><nav className="learning-tabs" aria-label="Seções de aprendizagem">
        {tabs.map(([id, label]) => <button key={id} type="button" aria-pressed={aba === id} onClick={() => setAba(id)}>{label}</button>)}
      </nav><button type="button" onClick={imprimirRelatorio} className="learning-print print:hidden">Imprimir relatório / PDF</button></div>}

      <section className="learning-workspace">
        {aba === 'revisoes' && <div><h2 className="text-2xl font-black">Fila de hoje</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Diga honestamente como a lembrança veio. O intervalo se ajusta sozinho.</p>
          <div className="mt-6 grid gap-4">{revisoes.length === 0 ? <Empty title="Tudo em dia por aqui." text="Sua fila está limpa. Um simulado curto pode revelar o próximo conteúdo que vale revisar." action={() => setAba('simulado')} actionLabel="Preparar simulado" /> : revisoes.map((item) => <article key={item.id_revisao} className="learning-review rounded-2xl border border-study-line/15 bg-study-canvas p-5 dark:bg-study-paper"><p className="text-xs font-black uppercase tracking-wider text-study-accent dark:text-study-accent">{item.disciplina}</p><h3 className="mt-1 text-xl font-black">{item.titulo}</h3><p className="mt-2 text-xs text-black/50 dark:text-white/50">Domínio {Number(item.nivel_dominio) * 10}% · última resposta {item.ultimo_resultado || 'ainda não avaliada'}</p><div className="mt-4 flex flex-wrap gap-2">{[['ESQUECI','Esqueci'],['DIFICIL','Foi difícil'],['LEMBREI','Lembrei'],['DOMINEI','Dominei']].map(([id,label]) => <button key={id} onClick={() => avaliar(item,id)} className="rounded-full border border-study-line/25 px-4 py-2 text-xs font-black hover:bg-study-accent hover:text-white">{label}</button>)}</div></article>)}</div></div>}

        {aba === 'simulado' && (!questao ? (relatorio ? <SimulationReport report={relatorio} onRetry={() => iniciarSimulado({ quantidade: relatorio.total, minutos: 15 })} onClose={() => { setRelatorio(null); setAba('dominio') }} /> : <SimulatorSetup onStart={iniciarSimulado} errosPendentes={Number(resumo?.errosPendentes || 0)} key={disciplinaPratica} initialDisciplina={disciplinaPratica} />) : <div><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-wider text-study-accent dark:text-study-accent">{questao.disciplina} · {questao.competencia} · {questao.dificuldade}</span><div className="flex items-center gap-2"><b className="rounded-full bg-study-tint px-3 py-1.5 text-xs dark:bg-study-paper">{indice + 1}/{questoes.length}</b>{tempoRestante !== null && <b className={`rounded-full px-3 py-1.5 text-xs ${tempoRestante < 60 ? 'bg-red-100 text-red-700' : 'bg-study-accent text-white'}`}>⏱ {Math.floor(tempoRestante / 60)}:{String(tempoRestante % 60).padStart(2,'0')}</b>}</div></div><h2 className="mt-5 max-w-3xl text-xl font-black leading-8">{questao.enunciado}</h2><div className="mt-6 grid gap-3">{questao.alternativas.map((alt, i) => <button disabled={Boolean(feedback)} onClick={() => setResposta(i)} key={`${questao.id_questao}-${i}`} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${resposta === i ? 'border-study-line bg-[#EEE5FA] dark:bg-[#392653]' : 'border-black/10 hover:border-study-line/50 dark:border-white/10'}`}><span className="mr-3 text-study-accent">{String.fromCharCode(65+i)}</span>{alt}</button>)}</div>{!feedback && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-black">Confiança:</span>{[['CHUTEI','Chutei'],['DUVIDA','Tenho dúvida'],['CERTEZA','Tenho certeza']].map(([id,label]) => <button type="button" key={id} onClick={() => setConfianca(id)} className={`rounded-full border px-3 py-2 text-xs font-bold ${confianca === id ? 'bg-study-accent text-white' : ''}`}>{label}</button>)}<button type="button" onClick={pedirPista} disabled={pistas.length >= 3} className="rounded-full border px-3 py-2 text-xs font-bold">Pedir pista ({pistas.length}/3)</button></div>}{pistas.map((pista, i) => <p key={pista} className="mt-2 rounded-xl bg-study-tint p-3 text-sm dark:bg-study-paper"><b>Pista {i + 1}:</b> {pista}</p>)}{feedback && <div className={`mt-5 rounded-2xl p-5 ${feedback.acertou ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100' : 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'}`}><b>{feedback.acertou ? 'Raciocínio confirmado' : `Resposta correta: ${String.fromCharCode(65 + Number(feedback.respostaCorreta))}`}</b><p className="mt-1 text-sm">{feedback.explicacao}</p>{feedback.dominio && <p className="mt-2 text-xs font-bold">Domínio atualizado: {feedback.dominio.dominio}%</p>}</div>}<button onClick={feedback ? proximaQuestao : confirmarResposta} className="mt-6 rounded-full bg-study-accent px-6 py-3 text-sm font-black text-white">{feedback ? 'Próxima questão' : 'Confirmar resposta'}</button></div>)}

        {aba === 'erros' && <div><h2 className="text-2xl font-black">Caderno de erros</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Aqui o erro não vira punição: vira evidência, reflexão e nova tentativa.</p><div className="mt-6 grid gap-4">{erros.length === 0 ? <Empty title="Nenhum erro pendente" text="Quando uma questão escapar, ela aparecerá aqui automaticamente com data de retomada." /> : erros.map((item) => <article key={item.id_erro} className={`rounded-2xl border p-5 ${item.resolvido ? 'border-emerald-500/20 opacity-65' : 'border-study-line/15'}`}><div className="flex flex-wrap justify-between gap-2"><b className="text-sm text-study-accent dark:text-study-accent">{item.disciplina}</b><span className="text-xs font-bold">{item.total_erros} erro(s)</span></div><h3 className="mt-2 font-black">{item.enunciado}</h3><p className="mt-3 text-sm text-black/55 dark:text-white/55">{item.explicacao}</p><select defaultValue={item.tipo_erro || 'NAO_CLASSIFICADO'} onChange={(e) => aprendizagem.atualizarErro(item.id_erro,{ tipoErro:e.target.value })} className="mt-4 rounded-xl border p-2 text-sm text-black"><option value="NAO_CLASSIFICADO">Classificar erro</option><option value="CONCEITO">Conceito</option><option value="INTERPRETACAO">Interpretação</option><option value="CALCULO">Cálculo</option><option value="DISTRACAO">Distração</option></select><textarea defaultValue={item.reflexao || ''} onBlur={(e) => aprendizagem.atualizarErro(item.id_erro,{ reflexao:e.target.value })} placeholder="O que me confundiu?" className="mt-3 min-h-20 w-full rounded-xl border border-study-line/20 bg-transparent p-3 text-sm"/><textarea defaultValue={item.como_evitar || ''} onBlur={(e) => aprendizagem.atualizarErro(item.id_erro,{ comoEvitar:e.target.value })} placeholder="Como vou evitar este erro na próxima vez?" className="mt-2 min-h-20 w-full rounded-xl border border-study-line/20 bg-transparent p-3 text-sm"/><button onClick={async()=>{const lista=await aprendizagem.atualizarErro(item.id_erro,{resolvido:!item.resolvido});setErros(lista)}} className="mt-3 rounded-full border border-study-line/30 px-4 py-2 text-xs font-black">{item.resolvido ? 'Reabrir' : 'Marcar como retomado'}</button></article>)}</div></div>}

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
