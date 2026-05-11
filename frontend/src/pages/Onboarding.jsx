import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const Onboarding = () => {
  const { user, updatePerfilCompleto } = useAuth()
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

  const [disponibilidade, setDisponibilidade] = useState([
    { dia_semana: 'segunda', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
    { dia_semana: 'terca', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
    { dia_semana: 'quarta', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
    { dia_semana: 'quinta', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
    { dia_semana: 'sexta', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
    { dia_semana: 'sabado', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
    { dia_semana: 'domingo', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 }
  ])

  const handlePerfilSubmit = async (e) => {
    e.preventDefault()
    if (!formData.ano_escolar || !formData.objetivo || !formData.areas_foco) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/perfil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setStep(2)
      } else {
        throw new Error('Erro ao salvar perfil')
      }
    } catch (error) {
      toast.error('Erro ao salvar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleDisponibilidadeSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/perfil/disponibilidade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ dias: disponibilidade })
      })

      if (response.ok) {
        updatePerfilCompleto(true)
        toast.success('Perfil configurado com sucesso!')
        navigate('/dashboard')
      } else {
        throw new Error('Erro ao salvar disponibilidade')
      }
    } catch (error) {
      toast.error('Erro ao salvar disponibilidade')
    } finally {
      setLoading(false)
    }
  }

  const toggleDia = (index) => {
    const newDisponibilidade = [...disponibilidade]
    newDisponibilidade[index].ocupado = newDisponibilidade[index].ocupado ? 0 : 1
    setDisponibilidade(newDisponibilidade)
  }

  const inputClass =
    'w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300'

  const labelClass =
    'block text-sm font-bold text-black mb-2'

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="text-center mb-8 bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/85 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
                <svg className="w-10 h-10 text-[#4B4C9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
                PlanejAI
              </p>

              <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
                Configurar Perfil de Estudos
              </h1>

              <p className="text-white/85">
                Vamos personalizar seu plano de estudos para obter os melhores resultados!
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className={`h-3 rounded-full transition-all ${step === 1 ? 'w-12 bg-[#4B4C9D]' : 'w-3 bg-[#9394CF]/40'}`} />
            <div className={`h-3 rounded-full transition-all ${step === 2 ? 'w-12 bg-[#4B4C9D]' : 'w-3 bg-[#9394CF]/40'}`} />
          </div>

          {step === 1 && (
            <form onSubmit={handlePerfilSubmit} className="space-y-6">
              <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-[#9394CF]/20">
                <h2 className="text-xl font-black text-black mb-6">
                  Informações Básicas
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className={labelClass}>
                      Ano Escolar *
                    </label>
                    <select
                      required
                      className={inputClass}
                      value={formData.ano_escolar}
                      onChange={(e) => setFormData({ ...formData, ano_escolar: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="1º ano">1º ano</option>
                      <option value="2º ano">2º ano</option>
                      <option value="3º ano">3º ano</option>
                      <option value="Ensino Superior">Ensino Superior</option>
                      <option value="Pós-graduação">Pós-graduação</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Objetivo de Estudo *
                    </label>
                    <select
                      required
                      className={inputClass}
                      value={formData.objetivo}
                      onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      <option value="ENEM">ENEM</option>
                      <option value="Vestibular">Vestibular</option>
                      <option value="Concurso Público">Concurso Público</option>
                      <option value="Aperfeiçoamento">Aperfeiçoamento</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Áreas de Foco * (separadas por vírgula)
                    </label>
                    <input
                      type="text"
                      required
                      className={inputClass}
                      placeholder="Ex: Matemática, Português, Biologia"
                      value={formData.areas_foco}
                      onChange={(e) => setFormData({ ...formData, areas_foco: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Tempo Diário de Estudo (minutos)
                    </label>
                    <input
                      type="number"
                      min="30"
                      max="480"
                      className={inputClass}
                      value={formData.tempo_diario_min}
                      onChange={(e) => setFormData({ ...formData, tempo_diario_min: parseInt(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Prazo Estimado (dias)
                    </label>
                    <input
                      type="number"
                      min="7"
                      max="365"
                      className={inputClass}
                      value={formData.prazo_estimado}
                      onChange={(e) => setFormData({ ...formData, prazo_estimado: parseInt(e.target.value) })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#4B4C9D] text-white py-3 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed mt-6"
                >
                  {loading ? 'Salvando...' : 'Próximo: Disponibilidade'}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleDisponibilidadeSubmit} className="space-y-6">
              <div className="bg-white rounded-[3rem] p-8 shadow-2xl border border-[#9394CF]/20">
                <h2 className="text-xl font-black text-black mb-3">
                  Disponibilidade Semanal
                </h2>

                <p className="text-black/60 mb-6">
                  Marque os dias que você pode dedicar aos estudos e ajuste os horários.
                </p>

                <div className="space-y-3">
                  {disponibilidade.map((dia, index) => (
                    <div
                      key={dia.dia_semana}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#F7F7FB] rounded-[2rem] border border-[#9394CF]/20"
                    >
                      <div className="flex items-center gap-4">
                        <input
                          type="checkbox"
                          checked={!dia.ocupado}
                          onChange={() => toggleDia(index)}
                          className="w-5 h-5 accent-[#4B4C9D]"
                        />

                        <span className="text-black font-bold capitalize">
                          {dia.dia_semana}
                        </span>
                      </div>

                      {!dia.ocupado && (
                        <div className="flex items-center gap-2 text-sm text-black/60">
                          <input
                            type="time"
                            value={dia.hora_inicio}
                            onChange={(e) => {
                              const newDisp = [...disponibilidade]
                              newDisp[index].hora_inicio = e.target.value
                              setDisponibilidade(newDisp)
                            }}
                            className="bg-white border border-[#9394CF]/40 rounded-full px-3 py-2 text-xs text-black focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                          />

                          <span>às</span>

                          <input
                            type="time"
                            value={dia.hora_fim}
                            onChange={(e) => {
                              const newDisp = [...disponibilidade]
                              newDisp[index].hora_fim = e.target.value
                              setDisponibilidade(newDisp)
                            }}
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
                    className="flex-1 bg-white text-black border border-[#9394CF]/40 py-3 rounded-full font-bold hover:bg-[#F7F7FB] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-md"
                  >
                    Voltar
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-[#4B4C9D] text-white py-3 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Finalizando...' : 'Concluir Configuração'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Onboarding