import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout'
import PasswordFields from '../components/PasswordFields'
import { validarSenha } from '../config/senha'

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [value, setValue] = useState({ novaSenha: '', confirmarSenha: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const token = params.get('token') || ''
  const validLink = /^[a-f0-9]{64}$/i.test(token)
  async function submit(event) {
    event.preventDefault()
    if (loading || !validLink) return
    const validation = validarSenha(value.novaSenha)
    if (validation) return setError(validation)
    if (value.novaSenha !== value.confirmarSenha) return setError('As senhas não coincidem.')
    setError('')
    setLoading(true)
    try { await authService.redefinirSenha(token, value.novaSenha, value.confirmarSenha); navigate('/login', { replace: true }) }
    catch (err) { setError(err.response?.data?.error || 'Não foi possível redefinir a senha. Solicite um novo link se ele expirou.') }
    finally { setLoading(false) }
  }
  return <AuthLayout title="Um novo acesso ao seu plano" subtitle="Crie uma senha que só você conhece para retomar seus estudos."
    rodape={<p className="pn-corpo"><Link to="/login">Voltar para entrar</Link></p>}
    destaque={<><p className="pn-sobrancelha">Sua conta, protegida</p><h2 className="pn-secao">Vamos recomeçar?</h2><ul className="pn-auth-lista"><li>Escolha uma senha diferente de outros sites.</li><li>As sessões anteriores serão encerradas.</li><li>Seu histórico de estudos permanece com você.</li></ul></>}>
    {!validLink ? <div className="pn-form"><p className="pn-erro" role="alert">Este link de recuperação está incompleto ou é inválido.</p><Link className="pn-btn pn-btn-primario" to="/esqueci-senha">Solicitar novo link</Link></div>
      : <form className="pn-form" onSubmit={submit} aria-busy={loading}>
        <PasswordFields value={value} onChange={setValue} includeCurrent={false} disabled={loading} />
        {error && <p className="pn-erro" role="alert">{error}</p>}
        <button className="pn-btn pn-btn-primario" disabled={loading}>{loading ? 'Salvando…' : 'Salvar nova senha'} <span aria-hidden="true">→</span></button>
      </form>}
  </AuthLayout>
}
