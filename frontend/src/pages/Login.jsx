import { useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'
import AuthJourneyPreview from '../components/AuthJourneyPreview'
import { apiUrl } from '../config/api'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', senha: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [failure, setFailure] = useState(null)
  const [checking, setChecking] = useState(false)
  const checkRef = useRef(false)
  const submittingRef = useRef(false)
  const { login } = useAuth()
  const location = useLocation()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.senha || submittingRef.current) return

    submittingRef.current = true
    setLoading(true)
    setFailure(null)
    try {
      await login(formData.email, formData.senha, location.state?.from)
      // Redirect will be handled by ProtectedRoute based on user state
    } catch (error) {
      const unavailable = error.response?.status === 503 || !error.response
      setFailure({ unavailable, message: unavailable
        ? 'Não conseguimos acessar sua conta agora. Seus dados de acesso continuam aqui para você tentar novamente.'
        : error.response?.data?.error || 'Não foi possível entrar. Confira seu email e sua senha.' })
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const checkService = async () => {
    if (checkRef.current) return
    checkRef.current = true
    setChecking(true)
    try {
      const response = await fetchWithTimeout(apiUrl('/api/health'), { cache: 'no-store' }, 8000)
      const data = await response.json()
      setFailure({ unavailable: true, message: response.ok && data.database === 'connected'
        ? 'A conexão voltou. Toque em Entrar para continuar seus estudos.'
        : 'O serviço ainda está indisponível. Tente mais tarde; não é necessário criar outra conta.' })
    } catch {
      setFailure({ unavailable: true, message: 'Ainda não conseguimos confirmar a conexão. Confira sua internet e tente mais tarde.' })
    } finally { checkRef.current = false; setChecking(false) }
  }

  return (
    <AuthLayout
      variant="login"
      eyebrow="DE VOLTA ÀS SUAS PÁGINAS"
      title="Continue de onde sua história parou."
      subtitle="Seu espaço de estudos está esperando por você."
      destaque={<AuthJourneyPreview />}
      rodape={
        <p>
          Ainda não tem uma conta? <Link to="/register">Criar conta</Link>
        </p>
      }
    >
      <form className="study-form ds-form" onSubmit={handleSubmit}>
        {failure && <div className="study-login-recovery" role="alert">
          <strong>{failure.unavailable ? 'Vamos retomar com calma' : 'Confira seu acesso'}</strong>
          <p>{failure.message}</p>
          {failure.unavailable && <button type="button" onClick={checkService} disabled={checking}>{checking ? 'Verificando…' : 'Verificar conexão'}</button>}
        </div>}
        <div>
          <label htmlFor="email" className="study-label ds-label">Email</label>
          <div className="study-input-wrap">
            <input
              id="email"
              type="email"
              autoFocus
              required
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
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
          </div>
          <label className="study-show-password">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>Mostrar senha</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading || !formData.email || !formData.senha}
          className="study-submit ds-btn"
        >
          {loading ? 'Entrando…' : 'Entrar no meu espaço'}
        </button>
      </form>
    </AuthLayout>
  )
}

export default Login
