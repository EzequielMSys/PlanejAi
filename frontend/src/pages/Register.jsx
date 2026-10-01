import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout'
import { SENHA_MINIMA, REQUISITOS_SENHA, validarSenha } from '../config/senha'

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
  const [showConfirm, setShowConfirm] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const validate = () => {
    const newErrors = {}

if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório'
    } else if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(formData.nome.trim())) {
      newErrors.nome = 'O nome deve conter apenas letras'
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
      newErrors.confirmarSenha = 'As senhas não coincidem'
    }

    setErrors(newErrors)
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

const inputClass = (field) => `pn-campo${errors[field] ? ' pn-campo-erro' : ''}`

  return (
    <AuthLayout
      title="Criar sua conta"
      subtitle="Em menos de um minuto o primeiro mapa de estudos fica pronto."
      destaque={
        <>
          <p className="pn-sobrancelha">Comece por aqui</p>
          <h2 className="pn-secao">Veja onde você está. Depois, para onde ir.</h2>
          <ul className="pn-auth-lista">
            <li>Seu cronograma se monta sozinho, semana por semana.</li>
            <li>Provas e redações revelam o que já está firme.</li>
            <li>Turma, docente e você no mesmo mapa.</li>
          </ul>
        </>
      }
      rodape={
        <p className="pn-corpo">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      }
    >
      <form className="pn-form" onSubmit={handleSubmit} noValidate>
        <div>
          <label htmlFor="nome" className="pn-etiqueta">Nome completo</label>
          <input
            id="nome"
            type="text"
            autoFocus
            autoComplete="name"
            placeholder="João Silva"
            value={formData.nome}
            onChange={(e) => handleChange('nome', e.target.value)}
            aria-invalid={Boolean(errors.nome)}
            className={inputClass('nome')}
          />
          {errors.nome && <p className="pn-erro" role="alert">{errors.nome}</p>}
        </div>

          <div>
            <label htmlFor="email" className="pn-etiqueta">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="joao@exemplo.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              aria-invalid={Boolean(errors.email)}
              className={inputClass('email')}
            />
            {errors.email && <p className="pn-erro" role="alert">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="senha" className="pn-etiqueta">Senha</label>
            <div className="pn-com-botao">
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
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="pn-olho"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.senha ? (
              <p className="pn-erro" role="alert">{errors.senha}</p>
            ) : (
              <p id="senha-requisitos" className="pn-dica">{REQUISITOS_SENHA}</p>
            )}
          </div>

        <div>
          <label htmlFor="confirmarSenha" className="pn-etiqueta">Confirmar senha</label>
          <div className="pn-com-botao">
            <input
              id="confirmarSenha"
              type={showConfirm ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              value={formData.confirmarSenha}
              onChange={(e) => handleChange('confirmarSenha', e.target.value)}
              aria-invalid={Boolean(errors.confirmarSenha)}
              className={inputClass('confirmarSenha')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              aria-label={showConfirm ? 'Ocultar confirmação' : 'Mostrar confirmação'}
              className="pn-olho"
            >
              <EyeIcon open={showConfirm} />
            </button>
          </div>
          {errors.confirmarSenha && <p className="pn-erro" role="alert">{errors.confirmarSenha}</p>}
        </div>

        <button type="submit" disabled={loading} className="pn-btn pn-btn-primario pn-btn-largo">
          {loading ? 'Criando conta…' : 'Criar conta'}
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
