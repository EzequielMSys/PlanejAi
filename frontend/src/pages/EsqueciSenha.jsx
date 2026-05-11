import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import authService from '../services/authService'

const EsqueciSenha = () => {
  const [email, setEmail] = useState('')
  const [senhaTemp, setSenhaTemp] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await authService.esqueciSenha(email)
      setSenhaTemp(response.senha_temporaria)
      setStep(2)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
      <div className="absolute top-40 right-1/4 w-20 h-20 border border-white/30 rounded-full" />

      <div className="relative z-10 max-w-md w-full rounded-[3rem] bg-white/85 backdrop-blur-md border border-white/60 shadow-2xl p-8 animate-fade-in">
        <div className="text-center">
          <Link to="/login" className="flex items-center justify-center w-fit mx-auto mb-6">
            <svg className="w-8 h-8 text-[#4B4C9D] hover:text-black transition-colors mr-2 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="w-20 h-20 bg-[#9394CF] rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-black mb-4">
            {step === 1 ? 'Esqueci minha senha' : 'Senha recuperada!'}
          </h2>

          <p className="text-black/65 font-semibold">
            {step === 1
              ? 'Digite seu email e receba uma nova senha temporária'
              : 'Use esta senha temporária para fazer login e altere-a imediatamente'
            }
          </p>
        </div>

        {step === 1 ? (
          <form className="space-y-6 mt-8" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-bold text-black mb-2">
                Email cadastrado
              </label>

              <input
                type="email"
                required
                className="w-full rounded-full px-5 py-3 bg-white border border-[#9394CF]/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4B4C9D] text-white py-4 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gerando...
                </>
              ) : (
                'Gerar Nova Senha'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6 pt-8">
            <div className="bg-[#4B4C9D] text-white px-8 py-6 rounded-[2rem] shadow-2xl mx-auto max-w-sm font-mono text-2xl font-black tracking-wider animate-pulse">
              {senhaTemp}
            </div>

            <div className="bg-[#F7F7FB] border border-[#9394CF]/30 rounded-[2rem] p-6">
              <h3 className="text-lg font-black text-black mb-3">
                Como usar:
              </h3>

              <ol className="text-sm text-black/65 space-y-2 text-left font-semibold">
                <li className="flex items-start">
                  <span className="text-[#4B4C9D] font-black w-6 flex-shrink-0">1.</span>
                  <span>Vá para login e use esta senha</span>
                </li>

                <li className="flex items-start">
                  <span className="text-[#4B4C9D] font-black w-6 flex-shrink-0">2.</span>
                  <span>Altere imediatamente no primeiro acesso</span>
                </li>
              </ol>
            </div>

            <Link
              to="/login"
              className="block w-full bg-[#4B4C9D] text-white py-4 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl"
            >
              Fazer Login Agora
            </Link>
          </div>
        )}

        <div className="text-center pt-8 mt-8 border-t border-[#9394CF]/20">
          <Link to="/login" className="text-black/65 hover:text-[#4B4C9D] font-bold transition-colors">
            ← Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EsqueciSenha