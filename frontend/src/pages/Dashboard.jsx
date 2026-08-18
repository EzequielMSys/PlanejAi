import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import cronogramaService from '../services/cronogramaService'

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

export default function Dashboard() {
  const { user, isAdmin, isDono } = useAuth()
  const navigate = useNavigate()
  const isGestor = isAdmin || isDono || user?.tipo === 'docente'

  const [cronogramas, setCronogramas] = useState([])
  const [loading, setLoading] = useState(true)
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    try {
      const data = await cronogramaService.listarCronogramas()
      setCronogramas(Array.isArray(data) ? data : [])
    } catch (error) {
      // Se for gestor e der erro no cronograma, não bloquear a página inteira
      if (!isGestor) {
        toast.error('Erro ao carregar dados do dashboard.')
      }
    } finally {
      setLoading(false)
    }
  }

  const cronogramaAtual = cronogramas[0]
  const dias = cronogramaAtual?.dias || []

  const stats = useMemo(() => {
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

    return {
      totalDias,
      diasConcluidos,
      progresso,
      tempoTotal,
      proximoDia
    }
  }, [dias])

  async function gerarCronograma() {
    setGerando(true)

    try {
      await cronogramaService.gerarCronograma()
      await carregarDados()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao gerar cronograma.')
    } finally {
      setGerando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] flex items-center justify-center">
        <div className="bg-white dark:bg-[#1E1D3A] rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60 dark:text-white/60">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  const nome = user?.apelido || user?.nome || 'estudante'

  return (
    <div className="min-h-screen px-4 pb-10 pt-6 text-[#202027] dark:text-white sm:px-6 lg:px-8">

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="workspace-hero compact-workspace-hero relative mb-5 overflow-hidden rounded-3xl border border-[#E6E5E9] bg-white p-6 shadow-[0_18px_55px_-45px_rgba(28,25,65,.55)] dark:border-white/10 dark:bg-[#1B1B1F] sm:p-7">
            <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-[#6157D9]" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#77727F] dark:text-white/40">
                  Visão geral
                </p>

                <h1 className="mb-1 text-2xl font-black tracking-[-0.035em] text-[#202027] dark:text-white md:text-3xl">
                  Olá, {nome}
                </h1>

                <p className="max-w-2xl text-sm text-[#6F6D78] dark:text-white/55">
                  Acompanhe seu progresso, próximos estudos e evolução no cronograma.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/cronograma')}
                  className="rounded-xl border border-[#DEDBE8] bg-[#F7F6FA] px-5 py-2.5 font-bold text-[#484252] transition hover:border-[#BDB7D3] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  Ver cronograma
                </button>

                {isGestor && (
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard-gestor')}
                    className="bg-black text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-white hover:text-[#4B4C9D] transition"
                  >
                    Painel Gestor
                  </button>
                )}

                {isDono && (
                  <button
                    type="button"
                    onClick={() => navigate('/dono')}
                    className="bg-black text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-white hover:text-[#4B4C9D] transition"
                  >
                    Painel Dono
                  </button>
                )}

                {isAdmin && !isDono && (
                  <button
                    type="button"
                    onClick={() => navigate('/usuarios')}
                    className="bg-black text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-white hover:text-[#4B4C9D] transition"
                  >
                    Painel Admin
                  </button>
                )}
              </div>
            </div>
          </section>

{!cronogramaAtual ? (
            <section className="grid overflow-hidden rounded-3xl border border-[#E5E3E8] bg-white shadow-[0_24px_70px_-50px_rgba(28,25,65,.5)] dark:border-white/10 dark:bg-[#1B1B1F] md:grid-cols-[1.25fr_.75fr]">
              <div className="flex flex-col items-start justify-center p-8 sm:p-10 lg:p-12">
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ECEAFB] text-[#6157D9] dark:bg-white/10 dark:text-[#B8B2FF]">
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <p className="mb-3 text-[11px] font-black uppercase tracking-[.18em] text-[#77727F] dark:text-white/40">Primeiro passo</p>
              <h2 className="mb-3 max-w-lg text-3xl font-black tracking-[-0.04em] text-[#202027] dark:text-white sm:text-4xl">
                Transforme sua rotina em um plano possível.
              </h2>

              <p className="mb-8 max-w-lg leading-relaxed text-[#6F6D78] dark:text-white/55">
                O cronograma usa seu objetivo, matérias e horários disponíveis para distribuir os estudos sem sobrecarregar seus dias.
              </p>

              <button
                type="button"
                onClick={gerarCronograma}
                disabled={gerando}
                className="rounded-xl bg-[#6157D9] px-7 py-3.5 font-extrabold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[#5147C4] dark:shadow-none disabled:opacity-60"
              >
                {gerando ? 'Gerando...' : 'Gerar cronograma'}
              </button>
              </div>

              <aside className="border-t border-[#E8E6EC] bg-[#F5F4F1] p-8 dark:border-white/10 dark:bg-[#232327] md:border-l md:border-t-0 sm:p-10">
                <p className="text-sm font-black text-[#2F2D35] dark:text-white">O que será considerado</p>
                <div className="mt-6 space-y-5">
                  {[
                    ['01', 'Seu objetivo', 'ENEM, vestibular ou curso'],
                    ['02', 'Tempo disponível', 'Dias e horários reais'],
                    ['03', 'Matérias prioritárias', 'Foco no que mais importa']
                  ].map(([number, title, text]) => (
                    <div key={number} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-black text-[#6157D9] shadow-sm dark:bg-white/10 dark:text-[#B8B2FF]">{number}</span>
                      <span><strong className="block text-sm text-[#34323A] dark:text-white">{title}</strong><small className="text-[#817E88] dark:text-white/45">{text}</small></span>
                    </div>
                  ))}
                </div>
              </aside>
            </section>
          ) : (
            <>
              <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <CardStat titulo="Progresso geral" valor={`${stats.progresso}%`} />
                <CardStat titulo="Dias planejados" valor={stats.totalDias} />
                <CardStat titulo="Dias concluídos" valor={stats.diasConcluidos} />
                <CardStat titulo="Tempo previsto" valor={`${stats.tempoTotal} min`} />
              </section>

<section className="grid lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white dark:bg-[#1E1D3A] rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
                  <div className="flex justify-between text-sm font-bold mb-2">
                    <span>Progresso do cronograma</span>
                    <span>{stats.progresso}%</span>
                  </div>

                  <div className="h-4 bg-[#F7F7FB] dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4B4C9D] dark:bg-[#A9AAE8] rounded-full transition-all"
                      style={{ width: `${stats.progresso}%` }}
                    />
                  </div>

                  <p className="text-black/60 dark:text-white/60 text-sm mt-4">
                    {stats.diasConcluidos} de {stats.totalDias} dias concluídos.
                  </p>
                </div>

                <div className="bg-white dark:bg-[#1E1D3A] rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
                  <p className="text-sm font-bold text-black/50 dark:text-white/50 mb-1">
                    Próximo estudo
                  </p>

                  <p className="text-lg font-black text-black dark:text-white capitalize">
                    {stats.proximoDia
                      ? formatarData(stats.proximoDia.data_estudo)
                      : 'Tudo concluído'}
                  </p>

                  <p className="text-sm text-black/60 dark:text-white/60 mt-1">
                    {stats.proximoDia
                      ? `${stats.proximoDia.tempo_previsto || 0} minutos previstos`
                      : 'Parabéns pelo progresso!'}
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate('/cronograma')}
                    className="mt-5 w-full bg-[#4B4C9D] text-white px-5 py-3 rounded-full font-bold hover:bg-black transition"
                  >
                    Abrir cronograma
                  </button>
                </div>
              </section>

              <section className="bg-white dark:bg-[#1E1D3A] rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-black dark:text-white">
                      Próximos estudos
                    </h2>

                    <p className="text-black/60 dark:text-white/60">
                      Veja os próximos dias pendentes do seu plano.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/cronograma')}
                    className="bg-[#F7F7FB] dark:bg-white/10 dark:text-white border border-[#9394CF]/40 text-black px-5 py-3 rounded-full font-bold hover:bg-[#9394CF]/20 transition"
                  >
                    Ver todos
                  </button>
                </div>

                <div className="grid gap-3">
                  {dias
                    .filter((dia) => Number(dia.concluido) !== 1 && dia.status !== 'concluído')
                    .slice(0, 5)
                    .map((dia, index) => (
                      <div
                        key={dia.id_dia || dia.id || index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F7F7FB] dark:bg-white/5 rounded-[2rem] p-4 border border-[#9394CF]/20"
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] font-black text-[#4B4C9D] dark:text-[#A9AAE8] mb-1">
                            Próximo estudo
                          </p>

                          <p className="font-black text-black dark:text-white capitalize">
                            {formatarData(dia.data_estudo)}
                          </p>
                        </div>

                        <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 text-sm font-bold w-fit">
                          {dia.tempo_previsto || 0} min
                        </span>
                      </div>
                    ))}

                  {dias.filter((dia) => Number(dia.concluido) !== 1 && dia.status !== 'concluído').length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-black/60 dark:text-white/60 font-bold">
                        Todos os estudos foram concluídos.
                      </p>
                    </div>
                  )}
                </div>
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
    <div className="bg-white dark:bg-[#1E1D3A] rounded-[2rem] p-6 shadow-xl border border-[#9394CF]/20">
      <p className="text-sm font-bold text-black/50 dark:text-white/50 mb-1">
        {titulo}
      </p>

      <p className="text-3xl font-black text-[#4B4C9D] dark:text-[#A9AAE8]">
        {valor}
      </p>
    </div>
  )
}
