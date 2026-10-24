import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'
import cronogramaService from '../services/cronogramaService'
import { useAuth } from '../context/AuthContext'
import MaterialViewer from '../components/MaterialViewer'
import CronogramaAssessment from '../components/CronogramaAssessment'
import { exportarCronograma } from '../utils/calendarExport'
import './Cronograma.css'
import DailyPlanActions from '../components/DailyPlanActions'
import { localStudyDate } from '../utils/dailyStudy'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

function formatarData(data) {
  if (!data) return '-'

  return new Date(`${localStudyDate(data)}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit'
  })
}

export default function Cronograma() {
  const navigate = useNavigate()
  const { isGestor, perfilCompleto } = useAuth()
  const [cronogramas, setCronogramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [concluindo, setConcluindo] = useState(null)
  const [concluindoConteudo, setConcluindoConteudo] = useState(null)
  const [diasExpandidos, setDiasExpandidos] = useState({})
  const [filtroDias, setFiltroDias] = useState('proximos')
  const [editando, setEditando] = useState(null)
  const [editLink, setEditLink] = useState('')
  const [enviandoMaterial, setEnviandoMaterial] = useState(null)
  const [materialAberto, setMaterialAberto] = useState(null)
  const [conteudoArrastado, setConteudoArrastado] = useState(null)
  const [diaAlvo, setDiaAlvo] = useState(null)
  const [avaliacao, setAvaliacao] = useState(null)
  const [recuperacao, setRecuperacao] = useState(null)
  const celebradoRef = useRef(false)

  async function carregarCronogramas() {
    try {
      const data = await cronogramaService.listarCronogramas()
      setCronogramas(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erro ao carregar cronograma.')
    } finally {
      setLoading(false)
    }
  }

  async function replanejar() {
    try {
      await cronogramaService.replanejar()
      setLoading(true)
      await carregarCronogramas()
    } catch {
      // O serviço já exibe a mensagem adequada.
    }
  }

  async function abrirRecuperacao() {
    try { setRecuperacao(await cronogramaService.recuperacao()) }
    catch { toast.error('Não foi possível analisar seus atrasos.') }
  }

  async function iniciarDesafio(idDia) {
    try { setAvaliacao(await cronogramaService.desafioAdiantamento(idDia)) }
    catch (error) { toast.error(error.response?.data?.message || 'Não foi possível iniciar o desafio.') }
  }

  async function iniciarProvaFinal() {
    try { setAvaliacao(await cronogramaService.provaFinal(cronogramaAtual.id_cronograma)) }
    catch (error) { toast.error(error.response?.data?.message || 'Não foi possível iniciar a prova final.') }
  }

  async function retomarAvaliacao(idAvaliacao) {
    try { setAvaliacao(await cronogramaService.retomarAvaliacao(idAvaliacao)) }
    catch (error) { toast.error(error.response?.data?.message || 'Não foi possível retomar a avaliação.') }
  }

  async function abandonarAvaliacao(idAvaliacao) {
    if (!window.confirm('Descartar esta avaliação? As respostas salvas na sua conta serão apagadas e será possível iniciar outra.')) return
    try {
      await cronogramaService.abandonarAvaliacao(idAvaliacao)
      await carregarCronogramas()
      toast.success('Avaliação descartada. Você já pode iniciar uma nova.')
    } catch (error) { toast.error(error.response?.data?.message || 'Não foi possível descartar a avaliação.') }
  }

  async function enviarAvaliacao(idAvaliacao, respostas) {
    const resultado = await cronogramaService.enviarAvaliacao(idAvaliacao, respostas)
    await carregarCronogramas()
    return resultado
  }

  async function salvarRespostaAvaliacao(idAvaliacao, idQuestao, resposta) {
    return cronogramaService.salvarRespostaAvaliacao(idAvaliacao, idQuestao, resposta)
  }

  useEffect(() => {
    carregarCronogramas()
  }, [])

  const cronogramaAtual = cronogramas[0]

  const dias = useMemo(() => {
    return cronogramaAtual?.dias || []
  }, [cronogramaAtual])

  const totalDias = dias.length

  const diasConcluidos = dias.filter((dia) => {
    return Number(dia.concluido) === 1 || dia.status === 'concluído'
  }).length

  const progresso = totalDias
    ? Math.round((diasConcluidos / totalDias) * 100)
    : 0

  const tempoTotal = dias.reduce((acc, dia) => {
    return acc + Number(dia.tempo_previsto || 0)
  }, 0)

const proximoDia = dias.find((dia) => {
    return Number(dia.concluido) !== 1 && dia.status !== 'concluído'
  })
  const primeiroPendente = dias.findIndex((dia) => Number(dia.concluido) !== 1 && dia.status !== 'concluído')
  const focoIndex = primeiroPendente === -1 ? Math.max(0, dias.length - 1) : primeiroPendente
  const inicioTrilha = Math.min(Math.max(0, focoIndex - 1), Math.max(0, dias.length - 3))
  const diasTrilha = dias.slice(inicioTrilha, inicioTrilha + 3)
  const filtroEfetivo = totalDias > 0 && diasConcluidos === totalDias && filtroDias === 'proximos' ? 'todos' : filtroDias
  const diasVisiveis = dias.map((dia, index) => ({ dia, index })).filter(({ dia }) => {
    const concluido = Number(dia.concluido) === 1 || dia.status === 'concluído'
    return filtroEfetivo === 'todos' || (filtroEfetivo === 'concluidos' ? concluido : !concluido)
  })

  function abrirDia(idDia) {
    setFiltroDias('todos')
    setDiasExpandidos((atuais) => ({ ...atuais, [idDia]: true }))
    requestAnimationFrame(() => document.getElementById(`schedule-day-${idDia}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Dispara confetes quando o cronograma atinge 100% de conclusão
  useEffect(() => {
    if (
      progresso === 100 &&
      totalDias > 0 &&
      !celebradoRef.current
    ) {
      celebradoRef.current = true

      const cores = ['#6B43BB', '#A98AE6', '#F2C66D', '#D9697B', '#65B79D', '#E7A55B']

      // Explosão inicial no centro
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: cores,
        zIndex: 9999
      })

      // Confetes laterais
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 70,
          origin: { x: 0 },
          colors: cores,
          zIndex: 9999
        })
      }, 250)

      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 70,
          origin: { x: 1 },
          colors: cores,
          zIndex: 9999
        })
      }, 400)

      // Terceira onda
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 120,
          origin: { y: 0.4 },
          colors: cores,
          zIndex: 9999
        })
      }, 800)

      toast.success(
        '🎉 Parabéns! Você concluiu 100% do cronograma!',
        { duration: 5000 }
      )
    }
  }, [progresso, totalDias])

  async function gerarNovoCronograma() {
    if (!perfilCompleto) { navigate('/onboarding'); return }
    setGerando(true)

    try {
      await cronogramaService.gerarCronograma()
      await carregarCronogramas()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar cronograma.')
    } finally {
      setGerando(false)
    }
  }

