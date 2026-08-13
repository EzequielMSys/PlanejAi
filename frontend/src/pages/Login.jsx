import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import Logo from '../components/Logo'

const EyeIcon = ({ open }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    {open ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </>
    )}
  </svg>
)

const Login = () => {
  const [formData, setFormData] = useState({ email: '', senha: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.senha) return

    setLoading(true)
    try {
      await login(formData.email, formData.senha)
      // Redirect will be handled by ProtectedRoute based on user state
    } catch (error) {
      // Error toast handled by AuthContext
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] relative overflow-hidden bg-animated-grid">
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />

      {/* Floating animated blobs */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-white/10 rounded-full blur-xl animate-float" />
      <div className="absolute bottom-20 right-16 w-56 h-56 bg-black/10 rounded-full blur-2xl animate-float-slow" />
      <div className="absolute top-40 right-1/4 w-24 h-24 border border-white/30 rounded-full animate-pulse-glow" />

      {/* Theme toggle */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 max-w-md w-full rounded-[3rem] bg-white/85 dark:bg-white/10 backdrop-blur-xl border border-white/60 dark:border-white/20 shadow-2xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            className="mx-auto h-16 w-16 rounded-full flex items-center justify-center shadow-xl mb-4"
          >
            <Logo className="h-12 w-12" />
          </motion.div>

          <h2 className="text-3xl font-black text-black dark:text-white tracking-tight">
            Bem-vindo de volta
          </h2>

          <p className="mt-2 text-sm text-black/65 dark:text-white/70">
            Digite suas credenciais para acessar
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-black dark:text-white mb-1.5">
              Email
            </label>

            <input
              id="email"
              type="email"
              autoFocus
              required
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full rounded-full px-5 py-3 bg-white dark:bg-white/10 border border-[#9394CF]/40 dark:border-white/20 text-black dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300 focus:shadow-2xl hover:border-[#4B4C9D]/60"
            />
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="senha" className="block text-sm font-bold text-black dark:text-white mb-1.5">
              Senha
            </label>

            <div className="relative">
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                className="w-full rounded-full px-5 py-3 pr-12 bg-white dark:bg-white/10 border border-[#9394CF]/40 dark:border-white/20 text-black dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300 focus:shadow-2xl hover:border-[#4B4C9D]/60"
              />

              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B4C9D] dark:text-[#A9AAE8] hover:text-black dark:hover:text-white transition-colors"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
          </div>

          {/* Forgot password link */}
          <div className="flex items-center justify-end">
            <Link
              to="/esqueci-senha"
              className="text-sm text-[#4B4C9D] dark:text-[#A9AAE8] hover:text-black dark:hover:text-white font-bold transition-colors"
            >
              Esqueci minha senha
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !formData.email || !formData.senha}
            className="w-full bg-[#4B4C9D] dark:bg-[#A9AAE8] text-white dark:text-black py-3 rounded-full font-bold hover:bg-black dark:hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl hover:shadow-2xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Entrando...
              </span>
            ) : (
              'Entrar'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-black/65 dark:text-white/70">
            Não tem conta?{' '}
            <Link to="/register" className="font-black text-[#4B4C9D] dark:text-[#A9AAE8] hover:text-black dark:hover:text-white transition-colors">
              Criar conta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default Login