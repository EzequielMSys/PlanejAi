import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

const AlterarSenha = () => {
  const [formData, setFormData] = useState({
    senha_atual: '',
    nova_senha: '',
    confirmar_senha: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (formData.nova_senha !== formData.confirmar_senha) {
      alert('As senhas não coincidem!')
      return
    }

    setLoading(true)
    try {
      await authService.alterarSenha(
        formData.senha_atual,
        formData.nova_senha,
        formData.confirmar_senha
      )
      alert('Senha alterada com sucesso!')
      navigate('/perfil')
    } catch (error) {
      // Error handled by service
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-study-accent via-study-accent to-study-accent relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute top-20 left-10 w-32 h-32 bg-study-paper rounded-full blur-xl" />
      <div className="absolute bottom-20 right-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
      <div className="absolute top-40 right-1/4 w-20 h-20 border border-white/30 rounded-full" />

      <div className="relative z-10 max-w-md w-full rounded-[3rem] bg-study-paper backdrop-blur-md border border-white/60 shadow-2xl p-8 animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 bg-study-accent rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17l-1 1h2v1a2 2 0 01-2 2H7a2 2 0 01-2-2v-1h2l1-1L5 14.743A6 6 0 012 12a6 6 0 0112-3z" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-black mb-2">
            Alterar Senha
          </h2>

          <p className="text-black/65 font-semibold">
            Digite sua senha atual e crie uma nova senha segura
          </p>
        </div>

        <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Senha Atual
            </label>

            <input
              type="password"
              required
              className="w-full rounded-full px-5 py-3 bg-study-paper border border-study-line/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
              placeholder="Senha atual"
              value={formData.senha_atual}
              onChange={(e) => setFormData({ ...formData, senha_atual: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Nova Senha
              <span className="text-xs text-study-accent ml-1">
                (mín 8 chars, 1 maiúscula, 1 número)
              </span>
            </label>

            <input
              type="password"
              required
              className="w-full rounded-full px-5 py-3 bg-study-paper border border-study-line/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
              placeholder="Nova senha segura"
              value={formData.nova_senha}
              onChange={(e) => setFormData({ ...formData, nova_senha: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-2">
              Confirmar Nova Senha
            </label>

            <input
              type="password"
              required
              className="w-full rounded-full px-5 py-3 bg-study-paper border border-study-line/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
              placeholder="Confirme a nova senha"
              value={formData.confirmar_senha}
              onChange={(e) => setFormData({ ...formData, confirmar_senha: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-study-accent text-white py-4 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Alterando...
              </>
            ) : (
              'Alterar Senha'
            )}
          </button>
        </form>

        <div className="text-center pt-8 mt-8 border-t border-study-line/20">
          <Link 
            to="/perfil"
            className="text-black/65 hover:text-study-accent font-bold inline-flex items-center transition-colors"
          >
            ← Voltar ao Perfil
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AlterarSenha