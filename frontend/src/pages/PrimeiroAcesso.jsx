import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import PasswordFields from '../components/PasswordFields'
import { validarSenha } from '../config/senha'
import { PageHeader, Surface, Button } from '../components/ui/PlanejUI'

export default function PrimeiroAcesso() {
  const [value, setValue] = useState({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user, login } = useAuth()
  async function submit(event) {
    event.preventDefault()
    if (loading) return
    const validation = validarSenha(value.novaSenha)
    if (validation) return setError(validation)
    if (value.novaSenha !== value.confirmarSenha) return setError('As senhas não coincidem.')
    setError(''); setLoading(true)
    try { await authService.trocarSenhaPrimeiroAcesso(value.senhaAtual, value.novaSenha, value.confirmarSenha); await login(user.email, value.novaSenha) }
    catch (err) { setError(err.response?.data?.error || 'Não foi possível atualizar seu acesso. Tente novamente.') }
    finally { setLoading(false) }
  }
  return <div className="pj-page"><div className="pj-wrap security-page"><PageHeader eyebrow="Primeiro acesso" title="Seu plano começa com você." description="Troque a senha temporária para deixar sua conta pronta para estudar." />
    <div className="security-grid"><Surface className="security-form"><form className="pn-form" onSubmit={submit} aria-busy={loading}><PasswordFields value={value} onChange={setValue} disabled={loading} />{error && <p className="pn-erro" role="alert">{error}</p>}<Button type="submit" disabled={loading}>{loading ? 'Preparando seu acesso…' : 'Salvar e continuar'}</Button></form></Surface>
    <Surface className="security-note"><span className="ui-eyebrow">Só sua</span><h2>Uma senha pessoal para um caminho único.</h2><p>Use a senha temporária recebida para confirmar seu acesso. Depois, escolha uma nova senha e guarde-a com cuidado.</p></Surface></div>
  </div></div>
}
