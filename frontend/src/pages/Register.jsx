import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import authService from '../services/authService'

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
    confirmarSenha: ''
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
      if (formData.senha.length < 8) {
        newErrors.senha = 'Mínimo 8 caracteres'
      }
      if (!/(?=.*[A-Z])/.test(formData.senha)) {
        newErrors.senha = newErrors.senha
          ? `${newErrors.senha} • 1 maiúscula`
          : 'Precisa 1 letra maiúscula'
      }
      if (!/(?=.*\d)/.test(formData.senha)) {
        newErrors.senha = newErrors.senha
          ? `${newErrors.senha} • 1 número`
          : 'Precisa 1 número'
      }
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
        senha: formData.senha
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

  const inputClass = (field) =>
    `w-full rounded-full px-5 py-3 bg-white border text-black placeholder-gray-400
     focus:ring-2 focus:ring-[#9394CF] focus:outline-none
     transition-all duration-300
     ${errors[field] ? 'border-red-400 focus:ring-red-300' : 'border-[#9394CF]/40'}`

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20" />

      <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 right-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
      <div className="absolute top-40 right-1/4 w-20 h-20 border border-white/30 rounded-full" />

      <div className="relative z-10 max-w-md w-full rounded-[3rem] bg-white/85 backdrop-blur-md border border-white/60 shadow-2xl p-8 animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-[#9394CF] rounded-full flex items-center justify-center shadow-xl">
              <span className="text-2xl font-black text-black">P</span>
            </div>
          </Link>

          <h2 className="text-3xl font-black text-black tracking-tight">
            Criar Conta
          </h2>

          <p className="mt-2 text-sm text-black/65">
            Preencha seus dados para começar
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="nome" className="block text-sm font-bold text-black mb-1.5">
              Nome Completo
            </label>
            <input
              id="nome"
              type="text"
              autoFocus
              placeholder="João Silva"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              className={inputClass('nome')}
            />
            {errors.nome && <p className="mt-1 text-xs text-red-500">{errors.nome}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-bold text-black mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              placeholder="joao@exemplo.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={inputClass('email')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
</div>

          <div>
            <label htmlFor="senha" className="block text-sm font-bold text-black mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.senha}
                onChange={(e) => handleChange('senha', e.target.value)}
                className={`${inputClass('senha')} pr-12`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B4C9D] hover:text-black transition-colors"
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.senha ? (
              <p className="mt-1 text-xs text-red-500">{errors.senha}</p>
            ) : (
              <p className="mt-1 text-xs text-black/50">
                Mín. 8 caracteres, 1 maiúscula e 1 número
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-bold text-black mb-1.5">
              Confirmar Senha
            </label>
            <div className="relative">
              <input
                id="confirmarSenha"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={formData.confirmarSenha}
                onChange={(e) => handleChange('confirmarSenha', e.target.value)}
                className={`${inputClass('confirmarSenha')} pr-12`}
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#4B4C9D] hover:text-black transition-colors"
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {errors.confirmarSenha && <p className="mt-1 text-xs text-red-500">{errors.confirmarSenha}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4B4C9D] text-white py-3 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Criando conta...
              </span>
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-black/65">
            Já tem conta?{' '}
            <Link to="/login" className="font-black text-[#4B4C9D] hover:text-black transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
