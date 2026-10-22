import { useState } from 'react'
import { Link } from 'react-router-dom'
import authService from '../services/authService'
import AuthLayout from '../components/AuthLayout'

export default function EsqueciSenha() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  async function submit(event) {
    event.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    try { await authService.esqueciSenha(email); setSent(true) }
    catch (err) { setError(err.response?.data?.error || 'Não foi possível enviar o link. Tente novamente.') }
    finally { setLoading(false) }
  }
  return <AuthLayout title={sent ? 'Confira seu email' : 'Vamos recuperar seu acesso'}
    subtitle={sent ? 'Se o endereço estiver cadastrado, você receberá um link válido por 30 minutos.' : 'Informe o email da sua conta. Enviaremos um link para criar uma nova senha.'}
    rodape={<p className="pn-corpo">Lembrou a senha? <Link to="/login">Voltar para entrar</Link></p>}
    destaque={<><p className="pn-sobrancelha">Pode ficar tranquilo</p><h2 className="pn-secao">Seu plano continua aqui.</h2><ul className="pn-auth-lista"><li>Seus cronogramas e redações ficam preservados.</li><li>O link é pessoal e só pode ser utilizado uma vez.</li><li>Confira também a pasta de spam do seu email.</li></ul></>}>
    {sent ? <div className="auth-confirmation" role="status"><span aria-hidden="true">✓</span><h2>Próximo passo: abra sua caixa de entrada.</h2><p>Não recebeu? Confira o endereço digitado e tente novamente.</p><button className="pn-btn pn-btn-fantasma" onClick={() => setSent(false)}>Conferir email</button></div>
      : <form className="pn-form" onSubmit={submit} aria-busy={loading}>
        <div><label htmlFor="recovery-email" className="pn-etiqueta">Email cadastrado</label><input id="recovery-email" className="pn-campo" type="email" autoComplete="email" placeholder="seu@email.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
        {error && <p className="pn-erro" role="alert">{error}</p>}
        <button className="pn-btn pn-btn-primario" disabled={loading}>{loading ? 'Enviando link…' : 'Enviar link de recuperação'} <span aria-hidden="true">→</span></button>
      </form>}
  </AuthLayout>
}
