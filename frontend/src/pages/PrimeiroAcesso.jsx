import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

const PrimeiroAcesso = () => {
  const [formData, setFormData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { user, login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.nova_senha !== formData.confirmar_senha) {
      setError('Senhas não coincidem!')
      return
    }

    const senhaForteRegex = /^(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/
    if (!senhaForteRegex.test(formData.nova_senha)) {
      setError('Senha deve ter no mínimo 8 caracteres, 1 maiúscula e 1 número')
      return
    }

    setLoading(true)
    try {
      await authService.trocarSenhaPrimeiroAcesso(
        formData.senha_atual,
        formData.nova_senha,
        formData.confirmar_senha
      )
      
      await login(user.email, formData.nova_senha)
      navigate('/onboarding')
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
      <div className="absolute top-40 right-1/4 w-20 h-20 border border-white/30 rounded-full" />

      <div className="relative z-10 max-w-md w-full rounded-[3rem] bg-white/85 backdrop-blur-md border border-white/60 shadow-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-[#9394CF] rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-black mb-2">
            Primeiro Acesso
          </h2>

          <div className="bg-[#9394CF]/20 border border-[#9394CF]/40 rounded-[2rem] p-6 mb-8">
            <p className="text-[#4B4C9D] font-black text-lg mb-2">
              ⚠️ Troca obrigatória
            </p>

            <p className="text-black/65 text-sm font-semibold">
              Use sua senha temporária atual e crie uma nova senha segura
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 rounded-[1.5rem] p-4 text-red-700 text-sm font-bold text-center mb-6">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Senha Atual (temporária)
            </label>

            <input
              type="password"
              required
              className="w-full rounded-full px-5 py-3 bg-white border border-[#9394CF]/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
              placeholder="Senha temporária recebida"
              value={formData.senha_atual}
              onChange={(e) => setFormData({ ...formData, senha_atual: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Nova Senha
            </label>

            <input
              type="password"
              required
              className="w-full rounded-full px-5 py-3 bg-white border border-[#9394CF]/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
              placeholder="Nova senha segura"
              value={formData.nova_senha}
              onChange={(e) => setFormData({ ...formData, nova_senha: e.target.value })}
            />

            <p className="text-xs text-black/50 mt-1.5">
              Mínimo 8 caracteres, 1 maiúscula e 1 número
            </p>
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Confirmar Nova Senha
            </label>

            <input
              type="password"
              required
              className="w-full rounded-full px-5 py-3 bg-white border border-[#9394CF]/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
              placeholder="Confirme a nova senha"
              value={formData.confirmar_senha}
              onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4B4C9D] text-white py-4 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Alterando...' : 'Definir Nova Senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PrimeiroAcesso
