import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import usuarioService from '../services/usuarioService'
import authService from '../services/authService'
import perfilService from '../services/perfilService'
import cronogramaService from '../services/cronogramaService'
import ChecklistMaterias from '../components/ChecklistMaterias'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'

const API_URL = ''

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

const IconBook = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5S19.832 5.477 21 6.253v13C19.832 18.477 18.246 18 16.5 18s-3.332.477-4.5 1.253" />
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
  return fotoUrl
}

const diasPadrao = [
  { dia_semana: 'SEG', label: 'Segunda-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'TER', label: 'Terça-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'QUA', label: 'Quarta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'QUI', label: 'Quinta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'SEX', label: 'Sexta-feira', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'SAB', label: 'Sábado', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 0 },
  { dia_semana: 'DOM', label: 'Domingo', hora_inicio: '08:00', hora_fim: '18:00', ocupado: 1 }
]

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

  const [loadingEstudos, setLoadingEstudos] = useState(false)
  const [regenerando, setRegenerando] = useState(false)

  const [estudoForm, setEstudoForm] = useState({
    ano_escolar: '',
    objetivo: '',
    areas_foco: '',
    tempo_diario_min: 60,
    prazo_estimado: 30
  })

  const [disponibilidade, setDisponibilidade] = useState(diasPadrao)

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

  useEffect(() => {
    async function carregarPerfilEstudo() {
      try {
        const data = await perfilService.obterPerfilCompleto()

        if (data.perfil) {
          setEstudoForm({
            ano_escolar: data.perfil.ano_escolar || '',
            objetivo: data.perfil.objetivo || '',
            areas_foco: data.perfil.areas_foco || '',
            tempo_diario_min: data.perfil.tempo_diario_min || 60,
            prazo_estimado: data.perfil.prazo_estimado || 30
          })
        }

        if (data.disponibilidade?.length > 0) {
          setDisponibilidade(
            diasPadrao.map((dia) => {
              const encontrado = data.disponibilidade.find(
                (d) => d.dia_semana === dia.dia_semana
              )

              return encontrado
                ? {
                    ...dia,
                    hora_inicio: encontrado.hora_inicio?.slice(0, 5) || '08:00',
                    hora_fim: encontrado.hora_fim?.slice(0, 5) || '18:00',
                    ocupado: Number(encontrado.ocupado)
                  }
                : dia
            })
          )
        }
      } catch (error) {
        console.error('Erro ao carregar perfil de estudo:', error)
      }
    }

    carregarPerfilEstudo()
  }, [])

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
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao enviar foto.')
    } finally {
      setUploadingFoto(false)
      e.target.value = ''
    }
  }

