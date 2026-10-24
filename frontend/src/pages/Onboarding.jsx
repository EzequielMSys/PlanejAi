import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import perfilService from '../services/perfilService'
import ChecklistMaterias from '../components/ChecklistMaterias'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import RouteLoading from '../components/RouteLoading'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const diasPadrao = [
  { dia_semana: 'SEG', label: 'Segunda-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 },
  { dia_semana: 'TER', label: 'Terça-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 },
  { dia_semana: 'QUA', label: 'Quarta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 },
  { dia_semana: 'QUI', label: 'Quinta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 },
  { dia_semana: 'SEX', label: 'Sexta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 },
  { dia_semana: 'SAB', label: 'Sábado', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 },
  { dia_semana: 'DOM', label: 'Domingo', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 }
]

export default function Onboarding() {
  const { updatePerfilCompleto } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const [restoreError, setRestoreError] = useState(false)
  const [step, setStep] = useState(1)

  const [formData, setFormData] = useState({
    ano_escolar: '',
    objetivo: 'ENEM',
    areas_foco: '',
    tempo_diario_min: 60,
    prazo_estimado: 30
  })

  const [disponibilidade, setDisponibilidade] = useState(diasPadrao)
  useEffect(() => {
    let active = true
    perfilService.obterPerfilCompleto().then(({ perfil, disponibilidade: days }) => {
      if (!active) return
      if (perfil?.areas_foco) { setFormData(current => ({ ...current, ...Object.fromEntries(Object.keys(current).map(key => [key, perfil[key] ?? current[key]])) })); setStep(2) }
      if (Array.isArray(days) && days.length) setDisponibilidade(diasPadrao.map(day => ({ ...day, ...days.find(saved => saved.dia_semana === day.dia_semana) })))
    }).catch(() => { if (active) setRestoreError(true) }).finally(() => { if (active) setRestoring(false) })
    return () => { active = false }
  }, [])

  const inputClass =
    'w-full rounded-2xl px-4 py-3.5 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-borda-rgb)/1)] text-[rgb(var(--pn-texto-rgb)/1)] placeholder-black/35 focus:bg-[rgb(var(--pn-superficie-rgb)/1)] focus:ring-4 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/0.1)] focus:border-[rgb(var(--pn-primaria-borda-rgb)/1)] focus:outline-none transition-all duration-200'

  const labelClass = 'block text-sm font-bold text-[rgb(var(--pn-texto-rgb)/1)] mb-2'

  const handlePerfilSubmit = async (e) => {
    e.preventDefault()

if (!formData.objetivo || !formData.areas_foco.trim()) {
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
    const available = disponibilidade.filter(day => !Number(day.ocupado))
    if (!available.length || available.some(day => !day.hora_inicio || !day.hora_fim || day.hora_inicio >= day.hora_fim)) {
      toast.error('Escolha pelo menos um dia com horário final depois do inicial.')
      return
    }
    setLoading(true)

    try {
      const diasParaSalvar = disponibilidade.map(({ label, ...dia }) => dia)

      await perfilService.salvarDisponibilidade(diasParaSalvar)

      updatePerfilCompleto(true)
      toast.success('Preferências salvas na sua conta. Agora você pode gerar seu plano.')
      navigate('/cronograma')
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

  if (restoring) return <RouteLoading label="Recuperando sua configuração salva…" />
  if (restoreError) return <section className="setup-invitation" role="alert"><p>Não conseguimos consultar sua configuração. Recarregue para recuperar o que já foi salvo antes de editar.</p><button type="button" onClick={() => window.location.reload()}>Tentar novamente</button><button type="button" onClick={() => navigate('/inicio')}>Explorar por enquanto</button></section>
  return (
    <div className="setup-page min-h-screen px-4 py-8 text-[rgb(var(--pn-texto-rgb)/1)] sm:px-6 lg:px-10 lg:py-10 relative overflow-hidden">
      <div className="absolute -top-24 right-[8%] h-80 w-80 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute bottom-0 left-[15%] h-96 w-96 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="setup-invitation"><p>Você pode conhecer a Lumi, os exercícios e as fontes antes de montar seu plano.</p><button type="button" disabled={loading} onClick={() => navigate('/inicio')}>Explorar primeiro →</button></div>
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="setup-hero mb-7 overflow-hidden rounded-[2rem] border border-white/10 bg-[rgb(var(--pn-primaria-forte-rgb)/1)] p-6 shadow-[0_24px_80px_-30px_rgba(31,27,72,.65)] sm:p-8 lg:p-10 relative">
            <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/0.35)] blur-2xl" />
            <div className="absolute bottom-0 right-[24%] h-24 w-48 bg-cyan-300/10 blur-2xl" />
            <div className="relative z-10 flex items-center gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-[rgb(var(--pn-superficie-rgb)/0.1)] shadow-xl backdrop-blur-sm sm:h-16 sm:w-16">
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
            <aside className="setup-steps rounded-[1.75rem] border border-[rgb(var(--pn-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-rgb)/0.75)] p-5 shadow-[0_18px_50px_-35px_rgba(32,28,75,.45)] backdrop-blur-xl lg:sticky lg:top-24">
              <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[rgb(var(--pn-texto-rgb)/1)]">Configuração</p>
              {[
                { number: 1, title: 'Seu foco', text: 'Objetivos e matérias' },
                { number: 2, title: 'Sua semana', text: 'Dias e horários' }
              ].map((item) => {
                const active = step === item.number
                const done = step > item.number
                return (
                  <div key={item.number} className="relative flex gap-3 pb-5 last:pb-0">
                    {item.number === 1 && <span className="absolute left-[17px] top-9 h-8 w-px bg-[rgb(var(--pn-superficie-alt-rgb)/1)]" />}
                    <span className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black transition ${active ? 'bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white shadow-lg shadow-indigo-300/40' : done ? 'bg-emerald-100 text-emerald-700' : 'bg-[rgb(var(--pn-superficie-alt-rgb)/1)] text-[rgb(var(--pn-texto-rgb)/1)]'}`}>{done ? '✓' : item.number}</span>
                    <span><strong className="block text-sm text-[rgb(var(--pn-texto-rgb)/1)]">{item.title}</strong><small className="text-xs text-[rgb(var(--pn-texto-rgb)/1)]">{item.text}</small></span>
                  </div>
                )
              })}
              <div className="mt-5 rounded-2xl bg-[rgb(var(--pn-superficie-alt-rgb)/1)] p-4 text-sm leading-relaxed text-[rgb(var(--pn-texto-rgb)/1)]">Leva menos de <strong className="text-[rgb(var(--pn-texto-rgb)/1)]">2 minutos</strong>. Você poderá mudar tudo depois no perfil.</div>
            </aside>

            <div>
              <div className="mb-4 flex items-center justify-between px-1">
                <span className="text-sm font-bold text-[rgb(var(--pn-texto-rgb)/1)]">Etapa {step} de 2</span>
                <span className="text-sm font-black text-[rgb(var(--pn-primaria-rgb)/1)]">{step * 50}%</span>
              </div>
              <div className="mb-5 h-2 overflow-hidden rounded-full bg-[rgb(var(--pn-superficie-alt-rgb)/1)]"><div className="h-full rounded-full bg-gradient-to-r from-[rgb(var(--pn-primaria-rgb)/1)] to-[rgb(var(--pn-primaria-suave-rgb)/1)] transition-all duration-500" style={{ width: `${step * 50}%` }} /></div>

          {step === 1 && (
            <form onSubmit={handlePerfilSubmit}><fieldset disabled={loading}>
              <div className="rounded-[2rem] border border-[rgb(var(--pn-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 shadow-[0_24px_70px_-42px_rgba(35,31,77,.55)] sm:p-8 lg:p-10">
                <h2 className="text-2xl font-black tracking-tight text-[rgb(var(--pn-texto-rgb)/1)]">Qual é a sua meta?</h2>
                <p className="mb-7 mt-1 text-sm text-[rgb(var(--pn-texto-rgb)/1)]">Escolha as matérias e seu tempo diário. O ano escolar é opcional. Depois dos horários, você poderá revisar e gerar o cronograma; salvar esta configuração não cria nem substitui um plano.</p>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass} htmlFor="setup-year">Ano escolar (opcional)</label>
                    <select
                      id="setup-year"
                      className={inputClass}
                      value={formData.ano_escolar}
                      onChange={(e) => setFormData({ ...formData, ano_escolar: e.target.value })}
                    >
                      <option value="">Prefiro informar depois</option>
                      <option value="9º">9º ano</option>
                      <option value="1º EM">1º ano EM</option>
                      <option value="2º EM">2º ano EM</option>
                      <option value="3º EM">3º ano EM</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass} htmlFor="setup-goal">Objetivo de estudo</label>
                    <select
                      required
                      id="setup-goal"
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
                    <label className={labelClass} htmlFor="setup-minutes">Tempo diário de estudo</label>
                    <input
                      type="number"
                      id="setup-minutes"
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
                    <label className={labelClass} htmlFor="setup-duration">Duração do cronograma</label>
                    <select
                      id="setup-duration"
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
                  className="mt-8 w-full rounded-2xl bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-5 py-4 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[rgb(var(--pn-primaria-forte-rgb)/1)] hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Salvando...' : 'Próximo: Disponibilidade'}
                </button>
              </div>
            </fieldset></form>
          )}

          {step === 2 && (
            <form onSubmit={handleDisponibilidadeSubmit}><fieldset disabled={loading}>
              <div className="rounded-[2rem] border border-[rgb(var(--pn-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 shadow-[0_24px_70px_-42px_rgba(35,31,77,.55)] sm:p-8 lg:p-10">
                <h2 className="text-2xl font-black tracking-tight text-[rgb(var(--pn-texto-rgb)/1)]">Como é a sua semana?</h2>

                <p className="text-[rgb(var(--pn-texto-rgb)/0.6)] mb-6">
                  Selecione ao menos um dia e ajuste a faixa de horários em que pode estudar. Seu tempo diário será distribuído dentro dessa faixa.
                </p>

                <div className="space-y-3">
                  {disponibilidade.map((dia, index) => (
                    <div
                      key={dia.dia_semana}
                      className={`flex flex-col gap-4 rounded-2xl border p-4 transition sm:flex-row sm:items-center sm:justify-between ${dia.ocupado ? 'border-[rgb(var(--pn-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-alt-rgb)/1)] opacity-65' : 'border-[rgb(var(--pn-primaria-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-alt-rgb)/1)]'}`}
                    >
                      <label className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={!dia.ocupado}
                          onChange={() => toggleDia(index)}
                          className="w-5 h-5 accent-[#4B4C9D]"
                        />

                        <span className="text-[rgb(var(--pn-texto-rgb)/1)] font-bold">
                          {dia.label}
                        </span>
                      </label>

                      {!dia.ocupado && (
                        <div className="flex items-center gap-2 text-sm text-[rgb(var(--pn-texto-rgb)/0.6)]">
                          <input
                            type="time"
                            value={dia.hora_inicio}
                            onChange={(e) =>
                              atualizarHorario(index, 'hora_inicio', e.target.value)
                            }
                            className="bg-[rgb(var(--pn-superficie-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] rounded-full px-3 py-2 text-xs text-[rgb(var(--pn-texto-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/1)] focus:outline-none"
                          />

                          <span>às</span>

                          <input
                            type="time"
                            value={dia.hora_fim}
                            onChange={(e) =>
                              atualizarHorario(index, 'hora_fim', e.target.value)
                            }
                            className="bg-[rgb(var(--pn-superficie-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] rounded-full px-3 py-2 text-xs text-[rgb(var(--pn-texto-rgb)/1)] focus:ring-2 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/1)] focus:outline-none"
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
                    className="flex-1 rounded-2xl border border-[rgb(var(--pn-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-rgb)/1)] py-3.5 font-bold text-[rgb(var(--pn-texto-rgb)/1)] transition hover:bg-[rgb(var(--pn-superficie-alt-rgb)/1)]"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 rounded-2xl bg-[rgb(var(--pn-primaria-forte-rgb)/1)] py-3.5 font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-[rgb(var(--pn-primaria-forte-rgb)/1)] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Salvando na conta…' : 'Salvar e preparar cronograma'}
                  </button>
                </div>
              </div>
            </fieldset></form>
          )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
