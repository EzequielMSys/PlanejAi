import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import aprendizagem from '../services/aprendizagemService'
import adaptive from '../services/adaptiveService'
import SimulatorSetup from '../components/SimulatorSetup'
import EnemCompetencies from '../components/EnemCompetencies'

import SimulationReport from '../components/SimulationReport'
const tabs = [
  ['revisoes', 'Revisões'], ['simulado', 'Simulado'], ['erros', 'Caderno de erros'], ['dominio', 'Mapa de domínio']
]

function Stat({ label, value, detail }) {
  return <article className="rounded-2xl border border-[#7C4DFF]/15 bg-white/90 p-5 shadow-[0_20px_50px_-40px_rgba(44,22,85,.8)] dark:bg-[#211A2D]">
    <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#7952C7] dark:text-[#CBB3FF]">{label}</p>
    <strong className="mt-2 block text-3xl font-black text-[#21162F] dark:text-white">{value}</strong>
    <span className="text-xs text-black/50 dark:text-white/55">{detail}</span>
  </article>
}

export default function Aprendizagem() {
  const [aba, setAba] = useState('revisoes')
  const [resumo, setResumo] = useState(null)
  const [revisoes, setRevisoes] = useState([])
  const [erros, setErros] = useState([])
  const [questoes, setQuestoes] = useState([])
  const [indice, setIndice] = useState(0)
  const [resposta, setResposta] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const inicioQuestao = useRef(Date.now())
  const [tempoRestante, setTempoRestante] = useState(null)
  const [resultados, setResultados] = useState([])
  const [relatorio, setRelatorio] = useState(null)
  const [evolucao, setEvolucao] = useState([])
  const [confianca, setConfianca] = useState('DUVIDA')
  const [pistas, setPistas] = useState([])

  async function carregar() {
    try {
      const [r, rv, e, ev] = await Promise.all([aprendizagem.resumo(), aprendizagem.revisoes(), aprendizagem.erros(), aprendizagem.evolucao()])
      setResumo(r); setRevisoes(rv); setErros(e); setEvolucao(ev)
    } catch { toast.error('Não foi possível carregar sua central de aprendizagem.') }
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
  function imprimirRelatorio() { window.print() }

  if (carregando) return <div className="min-h-[60vh] grid place-items-center font-black text-[#7952C7]">Preparando sua trilha…</div>

  return <main className="min-h-screen bg-[#F7F4FA] px-4 py-6 text-[#21162F] dark:bg-[#120E18] dark:text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <motion.header initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="workspace-hero relative overflow-hidden rounded-[2.2rem] border border-[#8052D5]/20 bg-white p-7 dark:bg-[#1C1626] sm:p-10">
        <div className="max-w-2xl"><p className="text-[11px] font-black uppercase tracking-[.25em] text-[#7952C7] dark:text-[#CBB3FF]">PlanejAI / Laboratório de aprendizagem</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.055em] sm:text-6xl">Estudar, testar, <span className="text-[#8B5CF6]">lembrar.</span></h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-black/60 dark:text-white/60">Uma fila viva que aprende com seus acertos, recupera o que ficou para trás e transforma erro em próximo passo.</p>
        </div>
        <div className="mt-7 flex flex-wrap gap-2"><button onClick={() => iniciarSimulado({ quantidade: 10, minutos: 15 })} className="rounded-full bg-[#6D3EC5] px-6 py-3 text-sm font-black text-white shadow-lg shadow-[#6D3EC5]/20 transition hover:-translate-y-0.5">Começar simulado</button><button onClick={() => iniciarSimulado({ quantidade: 8, minutos: 15, adaptativo: true })} className="rounded-full border border-[#6D3EC5] px-6 py-3 text-sm font-black text-[#6D3EC5]">Simulado adaptativo</button></div>
      </motion.header>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Revisões para hoje" value={resumo?.revisoesHoje || 0} detail="fila adaptativa" />
        <Stat label="Taxa de acerto" value={`${resumo?.taxaAcerto || 0}%`} detail={`${resumo?.questoesRespondidas || 0} respostas`} />
        <Stat label="Erros em aberto" value={resumo?.errosPendentes || 0} detail="prontos para retomar" />
        <Stat label="Domínio geral" value={`${resumo?.dominio || 0}%`} detail="baseado em revisões" />
      </section>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3"><nav className="flex gap-2 overflow-x-auto rounded-2xl border border-[#7C4DFF]/15 bg-white p-2 dark:bg-[#1C1626]" aria-label="Seções de aprendizagem">
        {tabs.map(([id, label]) => <button key={id} onClick={() => setAba(id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-black transition ${aba === id ? 'bg-[#6D3EC5] text-white' : 'text-black/55 hover:bg-[#F0E8FA] dark:text-white/55 dark:hover:bg-white/5'}`}>{label}</button>)}
      </nav><button type="button" onClick={imprimirRelatorio} className="rounded-full border border-[#6D3EC5] px-4 py-2 text-sm font-black text-[#6D3EC5] print:hidden">Imprimir relatório / PDF</button></div>

      <section className="mt-4 rounded-[2rem] border border-[#7C4DFF]/15 bg-white p-5 dark:bg-[#1C1626] sm:p-8">
        {aba === 'revisoes' && <div><h2 className="text-2xl font-black">Fila de hoje</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Diga honestamente como a lembrança veio. O intervalo se ajusta sozinho.</p>
          <div className="mt-6 grid gap-4">{revisoes.length === 0 ? <Empty title="Fila limpa" text="Conclua conteúdos do cronograma e adicione-os à revisão para construir sua memória de longo prazo." /> : revisoes.map((item) => <article key={item.id_revisao} className="rounded-2xl border border-[#7C4DFF]/15 bg-[#FAF8FC] p-5 dark:bg-[#241C31]"><p className="text-xs font-black uppercase tracking-wider text-[#7952C7] dark:text-[#CBB3FF]">{item.disciplina}</p><h3 className="mt-1 text-xl font-black">{item.titulo}</h3><p className="mt-2 text-xs text-black/50 dark:text-white/50">Domínio {Number(item.nivel_dominio) * 10}% · última resposta {item.ultimo_resultado || 'ainda não avaliada'}</p><div className="mt-4 flex flex-wrap gap-2">{[['ESQUECI','Esqueci'],['DIFICIL','Foi difícil'],['LEMBREI','Lembrei'],['DOMINEI','Dominei']].map(([id,label]) => <button key={id} onClick={() => avaliar(item,id)} className="rounded-full border border-[#7C4DFF]/25 px-4 py-2 text-xs font-black hover:bg-[#6D3EC5] hover:text-white">{label}</button>)}</div></article>)}</div></div>}

        {aba === 'simulado' && (!questao ? (relatorio ? <SimulationReport report={relatorio} onRetry={() => iniciarSimulado({ quantidade: relatorio.total, minutos: 15 })} onClose={() => { setRelatorio(null); setAba('dominio') }} /> : <SimulatorSetup onStart={iniciarSimulado} errosPendentes={Number(resumo?.errosPendentes || 0)} />) : <div><div className="flex flex-wrap items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-wider text-[#7952C7] dark:text-[#CBB3FF]">{questao.disciplina} · {questao.competencia} · {questao.dificuldade}</span><div className="flex items-center gap-2"><b className="rounded-full bg-[#F0E8FA] px-3 py-1.5 text-xs dark:bg-white/10">{indice + 1}/{questoes.length}</b>{tempoRestante !== null && <b className={`rounded-full px-3 py-1.5 text-xs ${tempoRestante < 60 ? 'bg-red-100 text-red-700' : 'bg-[#6D3EC5] text-white'}`}>⏱ {Math.floor(tempoRestante / 60)}:{String(tempoRestante % 60).padStart(2,'0')}</b>}</div></div><h2 className="mt-5 max-w-3xl text-xl font-black leading-8">{questao.enunciado}</h2><div className="mt-6 grid gap-3">{questao.alternativas.map((alt, i) => <button disabled={Boolean(feedback)} onClick={() => setResposta(i)} key={`${questao.id_questao}-${i}`} className={`rounded-2xl border p-4 text-left text-sm font-bold transition ${resposta === i ? 'border-[#7C4DFF] bg-[#EEE5FA] dark:bg-[#392653]' : 'border-black/10 hover:border-[#7C4DFF]/50 dark:border-white/10'}`}><span className="mr-3 text-[#7952C7]">{String.fromCharCode(65+i)}</span>{alt}</button>)}</div>{!feedback && <div className="mt-4 flex flex-wrap items-center gap-2"><span className="text-xs font-black">Confiança:</span>{[['CHUTEI','Chutei'],['DUVIDA','Tenho dúvida'],['CERTEZA','Tenho certeza']].map(([id,label]) => <button type="button" key={id} onClick={() => setConfianca(id)} className={`rounded-full border px-3 py-2 text-xs font-bold ${confianca === id ? 'bg-[#6D3EC5] text-white' : ''}`}>{label}</button>)}<button type="button" onClick={pedirPista} disabled={pistas.length >= 3} className="rounded-full border px-3 py-2 text-xs font-bold">Pedir pista ({pistas.length}/3)</button></div>}{pistas.map((pista, i) => <p key={pista} className="mt-2 rounded-xl bg-[#F2EAFB] p-3 text-sm dark:bg-white/10"><b>Pista {i + 1}:</b> {pista}</p>)}{feedback && <div className={`mt-5 rounded-2xl p-5 ${feedback.acertou ? 'bg-emerald-50 text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100' : 'bg-amber-50 text-amber-950 dark:bg-amber-950/40 dark:text-amber-100'}`}><b>{feedback.acertou ? 'Raciocínio confirmado' : `Resposta correta: ${String.fromCharCode(65 + Number(feedback.respostaCorreta))}`}</b><p className="mt-1 text-sm">{feedback.explicacao}</p>{feedback.dominio && <p className="mt-2 text-xs font-bold">Domínio atualizado: {feedback.dominio.dominio}%</p>}</div>}<button onClick={feedback ? proximaQuestao : confirmarResposta} className="mt-6 rounded-full bg-[#6D3EC5] px-6 py-3 text-sm font-black text-white">{feedback ? 'Próxima questão' : 'Confirmar resposta'}</button></div>)}

        {aba === 'erros' && <div><h2 className="text-2xl font-black">Caderno de erros</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Aqui o erro não vira punição: vira evidência, reflexão e nova tentativa.</p><div className="mt-6 grid gap-4">{erros.length === 0 ? <Empty title="Nenhum erro pendente" text="Quando uma questão escapar, ela aparecerá aqui automaticamente com data de retomada." /> : erros.map((item) => <article key={item.id_erro} className={`rounded-2xl border p-5 ${item.resolvido ? 'border-emerald-500/20 opacity-65' : 'border-[#7C4DFF]/15'}`}><div className="flex flex-wrap justify-between gap-2"><b className="text-sm text-[#7952C7] dark:text-[#CBB3FF]">{item.disciplina}</b><span className="text-xs font-bold">{item.total_erros} erro(s)</span></div><h3 className="mt-2 font-black">{item.enunciado}</h3><p className="mt-3 text-sm text-black/55 dark:text-white/55">{item.explicacao}</p><select defaultValue={item.tipo_erro || 'NAO_CLASSIFICADO'} onChange={(e) => aprendizagem.atualizarErro(item.id_erro,{ tipoErro:e.target.value })} className="mt-4 rounded-xl border p-2 text-sm text-black"><option value="NAO_CLASSIFICADO">Classificar erro</option><option value="CONCEITO">Conceito</option><option value="INTERPRETACAO">Interpretação</option><option value="CALCULO">Cálculo</option><option value="DISTRACAO">Distração</option></select><textarea defaultValue={item.reflexao || ''} onBlur={(e) => aprendizagem.atualizarErro(item.id_erro,{ reflexao:e.target.value })} placeholder="O que me confundiu?" className="mt-3 min-h-20 w-full rounded-xl border border-[#7C4DFF]/20 bg-transparent p-3 text-sm"/><textarea defaultValue={item.como_evitar || ''} onBlur={(e) => aprendizagem.atualizarErro(item.id_erro,{ comoEvitar:e.target.value })} placeholder="Como vou evitar este erro na próxima vez?" className="mt-2 min-h-20 w-full rounded-xl border border-[#7C4DFF]/20 bg-transparent p-3 text-sm"/><button onClick={async()=>{const lista=await aprendizagem.atualizarErro(item.id_erro,{resolvido:!item.resolvido});setErros(lista)}} className="mt-3 rounded-full border border-[#7C4DFF]/30 px-4 py-2 text-xs font-black">{item.resolvido ? 'Reabrir' : 'Marcar como retomado'}</button></article>)}</div></div>}

        {aba === 'dominio' && <div><h2 className="text-2xl font-black">Mapa de domínio</h2><p className="mt-1 text-sm text-black/55 dark:text-white/55">Leitura baseada nas respostas registradas — não em sensação de produtividade.</p><div className="mt-5 grid gap-3 sm:grid-cols-3"><Stat label="Tempo nesta semana" value={`${resumo?.minutosSemana || 0} min`} detail={`meta: ${resumo?.metaSemanal || 180} min`} /><Stat label="Dias concluídos" value={resumo?.diasConcluidos || 0} detail="no cronograma" /><Stat label="Desafio atual" value={resumo?.porDificuldade?.[0] ? `${resumo.porDificuldade[0].acerto}%` : '—'} detail={resumo?.porDificuldade?.[0] ? `${resumo.porDificuldade[0].dificuldade.toLowerCase()} · ${resumo.porDificuldade[0].tentativas} tentativas` : 'responda para medir'} /></div><div className="mt-7 grid gap-4">{resumo?.porDisciplina?.length ? resumo.porDisciplina.map((item) => <div key={item.disciplina}><div className="mb-2 flex justify-between text-sm font-black"><span>{item.disciplina}</span><span>{item.acerto}% · {item.tentativas} tentativas</span></div><div className="h-3 overflow-hidden rounded-full bg-[#EEE8F3] dark:bg-white/10"><motion.div initial={{width:0}} animate={{width:`${item.acerto}%`}} className="h-full rounded-full bg-gradient-to-r from-[#6437B8] to-[#A874FF]" /></div></div>) : <Empty title="Seu mapa começa no primeiro simulado" text="Responda algumas questões para descobrir forças e lacunas reais por disciplina." action={iniciarSimulado} actionLabel="Começar agora" />}</div>{resumo?.recomendacoes?.length > 0 && <div className="mt-7 rounded-2xl bg-[#F2EAFB] p-4 text-sm dark:bg-[#2C203C]"><b>Próximos passos recomendados</b><ul className="mt-2 list-disc space-y-1 pl-5">{resumo.recomendacoes.map((item) => <li key={item.tipo}>{item.texto}</li>)}</ul></div>}{disciplinaCritica && <p className="mt-4 rounded-2xl border border-[#7C4DFF]/15 p-4 text-sm"><b>Próximo foco sugerido:</b> {disciplinaCritica.disciplina}, hoje com {disciplinaCritica.acerto}% de acerto.</p>}</div>}
        {aba === 'dominio' && evolucao.length > 0 && <section className="mt-7 rounded-2xl border border-[#7C4DFF]/15 p-5"><h3 className="font-black">Evolução em 30 dias</h3><div className="mt-3 grid gap-2">{evolucao.map((item) => <p key={item.disciplina} className="text-sm"><b>{item.disciplina}</b>: {item.anterior}% → {item.atual}% <span className={Number(item.variacao) >= 0 ? 'text-emerald-600' : 'text-rose-600'}>({Number(item.variacao) >= 0 ? '+' : ''}{item.variacao} pontos)</span></p>)}</div></section>}
        {aba === 'dominio' && <EnemCompetencies competencias={resumo?.competenciasEnem || []} />}
      </section>
    </div>
  </main>
}

function Empty({ title, text, action, actionLabel }) {
  return <div className="rounded-2xl border border-dashed border-[#7C4DFF]/25 bg-[#FAF8FC] p-8 text-center dark:bg-[#241C31]"><h3 className="text-xl font-black">{title}</h3><p className="mx-auto mt-2 max-w-xl text-sm text-black/55 dark:text-white/55">{text}</p>{action && <button onClick={action} className="mt-5 rounded-full bg-[#6D3EC5] px-5 py-2.5 text-sm font-black text-white">{actionLabel}</button>}</div>
}