const handleSaveInfo = async (e) => {
    e.preventDefault()

    if (form.nome.trim() && !/^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(form.nome.trim())) {
      toast.error('O nome deve conter apenas letras.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) {
      toast.error('Email inválido.')
      return
    }

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
        senhaForm.novaSenha,
        senhaForm.confirmarSenha
      )

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

  const toggleDiaEstudo = (index) => {
    setDisponibilidade((dias) =>
      dias.map((dia, i) =>
        i === index
          ? { ...dia, ocupado: dia.ocupado ? 0 : 1 }
          : dia
      )
    )
  }

const handleSaveEstudos = async (e) => {
    e.preventDefault()

    const areas = estudoForm.areas_foco
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean)

    const somenteLetras = areas.every((a) =>
      /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ ][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/.test(a)
    )

    if (!somenteLetras) {
      toast.error('As áreas de foco devem conter apenas letras.')
      return
    }

    setLoadingEstudos(true)

    try {
      await perfilService.atualizarPerfil(estudoForm)

      const diasParaSalvar = disponibilidade.map(({ label, ...dia }) => dia)

      await perfilService.salvarDisponibilidade(diasParaSalvar)

      toast.success('Perfil de estudo atualizado!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar perfil de estudo')
    } finally {
      setLoadingEstudos(false)
    }
  }

  const handleRegenerarCronograma = async () => {
    setRegenerando(true)

    try {
      await cronogramaService.gerarCronograma()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao regenerar cronograma')
    } finally {
      setRegenerando(false)
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

            <button
              type="button"
              onClick={() => setTab('estudos')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === 'estudos'
                  ? 'bg-[#4B4C9D] text-white shadow-lg'
                  : 'text-black/60 hover:text-black hover:bg-[#9394CF]/15'
              }`}
            >
              <IconBook /> Estudos
            </button>
          </div>

          {tab === 'info' && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-[#9394CF]/20">
              <form onSubmit={handleSaveInfo} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <input className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} placeholder="Nome completo" required />
                  <input className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" value={form.apelido} onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))} placeholder="Apelido" />
                </div>

                <input className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" required />

                <button disabled={saving} className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-bold shadow-xl">
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'seguranca' && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-[#9394CF]/20">
              <h2 className="text-xl font-black text-black mb-6 flex items-center gap-2">
                <IconLock /> Alterar senha
              </h2>

              <form onSubmit={handleSaveSenha} className="space-y-5 max-w-lg">
                <input type="password" value={senhaForm.senhaAtual} onChange={(e) => setSenhaForm((f) => ({ ...f, senhaAtual: e.target.value }))} placeholder="Senha atual" className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" required />
                <input type="password" value={senhaForm.novaSenha} onChange={(e) => setSenhaForm((f) => ({ ...f, novaSenha: e.target.value }))} placeholder="Nova senha" className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" required />
                <input type="password" value={senhaForm.confirmarSenha} onChange={(e) => setSenhaForm((f) => ({ ...f, confirmarSenha: e.target.value }))} placeholder="Confirmar nova senha" className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" required />

                {senhaErro && (
                  <div className="p-4 rounded-[1.5rem] bg-red-100 border border-red-300 text-red-700 text-sm font-semibold">
                    {senhaErro}
                  </div>
                )}

                <button disabled={saving} className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-bold shadow-xl">
                  {saving ? 'Salvando...' : 'Alterar senha'}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'estudos' && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="bg-white rounded-[3rem] p-6 sm:p-8 shadow-2xl border border-[#9394CF]/20">
              <h2 className="text-xl font-black text-black mb-2 flex items-center gap-2">
                <IconBook /> Perfil de estudo
              </h2>

              <p className="text-black/60 mb-6">
                Atualize suas preferências para melhorar a geração do cronograma.
              </p>

              <form onSubmit={handleSaveEstudos} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <select value={estudoForm.ano_escolar} onChange={(e) => setEstudoForm((f) => ({ ...f, ano_escolar: e.target.value }))} className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" required>
                    <option value="">Ano escolar</option>
                    <option value="9º">9º ano</option>
                    <option value="1º EM">1º ano EM</option>
                    <option value="2º EM">2º ano EM</option>
                    <option value="3º EM">3º ano EM</option>
                  </select>

                  <select value={estudoForm.objetivo} onChange={(e) => setEstudoForm((f) => ({ ...f, objetivo: e.target.value }))} className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" required>
                    <option value="">Objetivo</option>
                    <option value="ENEM">ENEM</option>
                    <option value="VESTIBULAR">Vestibular</option>
                    <option value="OBMEP">OBMEP</option>
                    <option value="CURSO">Curso</option>
                  </select>
                </div>

<ChecklistMaterias
                  value={estudoForm.areas_foco}
                  onChange={(novaAreas) =>
                    setEstudoForm((f) => ({ ...f, areas_foco: novaAreas }))
                  }
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <input type="number" min="30" max="480" value={estudoForm.tempo_diario_min} onChange={(e) => setEstudoForm((f) => ({ ...f, tempo_diario_min: Number(e.target.value) }))} className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40" />

                  <select value={estudoForm.prazo_estimado} onChange={(e) => setEstudoForm((f) => ({ ...f, prazo_estimado: Number(e.target.value) }))} className="w-full rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40">
                    <option value={30}>Mensal</option>
                    <option value={90}>Trimestral</option>
                    <option value={180}>Semestral</option>
                    <option value={365}>Anual</option>
                  </select>
                </div>

                <div className="space-y-3 pt-4 border-t border-[#9394CF]/20">
                  {disponibilidade.map((dia, index) => (
                    <div key={dia.dia_semana} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-[#F7F7FB] rounded-[2rem] border border-[#9394CF]/20">
                      <label className="flex items-center gap-4 font-bold">
                        <input type="checkbox" checked={!dia.ocupado} onChange={() => toggleDiaEstudo(index)} className="w-5 h-5 accent-[#4B4C9D]" />
                        {dia.label}
                      </label>

                      {!dia.ocupado && (
                        <div className="flex items-center gap-2">
                          <input type="time" value={dia.hora_inicio} onChange={(e) => {
                            const novosDias = [...disponibilidade]
                            novosDias[index].hora_inicio = e.target.value
                            setDisponibilidade(novosDias)
                          }} className="bg-white border border-[#9394CF]/40 rounded-full px-3 py-2 text-xs" />

                          <span>às</span>

                          <input type="time" value={dia.hora_fim} onChange={(e) => {
                            const novosDias = [...disponibilidade]
                            novosDias[index].hora_fim = e.target.value
                            setDisponibilidade(novosDias)
                          }} className="bg-white border border-[#9394CF]/40 rounded-full px-3 py-2 text-xs" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={loadingEstudos} className="bg-[#4B4C9D] text-white px-8 py-3 rounded-full font-bold shadow-xl">
                    {loadingEstudos ? 'Salvando...' : 'Salvar perfil de estudo'}
                  </button>

                  <button type="button" onClick={handleRegenerarCronograma} disabled={regenerando} className="bg-black text-white px-8 py-3 rounded-full font-bold shadow-xl">
                    {regenerando ? 'Gerando...' : 'Regenerar cronograma'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}