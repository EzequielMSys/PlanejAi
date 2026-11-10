import { Fragment, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import cronogramaService from '../services/cronogramaService'
import { useAuth } from '../context/AuthContext'
import MaterialViewer from '../components/MaterialViewer'
import CronogramaAssessment from '../components/CronogramaAssessment'
import { exportarCronograma } from '../utils/calendarExport'
import './Cronograma.css'
import DailyPlanActions from '../components/DailyPlanActions'
import { dailyStudy, localStudyDate } from '../utils/dailyStudy'
import { mondayOf, shiftDate } from '../utils/scheduleWeek'
import RecoveryState from '../components/RecoveryState'
import '../components/StudyRecommendations.css'
import ScheduleWeek from '../components/ScheduleWeek'
import { scopedCacheKey } from '../utils/offlineStore'

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
  const [loadError, setLoadError] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [concluindo, setConcluindo] = useState(null)
  const [concluindoConteudo, setConcluindoConteudo] = useState(null)
  const [diasExpandidos, setDiasExpandidos] = useState({})
  const [filtroDias, setFiltroDias] = useState('proximos')
  const [scheduleView, setScheduleView] = useState(() => { try { return localStorage.getItem(scopedCacheKey('schedule-view')) === 'list' ? 'list' : 'week' } catch { return 'week' } })
  const [weekAnchor, setWeekAnchor] = useState(null)
  const changeScheduleView = view => { setScheduleView(view); try { localStorage.setItem(scopedCacheKey('schedule-view'),view) } catch { /* A escolha continua disponível nesta tela. */ } }
  const [editando, setEditando] = useState(null)
  const [editLink, setEditLink] = useState('')
  const [enviandoMaterial, setEnviandoMaterial] = useState(null)
  const [materialAberto, setMaterialAberto] = useState(null)
  const [conteudoArrastado, setConteudoArrastado] = useState(null)
  const [diaAlvo, setDiaAlvo] = useState(null)
  const [avaliacao, setAvaliacao] = useState(null)
  const [recuperacao, setRecuperacao] = useState(null)

  async function carregarCronogramas() {
    setLoading(true)
    try {
      const data = await cronogramaService.listarCronogramas()
      if (!Array.isArray(data)) throw new Error('Resposta inválida ao consultar o plano.')
      setCronogramas(data)
      setLoadError(false)
    } catch (error) {
      setLoadError(true)
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

  const cronogramaAtual = cronogramas.find(plano => plano.status === 'ATIVO') || cronogramas[0]

  const dias = useMemo(() => {
    return [...(cronogramaAtual?.dias || [])].sort((a, b) => localStudyDate(a.data_estudo).localeCompare(localStudyDate(b.data_estudo)))
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

  const { day: proximoDia } = dailyStudy(cronogramas)
  const atividadesProximas = proximoDia?.conteudos || []
  const feitasProximas = atividadesProximas.filter(item => Number(item.concluido) === 1).length
  const filtroEfetivo = filtroDias
  const diasVisiveis = dias.map((dia, index) => ({ dia, index })).filter(({ dia }) => {
    const concluido = Number(dia.concluido) === 1 || dia.status === 'concluído'
    return filtroEfetivo === 'todos' || (filtroEfetivo === 'concluidos' ? concluido : !concluido)
  })

  function abrirDia(idDia) {
    setScheduleView('list')
    setFiltroDias('todos')
    const day = dias.find(item => Number(item.id_dia || item.id) === Number(idDia))
    setDiasExpandidos((atuais) => ({ ...atuais, [idDia]: !day?.bloqueado }))
    requestAnimationFrame(() => {
      const target = document.getElementById(`schedule-day-${idDia}`)
      target?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
      const heading = target?.querySelector('h3'); heading?.setAttribute('tabindex','-1'); heading?.focus({ preventScroll:true })
    })
  }

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

  if (loadError) return <main className="schedule-page"><h1 className="sr-only">Cronograma de estudos</h1><RecoveryState title="Seu cronograma não pôde ser consultado." onRetry={() => { carregarCronogramas() }}>Isso não significa que seu plano foi apagado. Tente carregar novamente antes de criar ou substituir um cronograma.</RecoveryState></main>
  return (
    <main className="schedule-page schedule-compact">
      <div className="schedule-shell">
        <header className="schedule-heading">
          <div>
            <p className="pj-eyebrow">Seu planejamento</p>
            <h1>Cronograma de estudos.</h1>
            <p>Acompanhe seu ritmo e organize seus próximos passos.</p>
          </div>
          {cronogramaAtual && <details className="schedule-manage">
            <summary>Gerenciar cronograma</summary>
            <div>
              <button type="button" onClick={gerarNovoCronograma} disabled={gerando}>{gerando ? 'Gerando…' : 'Regenerar cronograma'}</button>
              <button type="button" onClick={abrirRecuperacao}>Plano de recuperação</button>
              <button type="button" onClick={() => exportarCronograma(cronogramaAtual)}>Exportar calendário</button>
            </div>
          </details>}
        </header>
          {!cronogramaAtual ? (
            <section className="schedule-next">
              <h2>Sua semana ainda está em branco.</h2>
              <p>Monte um cronograma com as matérias e os horários do seu perfil.</p>
              <button type="button" className="pn-command" onClick={gerarNovoCronograma} disabled={gerando}>
                {gerando ? 'Montando sua semana...' : perfilCompleto ? 'Montar meu cronograma' : 'Escolher matérias e horários'}
              </button>
            </section>
          ) : (
            <>
              <section className="schedule-next" aria-labelledby="schedule-next-title">
                <h2 id="schedule-next-title">Seu próximo estudo</h2>
                {proximoDia ? <>
                  <h3>{formatarData(proximoDia.data_estudo)}</h3>
                  <p>{atividadesProximas.filter(item => Number(item.concluido) !== 1).slice(0, 2).map(item => item.titulo || item.disciplina).filter(Boolean).join(' · ')}</p>
                  <p>{proximoDia.bloqueado ? 'Bloqueado' : feitasProximas ? 'Em andamento' : 'Disponível'} · {feitasProximas} de {atividadesProximas.length} atividades concluídas{Number(proximoDia.tempo_previsto) > 0 && ` · ${proximoDia.tempo_previsto} min previstos`}</p>
                  <button type="button" className="pn-command" onClick={() => abrirDia(proximoDia.id_dia || proximoDia.id)}>{proximoDia.bloqueado ? 'Consultar etapa' : 'Ver atividades'}</button>
                </> : <p>{totalDias && diasConcluidos === totalDias ? 'Todas as etapas foram concluídas.' : 'O plano não tem atividades pendentes disponíveis.'}</p>}
              </section>
              <section className="schedule-progress" aria-label="Resumo do cronograma">
                <div><strong>Progresso geral · {progresso}%</strong><div className="schedule-overview-bar" role="progressbar" aria-label="Progresso do cronograma" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progresso}><i style={{ width: `${progresso}%` }} /></div></div>
                <p>{diasConcluidos} de {totalDias} dias concluídos</p>
                <p>{tempoTotal} min planejados</p>
              </section>

              {cronogramaAtual.avaliacao_em_andamento && <section className="schedule-milestone"><span>AVALIAÇÃO EM ANDAMENTO</span><h2>{cronogramaAtual.avaliacao_em_andamento.tipo === 'FINAL' ? 'Sua prova final está pronta para continuar.' : 'Seu desafio de avanço está pronto para continuar.'}</h2><p>Você pode voltar quando quiser. As questões permanecem as mesmas; neste aparelho, suas escolhas também são preservadas.</p><div><button type="button" onClick={() => retomarAvaliacao(cronogramaAtual.avaliacao_em_andamento.id_avaliacao)}>Retomar {cronogramaAtual.avaliacao_em_andamento.tipo === 'FINAL' ? 'prova final' : 'desafio'} <b aria-hidden="true">→</b></button><button type="button" onClick={() => abandonarAvaliacao(cronogramaAtual.avaliacao_em_andamento.id_avaliacao)}>Descartar avaliação</button></div></section>}
              {cronogramaAtual.prova_final?.disponivel && !cronogramaAtual.avaliacao_em_andamento && <section className="schedule-milestone"><span>ETAPA FINAL</span><h2>Você percorreu o plano. Agora mostre o que aprendeu.</h2><p>A prova final reúne 20 questões das matérias estudadas. São necessários 14 acertos para concluir a trilha.</p><div><button type="button" onClick={iniciarProvaFinal}>Iniciar prova final <b aria-hidden="true">→</b></button></div></section>}
              {cronogramaAtual.prova_final?.concluida && <section className="schedule-milestone is-complete"><span>TRILHA CERTIFICADA</span><h2>Seu esforço virou conquista.</h2><p>Você concluiu o cronograma e foi aprovado na prova final.</p></section>}

              <section className="schedule-plan" aria-labelledby="schedule-plan-title">
                <div className="schedule-legend" aria-label="Estados das etapas"><span><b aria-hidden="true">○</b>Disponível para estudar</span><span><b aria-hidden="true">◇</b>Aguardando liberação</span><span><b aria-hidden="true">✓</b>Concluído</span></div>
                <div className="schedule-view-toggle" role="group" aria-label="Visualização do cronograma">{[['list','Lista detalhada'],['week','Semana']].map(([view,label]) => <button key={view} type="button" aria-pressed={scheduleView === view} aria-controls="schedule-view-content" onClick={() => changeScheduleView(view)}>{label}</button>)}</div>
                <div className="schedule-plan-head"><div><span>{scheduleView === 'week' ? 'SEMANA A SEMANA' : 'PLANO COMPLETO'}</span><h2 id="schedule-plan-title">{scheduleView === 'week' ? 'Encontre espaço para o próximo passo.' : 'Suas etapas, em detalhe.'}</h2><p>Abra um dia para estudar, revisar materiais ou acompanhar o que já fez.</p></div>{scheduleView === 'list' && <div className="schedule-plan-filters" role="group" aria-label="Filtrar dias do cronograma">{[['proximos', 'Próximos'], ['concluidos', 'Concluídos'], ['todos', 'Todos']].map(([valor, rotulo]) => <button key={valor} type="button" aria-pressed={filtroEfetivo === valor} onClick={() => setFiltroDias(valor)}>{rotulo}</button>)}</div>}</div>
                <div id="schedule-view-content">{scheduleView === 'week' ? <ScheduleWeek days={dias} onOpenDay={abrirDia} initialWeek={weekAnchor} onWeekChange={setWeekAnchor} /> : <div className="schedule-plan-list">
                {diasVisiveis.map(({ dia, index }, position) => {
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

                  const week = mondayOf(localStudyDate(dia.data_estudo))
                  const previous = diasVisiveis[position - 1]
                  const startsWeek = !previous || mondayOf(localStudyDate(previous.dia.data_estudo)) !== week
                  return (
                    <Fragment key={idDia || index}>
                    {startsWeek && <h3 className="schedule-week-divider">{formatarData(week)} a {formatarData(shiftDate(week, 6))}</h3>}
                    <div
                      id={`schedule-day-${idDia}`}
                      onDragOver={(event) => { event.preventDefault(); if (conteudoArrastado) setDiaAlvo(idDia) }}
                      onDragLeave={() => setDiaAlvo((current) => current === idDia ? null : current)}
                      onDrop={(event) => soltarConteudo(event, idDia)}
                      className={`schedule-day ${bloqueado ? 'is-locked' : concluido ? 'is-done' : 'is-ready'}${diaAlvo === idDia ? ' is-target' : ''}`}
                    >
                      <div className="schedule-day-row">
                        <div className="schedule-day-details flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"><div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.25em] font-black text-study-accent mb-1">
                            Dia {index + 1}
                          </p>

                          <h3 className="text-xl font-black text-black capitalize">
                            {formatarData(dia.data_estudo)}
                          </h3>

                          <p className="text-black/60 text-sm">
                            {Number(dia.tempo_previsto) > 0 && `${dia.tempo_previsto} min previstos`}
                            {conteudos.length > 0 &&
                              ` · ${conteudosConcluidos}/${conteudos.length} atividades concluídas`}
                            {!bloqueado && conteudos[0]?.titulo && ` · ${conteudos[0].titulo}`}
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

                          {dia.requer_desafio && <button type="button" onClick={() => cronogramaAtual.avaliacao_em_andamento?.id_dia === idDia ? retomarAvaliacao(cronogramaAtual.avaliacao_em_andamento.id_avaliacao) : iniciarDesafio(idDia)} className="pn-tool rounded-full border border-study-line px-4 py-2.5 text-sm font-bold text-study-accent">{cronogramaAtual.avaliacao_em_andamento?.id_dia === idDia ? 'Retomar desafio' : 'Desafio para liberar'}</button>}

                          {!concluido && !bloqueado && (
                            <button
                              type="button"
                              onClick={() => concluirDia(idDia)}
                              disabled={concluindo === idDia}
                              className="pn-command bg-study-accent text-white px-5 py-2.5 rounded-full font-bold hover:bg-black transition disabled:opacity-60"
                            >
                              {concluindo === idDia ? 'Salvando...' : 'Concluir'}
                            </button>
                          )}

                          {conteudos.length > 0 && !bloqueado && (
                            <button
                              type="button"
                              aria-expanded={expandido}
                              onClick={() => alternarExpansaoDia(idDia)}
                              className="pn-tool bg-study-canvas border border-study-line/40 text-black px-4 py-2.5 rounded-full font-bold hover:bg-study-accent/20 transition"
                            >
                              {expandido ? 'Ocultar' : 'Ver conteúdos'}
                            </button>
                          )}
                        </div></div>
                      </div>

                      {expandido && !bloqueado && conteudos.length > 0 && (
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
                                      className="pn-command rounded-full bg-study-accent text-white px-3 py-1 text-xs font-bold"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditando(null)}
                                      className="pn-tool rounded-full border border-study-line px-3 py-1 text-xs font-bold text-study-accent"
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
                      {bloqueado && dia.requer_desafio && <p className="mt-4 border-t border-study-line/20 pt-4 text-sm font-semibold text-black/55 dark:text-white/55">{dia.requer_desafio ? 'Conclua o desafio de 5 questões (4 acertos) para estudar este dia antes da data prevista.' : 'Conclua os dias anteriores para liberar esta etapa.'}</p>}
                    </div>
                    </Fragment>
                  )
                })}
                {!diasVisiveis.length && <div className="schedule-plan-empty">{filtroDias === 'proximos' ? 'Nenhuma etapa pendente.' : filtroDias === 'concluidos' ? 'Ainda não há etapas concluídas.' : 'Este plano ainda não tem etapas.'}</div>}
                </div>}</div>
              </section>
              <DailyPlanActions schedules={cronogramas} onSaved={carregarCronogramas} />
              <details className="study-recommendation"><summary>Como este plano escolhe as atividades?</summary><p>Na geração, as matérias vêm das áreas de foco do perfil. Os conteúdos são distribuídos nos dias livres, em blocos de aproximadamente 30 minutos; a ordem pode priorizar os pesos da próxima prova cadastrada. O tempo de cada dia é uma previsão, não uma obrigação.</p><p>As revisões ficam em Aprendizagem: a próxima data muda conforme sua avaliação do conteúdo. Este cronograma não pressupõe dificuldade só porque uma atividade ficou pendente.</p><div className="study-recommendation-actions"><a href="#/perfil">Ajustar matérias e disponibilidade</a><a href="#/aprendizagem">Conferir e ajustar revisões</a></div><p>Alterar o perfil não reescreve o plano atual. Para mudar só o dia, use “Seu dia mudou?”. Para gerar outra distribuição, confira a opção de novo cronograma.</p></details>
            </>
          )}
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
        <button type="button" key={`${material.url}-${index}`} onClick={() => onOpen({ titulo: material.titulo || 'Material complementar', tipo: material.tipo, url: material.url })} className="pn-tool rounded-full border border-study-line/40 px-3 py-1 text-xs font-bold text-study-accent hover:bg-study-accent/15">
          {material.tipo === 'VIDEO' ? '▶ ' : material.tipo === 'PDF' ? 'PDF ' : ''}{material.titulo || 'Material'}
        </button>
      ))}
    </div>
  )
}
