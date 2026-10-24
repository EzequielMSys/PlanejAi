import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthJourneyPreview from '../components/AuthJourneyPreview'

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
  const submittingRef = useRef(false)
  const { login } = useAuth()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.senha || submittingRef.current) return

    submittingRef.current = true
    setLoading(true)
    try {
      await login(formData.email, formData.senha, location.state?.from)
      // Redirect will be handled by ProtectedRoute based on user state
    } catch (error) {
      // Error toast handled by AuthContext
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      variant="login"
      title="Boas-vindas de volta"
      subtitle="Seu próximo passo começa exatamente de onde você parou."
      destaque={<AuthJourneyPreview variant="login" />}
      rodape={
        <p>
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      }
    >
      <form className="study-form ds-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="study-label ds-label">Email</label>
          <div className="study-input-wrap">
            <input
              id="email"
              type="email"
              autoFocus
              required
              autoComplete="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="study-input ds-input"
            />
          </div>
        </div>

        <div>
          <div className="study-login-password-head"><label htmlFor="senha" className="study-label ds-label">Senha</label><Link to="/esqueci-senha">Esqueci minha senha</Link></div>
          <div className="study-input-wrap">
            <input
              id="senha"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="study-input ds-input"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword(v => !v)}
              className="study-eye ds-btn-fantasma"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.email || !formData.senha}
          className="study-submit ds-btn"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