async function concluirDia(idDia) {
    if (!idDia) return

    setConcluindo(idDia)

    try {
      await cronogramaService.concluirDia(idDia)
      await carregarCronogramas()
    } catch (error) {
      toast.error('Erro ao concluir dia.')
    } finally {
      setConcluindo(null)
    }
  }

  async function alternarConteudo(conteudoCronograma, concluido) {
    const idConteudo = conteudoCronograma?.id

    if (!idConteudo) return

    setConcluindoConteudo(idConteudo)

    try {
      if (concluido) {
        await cronogramaService.reabrirConteudo(idConteudo)
      } else {
        await cronogramaService.concluirConteudo(idConteudo)
      }

      await carregarCronogramas()
    } catch (error) {
      toast.error('Erro ao atualizar conteúdo.')
    } finally {
      setConcluindoConteudo(null)
    }
  }
  async function moverConteudo(idConteudo, idDiaDestino) {
    if (!idConteudo || !idDiaDestino) return
    try {
      await cronogramaService.moverConteudo(idConteudo, idDiaDestino)
      setDiasExpandidos((current) => ({ ...current, [idDiaDestino]: true }))
      await carregarCronogramas()
    } catch { /* o serviço já exibe a mensagem contextual */
    } finally {
      setConteudoArrastado(null)
      setDiaAlvo(null)
    }
  }

  function soltarConteudo(event, idDiaDestino) {
    event.preventDefault()
    const id = conteudoArrastado || Number(event.dataTransfer.getData('text/plain'))
    if (id) moverConteudo(id, idDiaDestino)
  }


  function alternarExpansaoDia(idDia) {
    setDiasExpandidos((prev) => ({
      ...prev,
      [idDia]: !prev[idDia]
    }))
  }

  const iniciarEdicao = (conteudo) => {
    setEditando(conteudo.id)
    setEditLink(conteudo.link || '')
  }

  const salvarEdicao = async (idConteudo) => {
    try {
      await cronogramaService.atualizarConteudoCronograma(idConteudo, { link: editLink })
      toast.success('Link atualizado.')
      setEditando(null)
      await carregarCronogramas()
    } catch {
      toast.error('Erro ao atualizar link.')
    }
  }

  const handleUploadMaterial = async (e, idConteudo) => {
    const file = e.target.files?.[0]
    if (!file) return
    setEnviandoMaterial(idConteudo)
    try {
      const data = await cronogramaService.uploadMaterial(idConteudo, file)
      toast.success('Material enviado.')
      await carregarCronogramas()
    } catch {
      toast.error('Erro ao enviar material.')
    } finally {
      setEnviandoMaterial(null)
      e.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-study-canvas flex items-center justify-center">
        <div className="bg-study-paper rounded-[3rem] p-10 shadow-2xl border border-study-line/20 text-center">
          <div className="h-14 w-14 border-b-4 border-study-line rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60">Carregando cronograma...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="schedule-page min-h-screen bg-study-canvas text-black px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-study-accent/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-study-accent/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="workspace-hero bg-gradient-to-br from-study-accent via-study-accent to-study-accent rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-8 left-8 w-24 h-24 bg-study-paper rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
                  SEU TEMPO, COM INTENÇÃO
                </p>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                  Cronograma de Estudos
                </h1>

                <p className="text-lg text-white/85 max-w-2xl">
                  Seu próximo passo, as atividades de hoje e o caminho que vem depois.
                </p>
              </div>

              <button
                type="button"
                onClick={gerarNovoCronograma}
                disabled={gerando}
                className="bg-study-paper text-study-accent px-7 py-3 rounded-full font-black shadow-xl hover:bg-black hover:text-white transition disabled:opacity-60"
              >
                {gerando
                  ? 'Gerando...'
                  : cronogramaAtual
                    ? 'Regenerar cronograma'
                    : 'Gerar cronograma'}
              </button>
            </div>
          </section>

          {cronogramaAtual && <div className="schedule-tools mb-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={abrirRecuperacao} className="rounded-full border border-study-line/25 bg-study-paper px-5 py-3 text-sm font-black text-study-accent dark:bg-study-paper dark:text-study-accent">Plano de recuperação</button><button type="button" onClick={() => exportarCronograma(cronogramaAtual)} className="rounded-full bg-study-accent px-5 py-3 text-sm font-black text-white">Exportar calendário</button></div>}

          <DailyPlanActions schedules={cronogramas} onSaved={carregarCronogramas} />
          {!cronogramaAtual ? (
            <section className="empty-workspace grid gap-10 overflow-hidden p-7 sm:p-10 lg:grid-cols-[1fr_.9fr] lg:items-center">
              <div>
                <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-study-line bg-study-paper px-3 py-1.5 text-xs font-black uppercase tracking-[.16em] text-study-accent dark:border-white/10 dark:bg-study-paper dark:text-[#C4B5FD]">
                  Comece por aqui
                </span>
                <h2 className="max-w-xl text-3xl font-black tracking-[-.04em] text-study-ink dark:text-white sm:text-4xl">
                  Sua semana ainda está em branco.
                </h2>
                <p className="mt-4 max-w-lg leading-relaxed text-[#74627F] dark:text-[#B7A9C1]">
                  Monte uma rotina possível de cumprir. O PlanejAI distribui matérias, pausas e revisões usando seu perfil e sua disponibilidade.
                </p>
                <button
                  type="button"
                  onClick={gerarNovoCronograma}
                  disabled={gerando}
                  className="mt-7 rounded-xl bg-study-accent px-6 py-3 font-black text-white transition hover:-translate-y-0.5 hover:bg-study-accent disabled:opacity-60"
                >
                  {gerando ? 'Montando sua semana...' : 'Montar meu cronograma'}
                </button>
              </div>
              <div className="planner-preview" aria-hidden="true">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.18em] text-study-accent">Prévia</p>
                    <p className="mt-1 font-black text-study-ink dark:text-white">Sua próxima semana</p>
                  </div>
                  <svg className="h-6 w-6 text-study-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {[['SEG', 'Matemática', '45 min'], ['QUA', 'Redação', '1 tema'], ['SEX', 'Revisão', '30 min']].map(([dia, materia, tempo]) => (
                  <div key={dia} className="planner-preview-row">
                    <span>{dia}</span><strong>{materia}</strong><small>{tempo}</small>
                  </div>
                ))}
              </div>
            </section>
          ) : (
            <>
              <section className="schedule-journey" aria-labelledby="schedule-journey-title">
                <div className="schedule-journey-heading"><div><span>SEU CAMINHO DE ESTUDOS</span><h2 id="schedule-journey-title">Uma etapa de cada vez.</h2><p>Escolha uma atividade disponível ou veja como liberar a próxima.</p></div><strong>{diasConcluidos} / {totalDias} dias concluídos</strong></div>
                <div className="schedule-journey-cards">
                  {diasTrilha.map((dia, offset) => {
                    const idDia = dia.id_dia || dia.id
                    const indice = inicioTrilha + offset
                    const concluido = Number(dia.concluido) === 1 || dia.status === 'concluído'
                    const bloqueado = Boolean(dia.bloqueado)
                    const conteudos = dia.conteudos || []
                    const feitos = conteudos.filter((item) => Number(item.concluido) === 1).length
                    const avaliacaoDia = cronogramaAtual.avaliacao_em_andamento?.id_dia === idDia ? cronogramaAtual.avaliacao_em_andamento : null
                    return <article key={idDia || indice} className={`schedule-journey-card ${concluido ? 'is-done' : bloqueado ? 'is-locked' : 'is-ready'}`}>
                      <div className="schedule-journey-card-top"><span>ETAPA {String(indice + 1).padStart(2, '0')}</span><b>{concluido ? '✓ Concluída' : bloqueado ? '♢ Bloqueada' : '● Disponível'}</b></div>
                      <h3>{formatarData(dia.data_estudo)}</h3>
                      <p>{conteudos.length ? `${feitos} de ${conteudos.length} atividades feitas` : `${dia.tempo_previsto || 0} min planejados`}</p>
                      <div className="schedule-journey-activities">{conteudos.slice(0, 2).map((item, itemIndex) => <div key={item.id || itemIndex}><span aria-hidden="true">{Number(item.concluido) === 1 ? '✓' : bloqueado ? '◇' : '→'}</span><span>{item.titulo || item.disciplina || 'Atividade de estudo'}</span></div>)}{conteudos.length > 2 && <small>+ {conteudos.length - 2} outras atividades</small>}{!conteudos.length && <small>Detalhes desta etapa no plano abaixo.</small>}</div>
                      {bloqueado ? dia.requer_desafio ? <button type="button" onClick={() => avaliacaoDia ? retomarAvaliacao(avaliacaoDia.id_avaliacao) : iniciarDesafio(idDia)}>{avaliacaoDia ? 'Retomar mini prova' : 'Fazer mini prova para adiantar'} <span aria-hidden="true">→</span></button> : <p className="schedule-journey-wait">Conclua a etapa anterior para liberar.</p> : <button type="button" onClick={() => abrirDia(idDia)}>{concluido ? 'Rever atividades' : 'Ver atividades do dia'} <span aria-hidden="true">→</span></button>}
                    </article>
                  })}
                </div>
              </section>
              <section className="schedule-overview" aria-label="Resumo do cronograma">
                <div className="schedule-overview-main"><span>VISÃO GERAL</span><div><strong>{progresso}%</strong><p>do caminho percorrido</p></div><div className="schedule-overview-bar" role="progressbar" aria-label="Progresso do cronograma" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progresso}><i style={{ width: `${progresso}%` }} /></div><small>{diasConcluidos} de {totalDias} dias concluídos</small></div>
                <div className="schedule-overview-next"><span>{proximoDia ? 'PRÓXIMO ESTUDO' : 'PLANO CONCLUÍDO'}</span><h2>{proximoDia ? formatarData(proximoDia.data_estudo) : 'Todas as etapas feitas'}</h2><p>{proximoDia ? `${proximoDia.tempo_previsto || 0} min previstos · ${(proximoDia.conteudos || []).length} atividades` : 'Sua trilha de estudos está pronta para a etapa final.'}</p>{proximoDia ? <button type="button" onClick={() => abrirDia(proximoDia.id_dia || proximoDia.id)}>Abrir etapa <span aria-hidden="true">→</span></button> : cronogramaAtual.prova_final?.disponivel ? <button type="button" onClick={iniciarProvaFinal}>Ir para a prova final <span aria-hidden="true">→</span></button> : null}</div>
                <div className="schedule-overview-facts"><div><span>DIAS NO PLANO</span><strong>{totalDias}</strong></div><div><span>TEMPO PLANEJADO</span><strong>{tempoTotal}<small> min</small></strong></div></div>
              </section>

              {cronogramaAtual.avaliacao_em_andamento && <section className="schedule-milestone"><span>AVALIAÇÃO EM ANDAMENTO</span><h2>{cronogramaAtual.avaliacao_em_andamento.tipo === 'FINAL' ? 'Sua prova final está pronta para continuar.' : 'Seu desafio de avanço está pronto para continuar.'}</h2><p>Você pode voltar quando quiser. As questões permanecem as mesmas; neste aparelho, suas escolhas também são preservadas.</p><div><button type="button" onClick={() => retomarAvaliacao(cronogramaAtual.avaliacao_em_andamento.id_avaliacao)}>Retomar {cronogramaAtual.avaliacao_em_andamento.tipo === 'FINAL' ? 'prova final' : 'desafio'} <b aria-hidden="true">→</b></button><button type="button" onClick={() => abandonarAvaliacao(cronogramaAtual.avaliacao_em_andamento.id_avaliacao)}>Descartar avaliação</button></div></section>}
              {cronogramaAtual.prova_final?.disponivel && !cronogramaAtual.avaliacao_em_andamento && <section className="schedule-milestone"><span>ETAPA FINAL</span><h2>Você percorreu o plano. Agora mostre o que aprendeu.</h2><p>A prova final reúne 20 questões das matérias estudadas. São necessários 14 acertos para concluir a trilha.</p><div><button type="button" onClick={iniciarProvaFinal}>Iniciar prova final <b aria-hidden="true">→</b></button></div></section>}
              {cronogramaAtual.prova_final?.concluida && <section className="schedule-milestone is-complete"><span>TRILHA CERTIFICADA</span><h2>Seu esforço virou conquista.</h2><p>Você concluiu o cronograma e foi aprovado na prova final.</p></section>}

              <section className="schedule-plan" aria-labelledby="schedule-plan-title">
                <div className="schedule-legend" aria-label="Estados das etapas"><span><b aria-hidden="true">○</b>Disponível para estudar</span><span><b aria-hidden="true">◇</b>Aguardando liberação</span><span><b aria-hidden="true">✓</b>Concluído</span></div>
                <div className="schedule-plan-head"><div><span>PLANO COMPLETO</span><h2 id="schedule-plan-title">Suas etapas, em detalhe.</h2><p>Abra um dia para estudar, revisar materiais ou acompanhar o que já fez.</p></div><div className="schedule-plan-filters" role="group" aria-label="Filtrar dias do cronograma">{[['proximos', 'Próximos'], ['concluidos', 'Concluídos'], ['todos', 'Todos']].filter(([valor]) => valor !== 'proximos' || diasConcluidos < totalDias).map(([valor, rotulo]) => <button key={valor} type="button" aria-pressed={filtroEfetivo === valor} onClick={() => setFiltroDias(valor)}>{rotulo}</button>)}</div></div>
                <div className="schedule-plan-list">
                {diasVisiveis.map(({ dia, index }) => {
                  const idDia = dia.id_dia || dia.id
                  const concluido =
                    Number(dia.concluido) === 1 ||
                    dia.status === 'concluído'
                  const bloqueado = Boolean(dia.bloqueado)

                  const conteudos = dia.conteudos || []
                  const expandido = Boolean(diasExpandidos[idDia])

                  const conteudosConcluidos = conteudos.filter(
                    (c) => Number(c.concluido) === 1
                  ).length

                  return (
                    <div
                      key={idDia || index}
                      id={`schedule-day-${idDia}`}
                      onDragOver={(event) => { event.preventDefault(); if (conteudoArrastado) setDiaAlvo(idDia) }}
                      onDragLeave={() => setDiaAlvo((current) => current === idDia ? null : current)}
                      onDrop={(event) => soltarConteudo(event, idDia)}
                      className={`schedule-day group relative overflow-hidden rounded-[2rem] p-5 shadow-xl border before:absolute before:bottom-0 before:left-0 before:top-0 before:w-1 transition ${bloqueado ? 'is-locked border-study-line/15 bg-black/[.03] before:bg-[#8A769F]' : concluido ? 'is-done border-study-line/20 bg-study-paper before:bg-[#C4B5FD]' : diaAlvo === idDia ? 'is-target border-study-line bg-study-tint ring-4 ring-[#7C3AED]/10 before:bg-study-accent' : 'is-ready border-study-line/20 bg-study-paper before:bg-[#C4B5FD] hover:before:bg-study-accent'}`}
                    >
                      <div className="schedule-day-row">
                        <span className="schedule-day-number" aria-hidden="true"><small>DIA</small>{String(index + 1).padStart(2, '0')}</span>
                        <div className="schedule-day-details flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"><div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-1">
                            Dia {index + 1}
                          </p>

                          <h3 className="text-xl font-black text-black capitalize">
                            {formatarData(dia.data_estudo)}
                          </h3>

                          <p className="text-black/60 text-sm">
                            Tempo previsto: {dia.tempo_previsto || 0} minutos
                            {conteudos.length > 0 &&
                              ` • ${conteudosConcluidos}/${conteudos.length} conteúdos`}
                          </p>
                        </div>

                        <div className="schedule-day-actions flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold border ${
                              concluido
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : bloqueado ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            }`}
                          >
                            {concluido ? 'Concluído' : bloqueado ? 'Bloqueado' : 'Pendente'}
                          </span>

                          {dia.requer_desafio && <button type="button" onClick={() => cronogramaAtual.avaliacao_em_andamento?.id_dia === idDia ? retomarAvaliacao(cronogramaAtual.avaliacao_em_andamento.id_avaliacao) : iniciarDesafio(idDia)} className="rounded-full border border-study-line px-4 py-2.5 text-sm font-bold text-study-accent">{cronogramaAtual.avaliacao_em_andamento?.id_dia === idDia ? 'Retomar desafio' : 'Desafio para liberar'}</button>}

                          {!concluido && !bloqueado && (
                            <button
                              type="button"
                              onClick={() => concluirDia(idDia)}
                              disabled={concluindo === idDia}
                              className="bg-study-accent text-white px-5 py-2.5 rounded-full font-bold hover:bg-black transition disabled:opacity-60"
                            >
                              {concluindo === idDia ? 'Salvando...' : 'Concluir'}
                            </button>
                          )}

                          {conteudos.length > 0 && !bloqueado && (
                            <button
                              type="button"
                              onClick={() => alternarExpansaoDia(idDia)}
                              className="bg-study-canvas border border-study-line/40 text-black px-4 py-2.5 rounded-full font-bold hover:bg-study-accent/20 transition"
                            >
                              {expandido ? 'Ocultar' : 'Ver conteúdos'}
                            </button>
                          )}
                        </div></div>
                      </div>

                      {expandido && conteudos.length > 0 && (
                        <div className="schedule-day-content mt-4 pt-4 border-t border-study-line/20 space-y-2">
                          <p className="text-xs uppercase tracking-[0.25em] font-black text-black/40 mb-2">
                            Materiais / Conteúdos do dia
                          </p>

                          {conteudos.map((conteudo) => {
                            const idConteudo = conteudo.id
                            const conteudoConcluido =
                              Number(conteudo.concluido) === 1

                            return (
                              <div
                                key={idConteudo}
                                className={`schedule-activity flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-[1.5rem] border ${
                                  conteudoConcluido
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-study-canvas border-study-line/20'
                                }`}
                                draggable={isGestor && !conteudoConcluido}
                                onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', String(idConteudo)); setConteudoArrastado(idConteudo) }}
                                onDragEnd={() => { setConteudoArrastado(null); setDiaAlvo(null) }}
                                title={conteudoConcluido ? undefined : 'Arraste para outro dia'}
                              >
                                <div className="flex-1">
                                  <p
                                    className={`font-bold ${
                                      conteudoConcluido
                                        ? 'text-green-700 line-through'
                                        : 'text-black'
                                    }`}
                                  >
                                    {conteudo.titulo || 'Conteúdo sem título'}
                                  </p>

                                  <p className="text-sm text-black/60">
                                    {conteudo.disciplina || conteudo.area || 'Geral'}
                                    {conteudo.nivel && ` • ${conteudo.nivel}`}
                                    {conteudo.tipo && ` • ${conteudo.tipo}`}
                                  </p>
                                </div>

                                {(
                                  <button
                                    type="button"
                                    onClick={() => navigate('/estudar', { state: { conteudo, dia } })}
                                    className="schedule-session-cta"
                                  >
                                    <span aria-hidden="true">▶</span>
                                    <span><strong>{conteudoConcluido ? 'Revisar conteúdo' : 'Começar sessão'}</strong><small>Guia de estudo e apoio da Lumi</small></span>
                                    <span className="schedule-session-arrow" aria-hidden="true">→</span>
                                  </button>
                                )}

                                {isGestor && editando === idConteudo ? (
                                  <div className="schedule-manage-actions flex flex-wrap items-center gap-2">
                                    <input
                                      value={editLink}
                                      onChange={(e) => setEditLink(e.target.value)}
                                      placeholder="https://..."
                                      className="rounded-full border border-study-line/40 bg-study-paper px-3 py-1 text-xs text-black dark:bg-study-paper dark:text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => salvarEdicao(idConteudo)}
                                      className="rounded-full bg-study-accent text-white px-3 py-1 text-xs font-bold"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditando(null)}
                                      className="rounded-full border border-study-line px-3 py-1 text-xs font-bold text-study-accent"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : isGestor ? (
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicao(conteudo)}
                                    className="schedule-manage-button"
                                  >
                                    <span aria-hidden="true">↗</span> Editar fonte
                                  </button>
                                ) : null}

                                {isGestor && (
                                  <label className={`schedule-manage-button ${enviandoMaterial === idConteudo ? 'is-loading' : ''}`}>
                                    <span aria-hidden="true">＋</span> {enviandoMaterial === idConteudo ? 'Enviando…' : 'Material de apoio'}
                                    <input
                                      type="file"
                                      accept="image/*,video/*,.pdf"
                                      className="hidden"
                                      onChange={(e) => handleUploadMaterial(e, idConteudo)}
                                    />
                                  </label>
                                )}

                                <MateriaisComplementares materiais={conteudo.materiais} onOpen={setMaterialAberto} />

                                {isGestor && !conteudoConcluido && <select
                                  aria-label={`Mover ${conteudo.titulo || 'conteúdo'} para outro dia`}
                                  value=""
                                  onChange={(event) => { if (event.target.value) moverConteudo(idConteudo, Number(event.target.value)) }}
                                  className="rounded-full border border-study-line/30 bg-study-paper px-3 py-2 text-xs font-bold text-study-accent"
                                ><option value="">Mover para…</option>{dias.filter((item) => (item.id_dia || item.id) !== idDia).map((item) => <option key={item.id_dia || item.id} value={item.id_dia || item.id}>{formatarData(item.data_estudo)}</option>)}</select>}

                                <button
                                  onClick={() =>
                                    alternarConteudo(conteudo, conteudoConcluido)
                                  }
                                  disabled={concluindoConteudo === idConteudo}
                                  className={`px-4 py-2 rounded-full text-sm font-bold transition disabled:opacity-60 ${
                                    conteudoConcluido
                                      ? 'bg-study-paper border border-study-line text-study-accent hover:bg-study-accent hover:text-white'
                                      : 'bg-study-accent text-white hover:bg-black'
                                  }`}
                                >
                                  {concluindoConteudo === idConteudo
                                    ? 'Salvando...'
                                    : conteudoConcluido
                                      ? 'Reabrir'
                                      : 'Concluir'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {bloqueado && <p className="mt-4 border-t border-study-line/20 pt-4 text-sm font-semibold text-black/55 dark:text-white/55">{dia.requer_desafio ? 'Conclua o desafio de 5 questões (4 acertos) para estudar este dia antes da data prevista.' : 'Conclua os dias anteriores para liberar esta etapa.'}</p>}
                    </div>
                  )
                })}
                {!diasVisiveis.length && <div className="schedule-plan-empty">{filtroDias === 'proximos' ? 'Nenhuma etapa pendente. Sua trilha está completa!' : 'Ainda não há etapas concluídas.'}</div>}
                </div>
              </section>
            </>
          )}
        </motion.div>
      </div>
      {materialAberto && (
        <MaterialViewer material={materialAberto} onClose={() => setMaterialAberto(null)} />
      )}
      {avaliacao && <CronogramaAssessment key={avaliacao.id_avaliacao} assessment={avaliacao} onSubmit={enviarAvaliacao} onSaveAnswer={salvarRespostaAvaliacao} onClose={() => { setAvaliacao(null); carregarCronogramas() }} />}
      {recuperacao && <div className="fixed inset-0 z-[130] grid place-items-center bg-black/60 p-4"><section className="max-w-lg rounded-[2rem] bg-study-paper p-6 text-study-ink dark:bg-study-paper dark:text-white"><h2 className="text-2xl font-black">Plano de recuperação</h2><p className="mt-2 text-sm opacity-70">Há {recuperacao.dias_atrasados} dia(s) atrasado(s) e {recuperacao.conteudos_pendentes} conteúdo(s) pendente(s).</p><div className="mt-5 grid gap-3">{recuperacao.opcoes.map((opcao) => <button key={opcao.id} onClick={async () => { if (opcao.id === 'REDISTRIBUIR' || opcao.id === 'REDUZIR') await replanejar(); setRecuperacao(null); if (opcao.id === 'MANTER') toast('O cronograma foi mantido como está.'); }} className="rounded-2xl border p-4 text-left"><b>{opcao.titulo}</b><span className="mt-1 block text-sm opacity-65">{opcao.impacto}</span></button>)}</div><button onClick={() => setRecuperacao(null)} className="mt-5 text-sm font-bold underline">Fechar</button></section></div>}
    </main>
  )
}

function MateriaisComplementares({ materiais, onOpen }) {
  let lista = []
  try { lista = Array.isArray(materiais) ? materiais : JSON.parse(materiais || '[]') } catch { lista = [] }
  if (!lista.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {lista.map((material, index) => (
        <button type="button" key={`${material.url}-${index}`} onClick={() => onOpen({ titulo: material.titulo || 'Material complementar', tipo: material.tipo, url: material.url })} className="rounded-full border border-study-line/40 px-3 py-1 text-xs font-bold text-study-accent hover:bg-study-accent/15">
          {material.tipo === 'VIDEO' ? '▶ ' : material.tipo === 'PDF' ? 'PDF ' : ''}{material.titulo || 'Material'}
        </button>
      ))}
    </div>
  )
}
