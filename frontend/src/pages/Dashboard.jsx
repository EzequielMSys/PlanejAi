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
      toast.error('Erro ao carregar dados do dashboard.')
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
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] text-black dark:text-white px-4 sm:px-6 lg:px-8 pt-0 pb-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[2rem] p-5 sm:p-6 shadow-xl mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-2">
                  PlanejAI
                </p>

                <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">
                  Olá, {nome}
                </h1>

                <p className="text-sm text-white/85 max-w-2xl">
                  Acompanhe seu progresso, próximos estudos e evolução no cronograma.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/cronograma')}
                  className="bg-white text-[#4B4C9D] px-5 py-2 rounded-full font-bold shadow-lg hover:bg-black hover:text-white transition"
                >
                  Ver cronograma
                </button>

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
            <section className="bg-white dark:bg-[#1E1D3A] rounded-[3rem] p-10 sm:p-12 text-center shadow-2xl border border-[#9394CF]/20">
              <div className="w-24 h-24 rounded-full bg-[#9394CF] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
                <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              <h2 className="text-3xl font-black text-black dark:text-white mb-3">
                Nenhum cronograma ativo
              </h2>

              <p className="text-black/60 dark:text-white/60 max-w-md mx-auto leading-relaxed mb-8">
                Gere seu primeiro cronograma personalizado com base no seu perfil de estudos.
              </p>

              <button
                type="button"
                onClick={gerarCronograma}
                disabled={gerando}
                className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-black hover:bg-black transition disabled:opacity-60"
              >
                {gerando ? 'Gerando...' : 'Gerar cronograma'}
              </button>
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
