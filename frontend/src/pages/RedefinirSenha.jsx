import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import authService from '../services/authService'

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const token = params.get('token') || ''

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (novaSenha !== confirmarSenha) return setError('As senhas não coincidem.')
    setLoading(true)
    try {
      await authService.redefinirSenha(token, novaSenha, confirmarSenha)
      navigate('/login', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Link inválido ou expirado.')
    } finally { setLoading(false) }
  }

  return <main className="min-h-screen grid place-items-center bg-[#4B4C9D] p-5">
    <form onSubmit={submit} className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-2xl">
      <h1 className="text-3xl font-black">Redefinir senha</h1>
      <p className="mt-2 text-black/60">Use ao menos 8 caracteres, uma letra maiúscula e um número.</p>
      <input className="mt-6 w-full rounded-full border p-3" type="password" placeholder="Nova senha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required />
      <input className="mt-3 w-full rounded-full border p-3" type="password" placeholder="Confirmar senha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required />
      {error && <p className="mt-3 text-sm font-bold text-red-600">{error}</p>}
      <button className="mt-5 w-full rounded-full bg-[#4B4C9D] p-3 font-bold text-white disabled:opacity-50" disabled={loading || !token}>{loading ? 'Salvando…' : 'Salvar nova senha'}</button>
      <Link className="mt-4 block text-center font-bold text-[#4B4C9D]" to="/login">Voltar ao login</Link>
    </form>
  </main>
}
