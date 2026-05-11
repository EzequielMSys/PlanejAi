import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import usuarioService from '../services/usuarioService'
import authService from '../services/authService'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

const API_URL = 'http://localhost:3000'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

const IconUser = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const IconLock = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const IconCamera = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconSpinner = () => (
  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

function validarSenha(senha) {
  if (senha.length < 8) return 'Mínimo 8 caracteres'
  if (!/[A-Z]/.test(senha)) return 'Pelo menos 1 letra maiúscula'
  if (!/[0-9]/.test(senha)) return 'Pelo menos 1 número'
  return null
}

function getFotoUrl(fotoUrl) {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith('http')) return fotoUrl
  return `${API_URL}${fotoUrl}`
}

export default function Perfil() {
  const { user, updateUser } = useAuth()
  const fileRef = useRef(null)

  const [tab, setTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.foto_url || null)

  const [form, setForm] = useState({
    nome: '',
    apelido: '',
    email: ''
  })

  const [senhaForm, setSenhaForm] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  })

  const [senhaErro, setSenhaErro] = useState('')

  useEffect(() => {
    if (user) {
      setForm({
        nome: user.nome || '',
        apelido: user.apelido || '',
        email: user.email || ''
      })

      setAvatarPreview(user.foto_url || null)
    }
  }, [user])

  const handleUploadFoto = async (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem válida.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2MB.')
      return
    }

    setUploadingFoto(true)

    try {
      const response = await usuarioService.uploadFotoPerfil(file)
      const usuarioAtualizado = response.usuario

      updateUser(usuarioAtualizado)
      setAvatarPreview(usuarioAtualizado.foto_url || null)

      toast.success('Foto atualizada com sucesso!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao enviar foto.')
    } finally {
      setUploadingFoto(false)
      e.target.value = ''
    }
  }

  const handleSaveInfo = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      const usuarioId = user.id_usuario || user.id

      const payload = {
        nome: form.nome,
        email: form.email,
        apelido: form.apelido
      }

      const response = await usuarioService.atualizar(usuarioId, payload)

      const usuarioAtualizado = response.usuario || {
        ...user,
        ...payload
      }

      updateUser(usuarioAtualizado)

      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar perfil')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveSenha = async (e) => {
    e.preventDefault()
    setSenhaErro('')

    const erro = validarSenha(senhaForm.novaSenha)

    if (erro) {
      setSenhaErro(erro)
      return
    }

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      setSenhaErro('As senhas não coincidem')
      return
    }

    setSaving(true)

    try {
      await authService.alterarSenha(
        senhaForm.senhaAtual,
        senhaForm.novaSenha
      )

      toast.success('Senha alterada com sucesso!')

      setSenhaForm({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: ''
      })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao alterar senha'
      setSenhaErro(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7FB]">
        <div className="bg-white rounded-[3rem] shadow-2xl border border-[#9394CF]/20 p-10 text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-[#4B4C9D] mx-auto mb-4"></div>
          <p className="text-black/65 font-bold">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const displayName = form.apelido || form.nome || 'Usuário'
  const initials = (displayName.charAt(0) || 'U').toUpperCase()

  const tipoLabel =
    user?.tipo === 'dono'
      ? 'Dono'
      : user?.tipo === 'admin'
        ? 'Administrador'
        : user?.tipo === 'docente'
          ? 'Docente'
          : 'Aluno'

  const dataCadastro = user?.data_cadastro
    ? new Date(user.data_cadastro).toLocaleDateString('pt-BR')
    : 'Não informado'

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 text-center">
              <div className="relative inline-block">
                <div className="w-28 h-28 rounded-full bg-white/85 flex items-center justify-center shadow-2xl ring-4 ring-white/40 overflow-hidden mx-auto">
                  {avatarPreview ? (
                    <img
                      src={getFotoUrl(avatarPreview)}
                      alt="Foto de perfil"
                      className="w-full h-full object-cover"
                      onError={() => setAvatarPreview(null)}
                    />
                  ) : (
                    <span className="text-5xl font-black text-[#4B4C9D]">
                      {initials}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFoto}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#4B4C9D] transition-all shadow-xl disabled:opacity-50"
                  title="Alterar foto"
                >
                  {uploadingFoto ? <IconSpinner /> : <IconCamera />}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUploadFoto}
                />
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white mt-5 tracking-tight">
                {displayName}
              </h1>

              <p className="text-white/85 mt-1 font-semibold">
                {tipoLabel} • Membro desde {dataCadastro}
              </p>

              <p className="text-xs text-white/75 mt-2">
                Clique no ícone da câmera para enviar uma foto.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-full border border-[#9394CF]/20 w-fit mx-auto shadow-xl">
            <button
              type="button"
              onClick={() => setTab('info')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === 'info'
                  ? 'bg-[#4B4C9D] text-white shadow-lg'
                  : 'text-black/60 hover:text-black hover:bg-[#9394CF]/15'
              }`}
            >
              <IconUser /> Informações
            </button>

            <button
              type="button"
              onClick={() => setTab('seguranca')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === 'seguranca'
                  ? 'bg-[#4B4C9D] text-white shadow-lg'
                  : 'text-black/60 hover:text-black hover:bg-[#9394CF]/15'
              }`}
            >
              <IconLock /> Segurança
            </button>
          </div>

          {tab === 'info' && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-[#9394CF]/20"
            >
              <form onSubmit={handleSaveInfo} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nome: e.target.value }))
                      }
                      className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Apelido
                    </label>
                    <input
                      type="text"
                      value={form.apelido}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, apelido: e.target.value }))
                      }
                      className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                      placeholder="Como quer ser chamado?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Tipo
                    </label>
                    <input
                      type="text"
                      value={tipoLabel}
                      disabled
                      className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black/50 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-black mb-2">
                      Data de cadastro
                    </label>
                    <input
                      type="text"
                      value={dataCadastro}
                      disabled
                      className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black/50 cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <IconSpinner /> Salvando...
                    </>
                  ) : (
                    'Salvar alterações'
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'seguranca' && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-[#9394CF]/20"
            >
              <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <IconLock /> Alterar senha
              </h2>

              <form onSubmit={handleSaveSenha} className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Senha atual
                  </label>
                  <input
                    type="password"
                    value={senhaForm.senhaAtual}
                    onChange={(e) =>
                      setSenhaForm((f) => ({ ...f, senhaAtual: e.target.value }))
                    }
                    className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={senhaForm.novaSenha}
                    onChange={(e) =>
                      setSenhaForm((f) => ({ ...f, novaSenha: e.target.value }))
                    }
                    className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                    required
                  />
                  <p className="text-xs text-black/50 mt-1.5">
                    Mínimo 8 caracteres, 1 maiúscula e 1 número
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-black mb-2">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    value={senhaForm.confirmarSenha}
                    onChange={(e) =>
                      setSenhaForm((f) => ({ ...f, confirmarSenha: e.target.value }))
                    }
                    className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 text-black placeholder-black/40 focus:ring-2 focus:ring-[#9394CF] focus:outline-none transition-all duration-300"
                    required
                  />
                </div>

                {senhaErro && (
                  <div className="p-4 rounded-[1.5rem] bg-red-100 border border-red-300 text-red-700 text-sm font-semibold">
                    {senhaErro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-bold hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <IconSpinner /> Salvando...
                    </>
                  ) : (
                    'Alterar senha'
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}