import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout'
import AuthJourneyPreview from '../components/AuthJourneyPreview'
import { SENHA_MINIMA, REQUISITOS_SENHA, validarSenha } from '../config/senha'

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    tipo: 'aluno',
    senha: '',
    confirmarSenha: '',
    website: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [focusError, setFocusError] = useState(null)
  const [confirmationTouched, setConfirmationTouched] = useState(false)
  const confirmationError = (confirmationTouched || errors.confirmarSenha) && formData.confirmarSenha !== formData.senha ? 'As senhas precisam ser iguais.' : ''
  useEffect(() => {
    if (!focusError) return
    document.getElementById(focusError)?.focus()
    setFocusError(null)
  }, [focusError])
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (!/^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(formData.nome.trim())) {
      newErrors.nome = 'Informe um nome válido, usando letras, espaços, hífens ou apóstrofos.'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(formData.email)) {
      newErrors.email = 'Email inválido'
    }

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória'
    } else {
      const problema = validarSenha(formData.senha)
      if (problema) newErrors.senha = problema
    }

    if (formData.confirmarSenha !== formData.senha) {
      newErrors.confirmarSenha = 'As senhas precisam ser iguais.'
    }

    setErrors(newErrors)
    setFocusError(Object.keys(newErrors)[0] || null)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      await authService.register({
        nome: formData.nome,
        email: formData.email,
        tipo: 'aluno',
        senha: formData.senha,
        website: formData.website
      })
      toast.success('Conta criada com sucesso!')
      navigate('/login')
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao criar conta'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = (field) => `study-input ds-input${errors[field] ? ' study-input-erro' : ''}`

  return (
    <AuthLayout
      variant="register"
      eyebrow="CAPÍTULO 01 / COMEÇAR"
      title="Toda jornada começa em algum lugar."
      subtitle="Crie seu espaço para organizar ideias, estudar e acompanhar seu próprio ritmo."
      destaque={<AuthJourneyPreview />}
      rodape={
        <p className="study-auth-rodape">
          Já tem uma conta? <Link to="/login" className="study-link">Entrar</Link>
        </p>
      }
    >
      <form className="study-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="nome" className="study-label ds-label">Nome completo</label>
          <input
            id="nome"
            type="text"
            autoFocus
            autoComplete="name"
            placeholder="João Silva"
            value={formData.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            aria-invalid={Boolean(errors.nome)}
            aria-describedby="nome-valor"
            className={inputClass('nome')}
          />
          {errors.nome ? (
            <p id="nome-valor" className="study-error" role="alert">{errors.nome}</p>
          ) : (
            <p id="nome-valor" className="study-hint">Aceita acentos, espaços, hífens e apóstrofos.</p>
          )}
        </div>

          <div>
            <label htmlFor="email" className="study-label ds-label">Email</label>
            <div className="study-input-wrap">
              <input
                id="email"
                type="email"
                autoComplete="email"
                inputMode="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="joao@exemplo.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                aria-invalid={Boolean(errors.email)}
                aria-describedby="email-requisitos"
                className={inputClass('email')}
              />
            </div>
            {errors.email ? (
              <p id="email-requisitos" className="study-error" role="alert">{errors.email}</p>
            ) : (
              <p id="email-requisitos" className="study-hint">Email deve conter @ e domínio</p>
            )}
          </div>

          <div>
            <label htmlFor="senha" className="study-label ds-label">Senha</label>
            <div className="study-input-wrap">
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => handleChange('senha', e.target.value)}
                minLength={SENHA_MINIMA}
                autoComplete="new-password"
                aria-invalid={Boolean(errors.senha)}
                aria-describedby="senha-requisitos"
                className={inputClass('senha')}
              />
            </div>
            {errors.senha ? (
              <p id="senha-requisitos" className="study-error" role="alert">{errors.senha}</p>
            ) : (
              <p id="senha-requisitos" className="study-hint">{REQUISITOS_SENHA}</p>
            )}
          </div>

        <div>
          <label htmlFor="confirmarSenha" className="study-label ds-label">Confirmar senha</label>
          <div className="study-input-wrap">
            <input
              id="confirmarSenha"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              value={formData.confirmarSenha}
              onChange={(e) => handleChange('confirmarSenha', e.target.value)}
              onBlur={() => setConfirmationTouched(true)}
              aria-invalid={Boolean(confirmationError)}
              aria-describedby="confirmar-requisitos"
              className={inputClass('confirmarSenha')}
            />
          </div>
          {confirmationError ? (
            <p id="confirmar-requisitos" className="study-error" role="alert">{confirmationError}</p>
          ) : (
            <p id="confirmar-requisitos" className="study-hint">Repita exatamente a mesma senha</p>
          )}
          <label className="study-show-password">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>Mostrar senha</span>
          </label>
        </div>

        <button type="submit" disabled={loading} className="study-submit ds-btn">
          {loading ? 'Criando conta…' : 'Criar meu espaço'}
        </button>

        {/* Campo isca contra robô: invisível para quem usa teclado e leitor de
            tela, mas preenchido por robô de cadastro em massa. */}
        <div aria-hidden="true" className="sr-only">
          <label htmlFor="website">Não preencha este campo</label>
          <input id="website" name="website" tabIndex={-1} autoComplete="off" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} />
        </div>
      </form>
    </AuthLayout>
  )
}

export default Register
