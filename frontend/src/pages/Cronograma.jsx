import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import confetti from 'canvas-confetti'
import cronogramaService from '../services/cronogramaService'
import { useAuth } from '../context/AuthContext'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

function formatarData(data) {
  if (!data) return '-'

  return new Date(data).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit'
  })
}

export default function Cronograma() {
  const { isGestor } = useAuth()
  const [cronogramas, setCronogramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)
  const [concluindo, setConcluindo] = useState(null)
  const [concluindoConteudo, setConcluindoConteudo] = useState(null)
  const [diasExpandidos, setDiasExpandidos] = useState({})
  const [editando, setEditando] = useState(null)
  const [editLink, setEditLink] = useState('')
  const [enviandoMaterial, setEnviandoMaterial] = useState(null)
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

  // Dispara confetes quando o cronograma atinge 100% de conclusão
  useEffect(() => {
    if (
      progresso === 100 &&
      totalDias > 0 &&
      !celebradoRef.current
    ) {
      celebradoRef.current = true

      const cores = ['#4B4C9D', '#9394CF', '#FFD700', '#FF6B6B', '#4ECB71', '#FFA500']

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
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60">Carregando cronograma...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
                  PlanejAI
                </p>

                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                  Cronograma de Estudos
                </h1>

                <p className="text-lg text-white/85 max-w-2xl">
                  Acompanhe seu plano personalizado, veja seu progresso e marque os estudos concluídos.
                </p>
              </div>

              <button
                type="button"
                onClick={gerarNovoCronograma}
                disabled={gerando}
                className="bg-white text-[#4B4C9D] px-7 py-3 rounded-full font-black shadow-xl hover:bg-black hover:text-white transition disabled:opacity-60"
              >
                {gerando
                  ? 'Gerando...'
                  : cronogramaAtual
                    ? 'Regenerar cronograma'
                    : 'Gerar cronograma'}
              </button>
            </div>
          </section>

          {!cronogramaAtual ? (
            <section className="bg-white rounded-[3rem] p-10 sm:p-12 text-center shadow-2xl border border-[#9394CF]/20">
              <div className="w-24 h-24 rounded-full bg-[#9394CF] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
                <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-3xl font-black text-black mb-3">
                Nenhum cronograma encontrado
              </h2>

              <p className="text-black/60 max-w-md mx-auto leading-relaxed mb-8">
                Gere seu primeiro cronograma com base no seu perfil de estudo e disponibilidade semanal.
              </p>

              <button
                type="button"
                onClick={gerarNovoCronograma}
                disabled={gerando}
                className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-black hover:bg-black transition disabled:opacity-60"
              >
                {gerando ? 'Gerando...' : 'Gerar agora'}
              </button>
            </section>
          ) : (
            <>
              <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CardStat titulo="Progresso" valor={`${progresso}%`} />
                <CardStat titulo="Dias planejados" valor={totalDias} />
                <CardStat titulo="Dias concluídos" valor={diasConcluidos} />
                <CardStat titulo="Tempo previsto" valor={`${tempoTotal} min`} />
              </section>

              <section className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>Progresso geral</span>
                    <span>{progresso}%</span>
                  </div>

                  <div className="h-4 bg-[#F7F7FB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4B4C9D] rounded-full transition-all"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
                  <p className="text-sm font-bold text-black/50 mb-1">
                    Próximo estudo
                  </p>

                  <p className="text-lg font-black text-black capitalize">
                    {proximoDia ? formatarData(proximoDia.data_estudo) : 'Tudo concluído'}
                  </p>

                  <p className="text-sm text-black/60 mt-1">
                    {proximoDia
                      ? `${proximoDia.tempo_previsto || 0} minutos previstos`
                      : 'Parabéns pelo progresso!'}
                  </p>
                </div>
              </section>

<section className="grid gap-4">
                {dias.map((dia, index) => {
                  const idDia = dia.id_dia || dia.id
                  const concluido =
                    Number(dia.concluido) === 1 ||
                    dia.status === 'concluído'

                  const conteudos = dia.conteudos || []
                  const expandido = Boolean(diasExpandidos[idDia])

                  const conteudosConcluidos = conteudos.filter(
                    (c) => Number(c.concluido) === 1
                  ).length

                  return (
                    <div
                      key={idDia || index}
                      className="bg-white rounded-[2rem] p-5 shadow-xl border border-[#9394CF]/20"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-xs uppercase tracking-[0.25em] font-black text-[#4B4C9D] mb-1">
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

                        <div className="flex items-center gap-3">
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-bold border ${
                              concluido
                                ? 'bg-green-100 text-green-700 border-green-300'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            }`}
                          >
                            {concluido ? 'Concluído' : 'Pendente'}
                          </span>

                          {!concluido && (
                            <button
                              type="button"
                              onClick={() => concluirDia(idDia)}
                              disabled={concluindo === idDia}
                              className="bg-[#4B4C9D] text-white px-5 py-2.5 rounded-full font-bold hover:bg-black transition disabled:opacity-60"
                            >
                              {concluindo === idDia ? 'Salvando...' : 'Concluir'}
                            </button>
                          )}

                          {conteudos.length > 0 && (
                            <button
                              type="button"
                              onClick={() => alternarExpansaoDia(idDia)}
                              className="bg-[#F7F7FB] border border-[#9394CF]/40 text-black px-4 py-2.5 rounded-full font-bold hover:bg-[#9394CF]/20 transition"
                            >
                              {expandido ? 'Ocultar' : 'Ver conteúdos'}
                            </button>
                          )}
                        </div>
                      </div>

                      {expandido && conteudos.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#9394CF]/20 space-y-2">
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
                                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-[1.5rem] border ${
                                  conteudoConcluido
                                    ? 'bg-green-50 border-green-200'
                                    : 'bg-[#F7F7FB] border-[#9394CF]/20'
                                }`}
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

                                {conteudo.link && (
                                  <a
                                    href={conteudo.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#4B4C9D] text-sm font-bold hover:underline"
                                  >
                                    Acessar material
                                  </a>
                                )}

                                {isGestor && editando === idConteudo ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <input
                                      value={editLink}
                                      onChange={(e) => setEditLink(e.target.value)}
                                      placeholder="https://..."
                                      className="rounded-full border border-[#9394CF]/40 bg-white px-3 py-1 text-xs text-black dark:bg-[#1E1D3A] dark:text-white"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => salvarEdicao(idConteudo)}
                                      className="rounded-full bg-[#4B4C9D] text-white px-3 py-1 text-xs font-bold"
                                    >
                                      Salvar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditando(null)}
                                      className="rounded-full border border-[#9394CF] px-3 py-1 text-xs font-bold text-[#4B4C9D]"
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                ) : isGestor ? (
                                  <button
                                    type="button"
                                    onClick={() => iniciarEdicao(conteudo)}
                                    className="text-xs font-bold text-[#4B4C9D] hover:underline"
                                  >
                                    Editar link
                                  </button>
                                ) : null}

                                {isGestor && (
                                  <label className="text-xs font-bold text-[#4B4C9D] cursor-pointer">
                                    {enviandoMaterial === idConteudo ? 'Enviando...' : 'Anexar material'}
                                    <input
                                      type="file"
                                      accept="image/*,video/*,.pdf"
                                      className="hidden"
                                      onChange={(e) => handleUploadMaterial(e, idConteudo)}
                                    />
                                  </label>
                                )}

                                <MateriaisComplementares materiais={conteudo.materiais} />

                                <button
                                  type="button"
                                  onClick={() =>
                                    alternarConteudo(conteudo, conteudoConcluido)
                                  }
                                  disabled={concluindoConteudo === idConteudo}
                                  className={`px-4 py-2 rounded-full text-sm font-bold transition disabled:opacity-60 ${
                                    conteudoConcluido
                                      ? 'bg-white border border-[#4B4C9D] text-[#4B4C9D] hover:bg-[#4B4C9D] hover:text-white'
                                      : 'bg-[#4B4C9D] text-white hover:bg-black'
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
                    </div>
                  )
                })}
              </section>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function CardStat({ titulo, valor }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-[#9394CF]/20">
      <p className="text-sm font-bold text-black/50 mb-1">
        {titulo}
      </p>

      <p className="text-3xl font-black text-[#4B4C9D]">
        {valor}
      </p>
    </div>
  )
}

function MateriaisComplementares({ materiais }) {
  let lista = []
  try { lista = Array.isArray(materiais) ? materiais : JSON.parse(materiais || '[]') } catch { lista = [] }
  if (!lista.length) return null

  return (
    <div className="flex flex-wrap gap-2">
      {lista.map((material, index) => (
        <a key={`${material.url}-${index}`} href={material.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[#9394CF]/40 px-3 py-1 text-xs font-bold text-[#4B4C9D] hover:bg-[#9394CF]/15">
          {material.tipo === 'VIDEO' ? '▶ ' : material.tipo === 'PDF' ? 'PDF ' : ''}{material.titulo || 'Material'}
        </a>
      ))}
    </div>
  )
}
