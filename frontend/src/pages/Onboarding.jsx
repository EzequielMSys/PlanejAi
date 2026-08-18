import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import perfilService from '../services/perfilService'
import ChecklistMaterias from '../components/ChecklistMaterias'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const diasPadrao = [
  { dia_semana: 'SEG', label: 'Segunda-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'TER', label: 'Terça-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'QUA', label: 'Quarta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'QUI', label: 'Quinta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'SEX', label: 'Sexta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'SAB', label: 'Sábado', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'DOM', label: 'Domingo', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 }
]

export default function Onboarding() {
  const { updatePerfilCompleto } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    ano_escolar: '',
    objetivo: '',
    areas_foco: '',
    tempo_diario_min: 60,
    prazo_estimado: 30
  })

  const [disponibilidade, setDisponibilidade] = useState(diasPadrao)

  const inputClass =
    'w-full rounded-2xl px-4 py-3.5 bg-[#F8F8FC] border border-[#DADAF0] text-[#18172B] placeholder-black/35 focus:bg-white focus:ring-4 focus:ring-[#6366F1]/10 focus:border-[#6366F1] focus:outline-none transition-all duration-200'

  const labelClass = 'block text-sm font-bold text-[#25233D] mb-2'

  const handlePerfilSubmit = async (e) => {
    e.preventDefault()

if (!formData.ano_escolar || !formData.objetivo || !formData.areas_foco.trim()) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    const areas = formData.areas_foco
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    const somenteLetras = areas.every((a) =>
      /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(a)
    )

    if (!somenteLetras) {
      toast.error('As áreas de foco devem conter apenas letras.')
      return
    }

    setLoading(true)

    try {
      await perfilService.salvarPerfil(formData)
      setStep(2)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar perfil.')
    } finally {
      setLoading(false)
    }
  }

  const handleDisponibilidadeSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const diasParaSalvar = disponibilidade.map(({ label, ...dia }) => dia)

      await perfilService.salvarDisponibilidade(diasParaSalvar)

      updatePerfilCompleto(true)
      toast.success('Perfil configurado com sucesso!')
      navigate('/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar disponibilidade.')
    } finally {
      setLoading(false)
    }
  }

  const toggleDia = (index) => {
    setDisponibilidade((dias) =>
      dias.map((dia, i) =>
        i === index
          ? { ...dia, ocupado: dia.ocupado ? 0 : 1 }
          : dia
      )
    )
  }

  const atualizarHorario = (index, campo, valor) => {
    setDisponibilidade((dias) =>
      dias.map((dia, i) =>
        i === index
          ? { ...dia, [campo]: valor }
          : dia
      )
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 text-[#18172B] sm:px-6 lg:px-10 lg:py-10 relative overflow-hidden">
      <div className="absolute -top-24 right-[8%] h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute bottom-0 left-[15%] h-96 w-96 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="mb-7 overflow-hidden rounded-[2rem] border border-white/10 bg-[#1C1A38] p-6 shadow-[0_24px_80px_-30px_rgba(31,27,72,.65)] sm:p-8 lg:p-10 relative">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[#7C6CF2]/35 blur-2xl" />
            <div className="absolute bottom-0 right-[24%] h-24 w-48 bg-cyan-300/10 blur-2xl" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-xl backdrop-blur-sm sm:h-16 sm:w-16">
                <svg className="h-7 w-7 text-[#A7F3D0] sm:h-8 sm:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.24em] text-[#A7F3D0]">Seu plano começa aqui</p>
                <h1 className="text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl lg:text-4xl">Monte uma rotina que cabe na sua vida.</h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/65 sm:text-base">Conte o que você quer conquistar e quando consegue estudar. O PlanejAI organiza o resto.</p>
              </div>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="rounded-[1.75rem] border border-[#E5E5F2] bg-white/75 p-5 shadow-[0_18px_50px_-35px_rgba(32,28,75,.45)] backdrop-blur-xl lg:sticky lg:top-24">
              <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#7778A8]">Configuração</p>
              {[
                { number: 1, title: 'Seu foco', text: 'Objetivos e matérias' },
                { number: 2, title: 'Sua semana', text: 'Dias e horários' }
              ].map((item) => {
                const active = step === item.number
                const done = step > item.number
                return (
                  <div key={item.number} className="relative flex gap-3 pb-5 last:pb-0">
                    {item.number === 1 && <span className="absolute left-[17px] top-9 h-8 w-px bg-[#DDDCEF]" />}
                    <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition ${active ? 'bg-[#6157D9] text-white shadow-lg shadow-indigo-300/40' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F0EFF8] text-[#7778A8]'}`}>{done ? '✓' : item.number}</span>
                    <span><strong className="block text-sm text-[#23213B]">{item.title}</strong><small className="text-xs text-[#85839D]">{item.text}</small></span>
                  </div>
                )
              })}
              <div className="mt-5 rounded-2xl bg-[#F3F2FA] p-4 text-sm leading-relaxed text-[#686681]">Leva menos de <strong className="text-[#34304F]">2 minutos</strong>. Você poderá mudar tudo depois no perfil.</div>
            </aside>

            <div>
              <div className="mb-4 flex items-center justify-between px-1">
                <span className="text-sm font-bold text-[#77758F]">Etapa {step} de 2</span>
                <span className="text-sm font-black text-[#6157D9]">{step * 50}%</span>
              </div>
              <div className="mb-5 h-2 overflow-hidden rounded-full bg-[#E8E7F3]"><div className="h-full rounded-full bg-gradient-to-r from-[#6157D9] to-[#8B7CF6] transition-all duration-500" style={{ width: `${step * 50}%` }} /></div>

          {step === 1 && (
            <form onSubmit={handlePerfilSubmit}>
              <div className="rounded-[2rem] border border-[#E4E3F0] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(35,31,77,.55)] sm:p-8 lg:p-10">
                <h2 className="text-2xl font-black tracking-tight text-[#201E38]">Qual é a sua meta?</h2>
                <p className="mb-7 mt-1 text-sm text-[#77758F]">Use essas respostas para personalizarmos o ritmo do cronograma.</p>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>Ano Escolar *</label>
                    <select
                      required
                      className={inputClass}
                      value={formData.ano_escolar}
                      onChange={(e) => setFormData({ ...formData, ano_escolar: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="9º">9º ano</option>
                      <option value="1º EM">1º ano EM</option>
                      <option value="2º EM">2º ano EM</option>
                      <option value="3º EM">3º ano EM</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Objetivo de Estudo *</label>
                    <select
                      required
                      className={inputClass}
                      value={formData.objetivo}
                      onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="ENEM">ENEM</option>
                      <option value="VESTIBULAR">Vestibular</option>
                      <option value="OBMEP">OBMEP</option>
                      <option value="CURSO">Curso</option>
                    </select>
                  </div>

<div>
                    <label className={labelClass}>Áreas de Foco *</label>
                    <ChecklistMaterias
                      value={formData.areas_foco}
                      onChange={(novaAreas) =>
                        setFormData({ ...formData, areas_foco: novaAreas })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Tempo Diário de Estudo</label>
                    <input
                      type="number"
                      min="30"
                      max="480"
                      className={inputClass}
                      value={formData.tempo_diario_min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tempo_diario_min: Number(e.target.value)
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Duração do Cronograma</label>
                    <select
                      className={inputClass}
                      value={formData.prazo_estimado}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          prazo_estimado: Number(e.target.value)
                        })
                      }
                    >
                      <option value={30}>Mensal</option>
                      <option value={90}>Trimestral</option>
                      <option value={180}>Semestral</option>
                      <option value={365}>Anual</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-8 w-full rounded-2xl bg-[#6157D9] px-5 py-4 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[#4F46C7] hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Salvando...' : 'Próximo: Disponibilidade'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleDisponibilidadeSubmit}>
              <div className="rounded-[2rem] border border-[#E4E3F0] bg-white p-6 shadow-[0_24px_70px_-42px_rgba(35,31,77,.55)] sm:p-8 lg:p-10">
                <h2 className="text-2xl font-black tracking-tight text-[#201E38]">Como é a sua semana?</h2>

                <p className="text-black/60 mb-6">
                  Marque os dias em que você pode estudar.
                </p>

                <div className="space-y-3">
                  {disponibilidade.map((dia, index) => (
                    <div
                      key={dia.dia_semana}
                      className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${dia.ocupado ? 'border-[#ECEBF4] bg-[#FAFAFC] opacity-65' : 'border-[#DCD9F5] bg-[#F7F6FE]'}`}
                    >
                      <label className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={!dia.ocupado}
                          onChange={() => toggleDia(index)}
                          className="w-5 h-5 accent-[#4B4C9D]"
                        />

                        <span className="text-black font-bold">
                          {dia.label}
                        </span>
                      </label>

                      {!dia.ocupado && (
                        <div className="flex items-center gap-2 text-sm text-black/60">
                          <input
                            type="time"
                            value={dia.hora_inicio}
                            onChange={(e) =>
                              atualizarHorario(index, 'hora_inicio', e.target.value)
                            }
                            className="bg-white border border-[#9394CF]/40 rounded-full px-3 py-2 text-xs text-black focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                          />

                          <span>às</span>

                          <input
                            type="time"
                            value={dia.hora_fim}
                            onChange={(e) =>
                              atualizarHorario(index, 'hora_fim', e.target.value)
                            }
                            className="bg-white border border-[#9394CF]/40 rounded-full px-3 py-2 text-xs text-black focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 rounded-2xl border border-[#DDDBEA] bg-white py-3.5 font-bold text-[#34304F] transition hover:bg-[#F8F7FC]"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-[#6157D9] py-3.5 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[#4F46C7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Finalizando...' : 'Concluir Configuração'}
                  </button>
                </div>
              </div>
            </form>
          )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
