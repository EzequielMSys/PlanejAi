import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.senha || submittingRef.current) return

    submittingRef.current = true
    setLoading(true)
    try {
      await login(formData.email, formData.senha)
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
      title="Bem-vindo de volta"
      subtitle="Entre para retomar o ponto exato onde você parou."
      destaque={
        <>
          <p className="pn-sobrancelha">Seu mapa</p>
          <h2 className="pn-secao">O que espera por você primeiro</h2>
          <ul className="pn-auth-lista">
            <li>As aulas e provas que exigem atenção hoje.</li>
            <li>Onde o cronograma parou e o que ficou para trás.</li>
            <li>Suas redações recentes e o que elas apontaram.</li>
          </ul>
        </>
      }
      rodape={
        <p className="pn-corpo">
          Não tem conta? <Link to="/register">Criar conta</Link>
        </p>
      }
    >
      <form className="pn-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="pn-etiqueta">Email</label>
          <input
            id="email"
            type="email"
            autoFocus
            required
            autoComplete="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="pn-campo"
          />
        </div>

        <div>
          <label htmlFor="senha" className="pn-etiqueta">Senha</label>
          <div className="pn-com-botao">
            <input
              id="senha"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              className="pn-campo"
            />
            <button
              type="button"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              onClick={() => setShowPassword(v => !v)}
              className="pn-olho"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <p className="pn-auth-esqueci">
          <Link to="/esqueci-senha">Esqueci minha senha</Link>
        </p>

        <button
          type="submit"
          disabled={loading || !formData.email || !formData.senha}
          className="pn-btn pn-btn-primario pn-btn-largo"
        >
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
