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
      <div className="w-full flex items-center justify-center py-20">
        <p className="text-textSecondary">Carregando perfil...</p>
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
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-indigo-500 flex items-center justify-center shadow-2xl ring-4 ring-white/10 overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={getFotoUrl(avatarPreview)}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                    onError={() => setAvatarPreview(null)}
                  />
                ) : (
                  <span className="text-5xl font-black text-white">
                    {initials}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploadingFoto}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all shadow-lg disabled:opacity-50"
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

            <h1 className="text-3xl font-black text-textPrimary mt-4">
              {displayName}
            </h1>

            <p className="text-textSecondary mt-1">
              {tipoLabel} • Membro desde {dataCadastro}
            </p>

            <p className="text-xs text-textSecondary mt-2">
              Clique no ícone da câmera para enviar uma foto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 mb-6 bg-white/5 p-1.5 rounded-2xl border border-white/10 w-fit mx-auto">
            <button
              type="button"
              onClick={() => setTab('info')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === 'info'
                  ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'
              }`}
            >
              <IconUser /> Informações
            </button>

            <button
              type="button"
              onClick={() => setTab('seguranca')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                tab === 'seguranca'
                  ? 'bg-gradient-to-r from-primary to-indigo-500 text-white shadow-lg'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-white/5'
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
              className="glass-card p-6 sm:p-8"
            >
              <form onSubmit={handleSaveInfo} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={form.nome}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, nome: e.target.value }))
                      }
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Apelido
                    </label>
                    <input
                      type="text"
                      value={form.apelido}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, apelido: e.target.value }))
                      }
                      className="input-field"
                      placeholder="Como quer ser chamado?"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Tipo
                    </label>
                    <input
                      type="text"
                      value={tipoLabel}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-textSecondary mb-2">
                      Data de cadastro
                    </label>
                    <input
                      type="text"
                      value={dataCadastro}
                      disabled
                      className="input-field opacity-60 cursor-not-allowed"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
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
              className="glass-card p-6 sm:p-8"
            >
              <h2 className="text-xl font-bold text-textPrimary mb-6 flex items-center gap-2">
                <IconLock /> Alterar senha
              </h2>

              <form onSubmit={handleSaveSenha} className="space-y-5 max-w-lg">
                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Senha atual
                  </label>
                  <input
                    type="password"
                    value={senhaForm.senhaAtual}
                    onChange={(e) =>
                      setSenhaForm((f) => ({ ...f, senhaAtual: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Nova senha
                  </label>
                  <input
                    type="password"
                    value={senhaForm.novaSenha}
                    onChange={(e) =>
                      setSenhaForm((f) => ({ ...f, novaSenha: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                  <p className="text-xs text-textSecondary mt-1.5">
                    Mínimo 8 caracteres, 1 maiúscula e 1 número
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-textSecondary mb-2">
                    Confirmar nova senha
                  </label>
                  <input
                    type="password"
                    value={senhaForm.confirmarSenha}
                    onChange={(e) =>
                      setSenhaForm((f) => ({ ...f, confirmarSenha: e.target.value }))
                    }
                    className="input-field"
                    required
                  />
                </div>

                {senhaErro && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {senhaErro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
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