import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import redacaoService from '../services/redacaoService'

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

export default function Redacoes() {
  const [redacoes, setRedacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [modoEscrita, setModoEscrita] = useState(false)
  const [selecionada, setSelecionada] = useState(null)

  const [form, setForm] = useState({
    tema: '',
    texto: ''
  })

  async function carregarRedacoes() {
    try {
      const data = await redacaoService.listarRedacoes()
      setRedacoes(Array.isArray(data) ? data : [])
    } catch (error) {
      toast.error('Erro ao carregar redações.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarRedacoes()
  }, [])

  const handleEnviar = async (e) => {
    e.preventDefault()

    if (!form.tema.trim() || !form.texto.trim()) {
      toast.error('Preencha o tema e o texto da redação.')
      return
    }

    setEnviando(true)

    try {
      const novaRedacao = await redacaoService.enviarRedacao(form)

      setRedacoes((prev) => [novaRedacao, ...prev])
      setForm({ tema: '', texto: '' })
      setModoEscrita(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao enviar redação.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60">Carregando redações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative z-10">
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
                  Redações
                </h1>

                <p className="text-lg text-white/85 max-w-2xl">
                  Pratique a escrita, envie suas redações e receba feedback automático.
                </p>
              </div>

              {!modoEscrita && (
                <button
                  type="button"
                  onClick={() => setModoEscrita(true)}
                  className="bg-white text-[#4B4C9D] px-7 py-3 rounded-full font-black shadow-xl hover:bg-black hover:text-white transition"
                >
                  Nova redação
                </button>
              )}
            </div>
          </section>

          {modoEscrita ? (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-[#9394CF]/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black">
                  Escrever redação
                </h2>

                <button
                  type="button"
                  onClick={() => setModoEscrita(false)}
                  className="text-sm font-bold text-black/60 hover:text-black transition"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleEnviar} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Tema
                  </label>
                  <input
                    type="text"
                    value={form.tema}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tema: e.target.value }))
                    }
                    placeholder="Ex: O papel da tecnologia na educação brasileira"
                    className="w-full rounded-[1.5rem] px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Texto (dissertativo-argumentativo)
                  </label>
                  <textarea
                    value={form.texto}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, texto: e.target.value }))
                    }
                    rows={12}
                    placeholder="Escreva sua redação aqui..."
                    className="w-full rounded-[1.5rem] px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none resize-y"
                  />
                  <p className="text-xs text-black/50 mt-1">
                    {form.texto.trim().length} caracteres
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-black hover:bg-black transition disabled:opacity-60"
                >
                  {enviando ? 'Enviando...' : 'Enviar redação'}
                </button>
              </form>
            </motion.div>
          ) : (
            <>
              {redacoes.length === 0 ? (
                <section className="bg-white rounded-[3rem] p-10 sm:p-12 text-center shadow-2xl border border-[#9394CF]/20">
                  <div className="w-24 h-24 rounded-full bg-[#9394CF] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
                    <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </div>

                  <h2 className="text-3xl font-black text-black mb-3">
                    Nenhuma redação enviada
                  </h2>

                  <p className="text-black/60 max-w-md mx-auto leading-relaxed mb-8">
                    Escreva sua primeira redação e receba um feedback automático com nota estimada.
                  </p>

                  <button
                    type="button"
                    onClick={() => setModoEscrita(true)}
                    className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-black hover:bg-black transition"
                  >
                    Escrever redação
                  </button>
                </section>
              ) : (
                <section className="grid gap-4">
                  {redacoes.map((redacao) => {
                    const nota =
                      redacao.nota_estimada ??
                      redacao.nota ??
                      redacao.notaEstimada

                    const feedback =
                      redacao.feedback_ia ??
                      redacao.feedback ??
                      redacao.feedbackIa

                    const selecionadaE =
                      selecionada?.id_redacao === redacao.id_redacao

                    return (
                      <div
                        key={redacao.id_redacao}
                        className="bg-white rounded-[2rem] p-5 shadow-xl border border-[#9394CF]/20"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] font-black text-[#4B4C9D] mb-1">
                              {formatarData(redacao.enviada_em)}
                            </p>

                            <h3 className="text-xl font-black text-black">
                              {redacao.tema}
                            </h3>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="px-4 py-2 rounded-full bg-[#4B4C9D]/10 text-[#4B4C9D] border border-[#4B4C9D]/30 text-sm font-bold">
                              Nota: {formatarNota(nota)}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setSelecionada(
                                  selecionadaE ? null : redacao
                                )
                              }
                              className="bg-[#F7F7FB] border border-[#9394CF]/40 text-black px-4 py-2 rounded-full text-sm font-bold hover:bg-[#9394CF]/20 transition"
                            >
                              {selecionadaE ? 'Fechar' : 'Ver feedback'}
                            </button>
                          </div>
                        </div>

                        {selecionadaE && (
                          <div className="mt-4 pt-4 border-t border-[#9394CF]/20 space-y-4">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] font-black text-black/40 mb-2">
                                Texto
                              </p>
                              <p className="text-black/80 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                {redacao.texto}
                              </p>
                            </div>

                            {feedback && (
                              <div className="p-4 rounded-[1.5rem] bg-[#F7F7FB] border border-[#9394CF]/20">
                                <p className="text-xs uppercase tracking-[0.25em] font-black text-[#4B4C9D] mb-2">
                                  Feedback
                                </p>
                                <p className="text-black/80 leading-relaxed">
                                  {feedback}
                                </p>
                              </div>
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
    </div>
  )
}
