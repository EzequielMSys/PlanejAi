import { useState, useEffect, useRef } from 'react'

import { useAuth } from '../context/AuthContext'
import usuarioService from '../services/usuarioService'
import perfilService from '../services/perfilService'
import cronogramaService from '../services/cronogramaService'
import ChecklistMaterias from '../components/ChecklistMaterias'
import SaveFeedback from '../components/SaveFeedback'
import { toast } from 'react-hot-toast'
import { motion } from 'framer-motion'
import { resolveBackendAsset } from '../config/api'
import { validarSenha } from '../config/senha'
import { fraseConviteLumi } from '../utils/pronounCopy'
import './Perfil.css'

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


function getFotoUrl(fotoUrl) {
  return resolveBackendAsset(fotoUrl)
}

function arquivoComoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new window.FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
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

const pronomesPadrao = ['', 'ela_dela', 'ele_dele', 'elu_delu', 'nome_proprio']

export default function Perfil() {
  const { user, changePassword, updateUser } = useAuth()
  const fileRef = useRef(null)

  const [tab, setTab] = useState('info')
  const [saving, setSaving] = useState(false)
  const [infoSave, setInfoSave] = useState({ status: 'ready' })
  const [studySave, setStudySave] = useState({ status: 'ready' })
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [removingFoto, setRemovingFoto] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.foto_url || null)

  const [form, setForm] = useState({
    nome: '',
    apelido: '',
    email: '',
    pronome: '',
    pronomePersonalizado: ''
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
        email: user.email || '',
        pronome: pronomesPadrao.includes(user.pronome || '') ? (user.pronome || '') : user.pronome ? 'personalizado' : '',
        pronomePersonalizado: pronomesPadrao.includes(user.pronome || '') ? '' : (user.pronome || '')
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

    const fotoAnterior = avatarPreview
    setUploadingFoto(true)

    try {
      setAvatarPreview(await arquivoComoDataUrl(file))
      const response = await usuarioService.uploadFotoPerfil(file)
      const usuarioAtualizado = response.usuario

      updateUser(usuarioAtualizado)
      setAvatarPreview(usuarioAtualizado.foto_url || null)
    } catch (error) {
      setAvatarPreview(fotoAnterior)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao enviar foto.')
    } finally {
      setUploadingFoto(false)
      e.target.value = ''
    }
  }

  const handleRemoverFoto = async () => {
    if (!window.confirm('Remover sua foto de perfil?')) return

    setRemovingFoto(true)
    try {
      const response = await usuarioService.removerFotoPerfil()
      updateUser(response.usuario)
      setAvatarPreview(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao remover foto.')
    } finally {
      setRemovingFoto(false)
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
    setInfoSave({ status: 'saving' })

    try {
      const usuarioId = user.id_usuario || user.id

      const payload = {
        nome: form.nome,
        email: form.email,
        apelido: form.apelido,
        pronome: form.pronome === 'personalizado' ? form.pronomePersonalizado.trim() : form.pronome
      }

      const response = await usuarioService.atualizar(usuarioId, payload)

      const usuarioAtualizado = response.usuario || {
        ...user,
        ...payload
      }

      updateUser(usuarioAtualizado)
      setInfoSave({ status: 'saved' })
    } catch (error) {
      setInfoSave({ status: 'error', message: 'Não foi possível confirmar o salvamento. Seus dados continuam no formulário. Tente novamente.' })
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
      await changePassword(
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
    setStudySave({ status: 'saving' })
    let profileSaved = false

    try {
      await perfilService.atualizarPerfil(estudoForm)
      profileSaved = true

      const diasParaSalvar = disponibilidade.map(({ label, ...dia }) => dia)

      await perfilService.salvarDisponibilidade(diasParaSalvar)
      setStudySave({ status: 'saved', message: 'Objetivos e horários salvos na sua conta.' })

      toast.success('Perfil de estudo atualizado!')
    } catch (error) {
      setStudySave({ status: 'error', message: profileSaved ? 'Os objetivos foram salvos, mas não conseguimos confirmar os horários. Tente salvar novamente.' : 'Não conseguimos confirmar o salvamento. Confira sua conexão e tente novamente.' })
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
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--pn-superficie-alt-rgb)/1)]">
        <div className="bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[3rem] shadow-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] p-10 text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-[rgb(var(--pn-primaria-borda-rgb)/1)] mx-auto mb-4"></div>
          <p className="text-[rgb(var(--pn-texto-rgb)/0.65)] font-bold">Carregando perfil...</p>
        </div>
      </div>
    )
  }

  const displayName = form.apelido || form.nome || 'Usuário'
  const initials = (displayName.charAt(0) || 'U').toUpperCase()

  const tipoLabel =
    user?.tipo === 'dono' || user?.tipo === 'admin'
      ? 'Gestão'
      : user?.tipo === 'docente'
        ? 'Docência'
        : 'Estudante'

  const dataCadastro = user?.data_cadastro
    ? new Date(user.data_cadastro).toLocaleDateString('pt-BR')
    : null

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <header className="profile-hero">
            <div className="profile-identity">
              <div className="profile-avatar-wrap">
                <div className="profile-avatar">
                  {avatarPreview ? (
                    <img
                      src={getFotoUrl(avatarPreview)}
                      alt="Foto de perfil"
                      className="profile-avatar-image"
                      onError={() => setAvatarPreview(null)}
                    />
                  ) : (
                    <span className="profile-avatar-initial">
                      {initials}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingFoto}
                  className="profile-camera"
                  aria-label="Trocar foto de perfil"
                  title="Trocar foto"
                >
                  {uploadingFoto ? <IconSpinner /> : <IconCamera />}
                </button>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  className="profile-file-input"
                  onChange={handleUploadFoto}
                />
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={handleRemoverFoto}
                    disabled={uploadingFoto || removingFoto}
                    className="profile-remove"
                    aria-label="Remover foto de perfil"
                  >
                    {removingFoto ? 'Removendo…' : 'Remover'}
                  </button>
                )}
              </div>

              <div className="profile-identity-copy">
                <p className="profile-eyebrow">MINHA CONTA</p>
                <h1>{displayName}</h1>
                <p className="profile-identity-email">{form.email || user.email}</p>
                <div className="profile-meta">
                  <span>{tipoLabel}</span>
                  {dataCadastro && <span>Membro desde {dataCadastro}</span>}
                </div>
              </div>
            </div>
            <p className="profile-hero-note">Seu espaço para cuidar da conta e ajustar seu jeito de estudar.</p>
          </header>

          <nav className="profile-tabs" aria-label="Seções do perfil">
            <button
              type="button"
              onClick={() => setTab('info')}
              aria-current={tab === 'info' ? 'page' : undefined}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === 'info'
                  ? 'bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white shadow-lg'
                  : 'text-[rgb(var(--pn-texto-rgb)/0.6)] hover:text-[rgb(var(--pn-texto-rgb)/1)] hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.15)]'
              }`}
            >
              <IconUser /> Informações
            </button>

            <button
              type="button"
              onClick={() => setTab('seguranca')}
              aria-current={tab === 'seguranca' ? 'page' : undefined}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === 'seguranca'
                  ? 'bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white shadow-lg'
                  : 'text-[rgb(var(--pn-texto-rgb)/0.6)] hover:text-[rgb(var(--pn-texto-rgb)/1)] hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.15)]'
              }`}
            >
              <IconLock /> Segurança
            </button>

            <button
              type="button"
              onClick={() => setTab('estudos')}
              aria-current={tab === 'estudos' ? 'page' : undefined}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                tab === 'estudos'
                  ? 'bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white shadow-lg'
                  : 'text-[rgb(var(--pn-texto-rgb)/0.6)] hover:text-[rgb(var(--pn-texto-rgb)/1)] hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.15)]'
              }`}
            >
              <IconBook /> Estudos
            </button>
          </nav>

          {tab === 'info' && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="profile-card">
              <div className="profile-section-head"><p className="profile-eyebrow">IDENTIDADE</p><h2>Informações pessoais</h2><p>Escolha como seu nome aparece e mantenha seu contato atualizado.</p></div>
              <form onSubmit={handleSaveInfo} className="space-y-6" onChange={() => setInfoSave({ status: 'pending', message: 'Alterações ainda não salvas. Use o botão Salvar para confirmar.' })}><fieldset disabled={saving} className="min-w-0 space-y-6 border-0 p-0">
                <div className="profile-field-grid">
                  <label className="profile-field">Nome completo<input autoComplete="name" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required /></label>
                  <label className="profile-field">Como quer que a gente chame você?<input value={form.apelido} onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))} placeholder="Nome de preferência (opcional)" /></label>
                </div>

                <label className="profile-field">Pronomes<select value={form.pronome} onChange={(e) => setForm((f) => ({ ...f, pronome: e.target.value }))}>
                  <option value="">Prefiro não informar</option>
                  <option value="ela_dela">Ela / dela</option>
                  <option value="ele_dele">Ele / dele</option>
                  <option value="elu_delu">Elu / delu</option>
                  <option value="nome_proprio">Prefiro que use meu nome</option>
                  <option value="personalizado">Quero informar outros pronomes</option>
                </select><small className="profile-field-hint">Essa preferência é opcional e serve para adaptar a linguagem da Lumi. Você pode alterá-la quando quiser.</small></label>

                {form.pronome === 'personalizado' && <label className="profile-field">Quais pronomes você usa?<input value={form.pronomePersonalizado} onChange={(e) => setForm((f) => ({ ...f, pronomePersonalizado: e.target.value }))} maxLength={80} placeholder="Ex.: they/them, xe/xem ou ela/elu" /><small className="profile-field-hint">Opcional. A Lumi mantém linguagem neutra nos textos que não podem ser adaptados com segurança.</small></label>}

                <div className="profile-pronoun-preview" aria-live="polite"><span>PRÉVIA DE TRATAMENTO</span><p>“{fraseConviteLumi(form.pronome === 'personalizado' ? form.pronomePersonalizado : form.pronome)}”</p><small>{form.pronome === 'personalizado' && form.pronomePersonalizado.trim() ? `Preferência informada: ${form.pronomePersonalizado.trim()}. ` : ''}A preferência só muda no perfil quando você salvar; nos textos sem flexão, a linguagem continua neutra.</small></div>

                <label className="profile-field">Email da conta<input autoComplete="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></label>

                <button type="submit" disabled={saving} className="profile-primary-button">
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
              </fieldset>{infoSave.status !== 'ready' && <SaveFeedback status={infoSave.status} message={infoSave.message} onRetry={() => handleSaveInfo({ preventDefault() {} })} />}</form>
            </motion.div>
          )}

          {tab === 'seguranca' && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="profile-card">
              <div className="profile-section-head"><p className="profile-eyebrow">PROTEÇÃO</p><h2>Segurança da conta</h2><p>Atualize sua senha para manter seu acesso protegido.</p></div>

              <form onSubmit={handleSaveSenha} className="profile-security-form">
                <label className="profile-field">Senha atual<input type="password" autoComplete="current-password" value={senhaForm.senhaAtual} onChange={(e) => setSenhaForm((f) => ({ ...f, senhaAtual: e.target.value }))} required /></label>
                <label className="profile-field">Nova senha<input type="password" autoComplete="new-password" value={senhaForm.novaSenha} onChange={(e) => setSenhaForm((f) => ({ ...f, novaSenha: e.target.value }))} required /></label>
                <label className="profile-field">Confirme a nova senha<input type="password" autoComplete="new-password" value={senhaForm.confirmarSenha} onChange={(e) => setSenhaForm((f) => ({ ...f, confirmarSenha: e.target.value }))} required /></label>

                {senhaErro && (
                  <div role="alert" className="p-4 rounded-[1.5rem] bg-red-100 border border-red-300 text-red-700 text-sm font-semibold">
                    {senhaErro}
                  </div>
                )}

                <button disabled={saving} className="profile-primary-button">
                  {saving ? 'Salvando...' : 'Alterar senha'}
                </button>
              </form>
            </motion.div>
          )}

          {tab === 'estudos' && (
            <motion.div variants={fadeUp} initial="hidden" animate="visible" className="profile-card">
              <div className="profile-section-head"><p className="profile-eyebrow">SEU RITMO</p><h2>Perfil de estudo</h2><p>Essas escolhas ajudam a organizar seu cronograma.</p></div>

              <form onSubmit={handleSaveEstudos} className="space-y-6" onChange={() => setStudySave({ status: 'pending', message: 'Alterações ainda não salvas. Use o botão Salvar para confirmar.' })}><fieldset disabled={loadingEstudos} className="min-w-0 space-y-6 border-0 p-0">
                <div className="profile-field-grid">
                  <label className="profile-field">Ano escolar<select value={estudoForm.ano_escolar} onChange={(e) => setEstudoForm((f) => ({ ...f, ano_escolar: e.target.value }))} required>
                    <option value="">Ano escolar</option>
                    <option value="9º">9º ano</option>
                    <option value="1º EM">1º ano EM</option>
                    <option value="2º EM">2º ano EM</option>
                    <option value="3º EM">3º ano EM</option>
                  </select></label>

                  <label className="profile-field">Objetivo<select value={estudoForm.objetivo} onChange={(e) => setEstudoForm((f) => ({ ...f, objetivo: e.target.value }))} required>
                    <option value="">Objetivo</option>
                    <option value="ENEM">ENEM</option>
                    <option value="VESTIBULAR">Vestibular</option>
                    <option value="OBMEP">OBMEP</option>
                    <option value="CURSO">Curso</option>
                  </select></label>
                </div>

<ChecklistMaterias
                  value={estudoForm.areas_foco}
                  onChange={(novaAreas) =>
                    setEstudoForm((f) => ({ ...f, areas_foco: novaAreas }))
                  }
                />

                <div className="profile-field-grid">
                  <label className="profile-field">Tempo diário (minutos)<input type="number" min="30" max="480" value={estudoForm.tempo_diario_min} onChange={(e) => setEstudoForm((f) => ({ ...f, tempo_diario_min: Number(e.target.value) }))} /></label>

                  <label className="profile-field">Horizonte do planejamento<select value={estudoForm.prazo_estimado} onChange={(e) => setEstudoForm((f) => ({ ...f, prazo_estimado: Number(e.target.value) }))}>
                    <option value={30}>Mensal</option>
                    <option value={90}>Trimestral</option>
                    <option value={180}>Semestral</option>
                    <option value={365}>Anual</option>
                  </select></label>
                </div>

                <div className="profile-availability"><h3>Disponibilidade semanal</h3><p>Selecione os dias em que você pode estudar.</p>
                  {disponibilidade.map((dia, index) => (
                    <div key={dia.dia_semana} className="profile-day">
                      <label className="profile-day-toggle">
                        <input type="checkbox" checked={!dia.ocupado} onChange={() => toggleDiaEstudo(index)} className="w-5 h-5 accent-[#4B4C9D]" />
                        {dia.label}
                      </label>

                      {!dia.ocupado && (
                        <div className="flex items-center gap-2">
                          <input aria-label={`Início de ${dia.label}`} type="time" value={dia.hora_inicio} onChange={(e) => {
                            const novosDias = [...disponibilidade]
                            novosDias[index].hora_inicio = e.target.value
                            setDisponibilidade(novosDias)
                          }} className="bg-[rgb(var(--pn-superficie-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] rounded-full px-3 py-2 text-xs" />

                          <span>às</span>

                          <input aria-label={`Fim de ${dia.label}`} type="time" value={dia.hora_fim} onChange={(e) => {
                            const novosDias = [...disponibilidade]
                            novosDias[index].hora_fim = e.target.value
                            setDisponibilidade(novosDias)
                          }} className="bg-[rgb(var(--pn-superficie-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] rounded-full px-3 py-2 text-xs" />
                        </div>
                      )}
                    </div>
                  ))}</div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button type="submit" disabled={loadingEstudos} className="profile-primary-button">
                    {loadingEstudos ? 'Salvando...' : 'Salvar perfil de estudo'}
                  </button>

                  <button type="button" onClick={handleRegenerarCronograma} disabled={regenerando} className="profile-secondary-button">
                    {regenerando ? 'Gerando...' : 'Regenerar cronograma'}
                  </button>
                </div>
              </fieldset>{studySave.status !== 'ready' && <SaveFeedback status={studySave.status} message={studySave.message} onRetry={() => handleSaveEstudos({ preventDefault() {} })} />}</form>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  )
}
