import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../services/authService'

const EsqueciSenha = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authService.esqueciSenha(email)
      setStep(2)
    } catch (error) {
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
          <Link to="/login" className="flex items-center justify-center w-fit mx-auto mb-6">
            <svg className="w-8 h-8 text-study-accent hover:text-black transition-colors mr-2 -ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>

          <div className="w-20 h-20 bg-study-accent rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl">
            <svg className="w-10 h-10 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM12 9a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <h2 className="text-3xl font-black text-black mb-4">
            {step === 1 ? 'Esqueci minha senha' : 'Confira seu email'}
          </h2>

          <p className="text-black/65 font-semibold">
            {step === 1
              ? 'Digite seu email para receber um link seguro de recuperação'
              : 'Se o endereço estiver cadastrado, enviaremos um link válido por 30 minutos'
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
                className="w-full rounded-full px-5 py-3 bg-study-paper border border-study-line/40 text-black placeholder-gray-400 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Enviando...
                </>
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-6 pt-8">
            <div className="bg-study-canvas border border-study-line/30 rounded-[2rem] p-6">
              <h3 className="text-lg font-black text-black mb-3">
                Como usar:
              </h3>

              <ol className="text-sm text-black/65 space-y-2 text-left font-semibold">
                <li className="flex items-start">
                  <span className="text-study-accent font-black w-6 flex-shrink-0">1.</span>
                  <span>Abra o link enviado para seu email</span>
                </li>

                <li className="flex items-start">
                  <span className="text-study-accent font-black w-6 flex-shrink-0">2.</span>
                  <span>Crie uma nova senha forte</span>
                </li>
              </ol>
            </div>

            <Link
              to="/login"
              className="block w-full bg-study-accent text-white py-4 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl"
            >
              Fazer Login Agora
            </Link>
          </div>
        )}

        <div className="text-center pt-8 mt-8 border-t border-study-line/20">
          <Link to="/login" className="text-black/65 hover:text-study-accent font-bold transition-colors">
            ← Voltar ao Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default EsqueciSenha
