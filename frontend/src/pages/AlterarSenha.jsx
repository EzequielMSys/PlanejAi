import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordFields from '../components/PasswordFields'
import { validarSenha } from '../config/senha'
import { PageHeader, Surface, Button, TextLink } from '../components/ui/PlanejUI'

export default function AlterarSenha() {
  const [value, setValue] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { changePassword } = useAuth()
  const navigate = useNavigate()
  async function submit(event) {
    event.preventDefault()
    if (loading) return
    const validation = validarSenha(value.novaSenha)
    if (validation) return setError(validation)
    if (value.novaSenha !== value.confirmarSenha) return setError('As senhas não coincidem.')
    setError(''); setLoading(true)
    try { await changePassword(value.senhaAtual, value.novaSenha, value.confirmarSenha); navigate('/perfil') }
    catch (err) { setError(err.response?.data?.error || 'Não foi possível alterar a senha. Tente novamente.') }
    finally { setLoading(false) }
  }
  return <div className="pj-page"><div className="pj-wrap security-page">
    <PageHeader eyebrow="Sua conta / Segurança" title="Um cuidado com seu acesso." description="Atualize sua senha e continue de onde parou." />
    <div className="security-grid"><Surface className="security-form"><form className="pn-form" onSubmit={submit} aria-busy={loading}>
      <PasswordFields value={value} onChange={setValue} disabled={loading} />
      {error && <p className="pn-erro" role="alert">{error}</p>}
      <Button type="submit" disabled={loading}>{loading ? 'Salvando…' : 'Salvar nova senha'}</Button><TextLink to="/perfil">Voltar ao perfil</TextLink>
    </form></Surface><Surface className="security-note"><span className="ui-eyebrow">Você no controle</span><h2>Proteção sem perder o ritmo.</h2><p>Você continuará conectado neste aparelho. Os demais acessos precisarão entrar novamente com a nova senha.</p><p>Evite nomes, datas de aniversário e senhas já utilizadas em outros serviços.</p></Surface></div>
  </div></div>
}
