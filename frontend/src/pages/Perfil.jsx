import { useState, useEffect, useRef } from 'react'

import { useAuth } from '../context/AuthContext'
import usuarioService from '../services/usuarioService'
import perfilService from '../services/perfilService'
import cronogramaService from '../services/cronogramaService'
import ChecklistMaterias, { areasFocoParaLista } from '../components/ChecklistMaterias'
import SaveFeedback from '../components/SaveFeedback'
import ProfileImageEditor from '../components/ProfileImageEditor'
import { toast } from 'react-hot-toast'
import { resolveBackendAsset } from '../config/api'
import { validarSenha } from '../config/senha'
import { fraseConviteLumi } from '../utils/pronounCopy'
import './Perfil.css'

const IconPencil = () => (
  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m16.86 3.49 3.65 3.65M4 20l4.6-.92L20.1 7.58a2.58 2.58 0 0 0-3.65-3.65L4.92 15.4 4 20Z" />
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
  const bannerFileRef = useRef(null)
  const avatarActionsRef = useRef(null)
  const bannerActionsRef = useRef(null)
  const infoFormRef = useRef(null)
  const studyFormRef = useRef(null)
  const passwordFormRef = useRef(null)
  const savedInfoRef = useRef(null)
  const loadedUserIdRef = useRef(null)
  const savedStudyRef = useRef({ ano_escolar: '', objetivo: '', areas_foco: '', tempo_diario_min: 60, prazo_estimado: 30 })
  const savedDaysRef = useRef(diasPadrao)

  const [saving, setSaving] = useState(false)
  const [infoSave, setInfoSave] = useState({ status: 'ready' })
  const [studySave, setStudySave] = useState({ status: 'ready' })
  const [passwordSave, setPasswordSave] = useState({ status: 'ready' })
  const [activeSection, setActiveSection] = useState('quem-sou')
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  const [removingFoto, setRemovingFoto] = useState(false)
  const [removingBanner, setRemovingBanner] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(user?.foto_url || null)
  const [bannerPreview, setBannerPreview] = useState(user?.banner_url || null)
  const [imageEditor, setImageEditor] = useState(null)

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
      const loadedInfo = {
        nome: user.nome || '',
        apelido: user.apelido || '',
        email: user.email || '',
        pronome: pronomesPadrao.includes(user.pronome || '') ? (user.pronome || '') : user.pronome ? 'personalizado' : '',
        pronomePersonalizado: pronomesPadrao.includes(user.pronome || '') ? '' : (user.pronome || '')
      }
      const userId = user.id_usuario || user.id
      if (loadedUserIdRef.current !== userId || !savedInfoRef.current || JSON.stringify(form) === JSON.stringify(savedInfoRef.current)) {
        setForm(loadedInfo)
        savedInfoRef.current = loadedInfo
      }
      loadedUserIdRef.current = userId

      setAvatarPreview(user.foto_url || null)
      setBannerPreview(user.banner_url || null)
    }
  }, [user])

  useEffect(() => {
    async function carregarPerfilEstudo() {
      try {
        const data = await perfilService.obterPerfilCompleto()

        if (data.perfil) {
          const loadedStudy = {
            ano_escolar: data.perfil.ano_escolar || '',
            objetivo: data.perfil.objetivo || '',
            areas_foco: data.perfil.areas_foco || '',
            tempo_diario_min: data.perfil.tempo_diario_min || 60,
            prazo_estimado: data.perfil.prazo_estimado || 30
          }
          setEstudoForm(loadedStudy)
          savedStudyRef.current = loadedStudy
        }

        if (data.disponibilidade?.length > 0) {
          const loadedDays = diasPadrao.map((dia) => {
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
          setDisponibilidade(loadedDays)
          savedDaysRef.current = loadedDays
        } else {
          savedDaysRef.current = diasPadrao
        }
      } catch (error) {
        console.error('Erro ao carregar perfil de estudo:', error)
      }
    }

    carregarPerfilEstudo()
  }, [])

  const handleChooseImage = (e, mode) => {
    if (avatarActionsRef.current) avatarActionsRef.current.open = false
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Escolha uma imagem JPG, PNG ou WEBP.')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Escolha uma imagem de até 15 MB para ajustar.')
      return
    }
    setImageEditor({ file, mode })
  }

  const handleSaveImage = async (file) => {
    const mode = imageEditor.mode
    const previous = mode === 'avatar' ? avatarPreview : bannerPreview
    if (mode === 'avatar') setUploadingFoto(true)
    else setUploadingBanner(true)

    try {
      const preview = await arquivoComoDataUrl(file)
      if (mode === 'avatar') setAvatarPreview(preview)
      else setBannerPreview(preview)
      const response = mode === 'avatar'
        ? await usuarioService.uploadFotoPerfil(file)
        : await usuarioService.uploadBannerPerfil(file)
      updateUser(response.usuario)
      if (mode === 'avatar') setAvatarPreview(response.usuario.foto_url || null)
      else setBannerPreview(response.usuario.banner_url || null)
      setImageEditor(null)
    } catch (error) {
      if (mode === 'avatar') setAvatarPreview(previous)
      else setBannerPreview(previous)
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erro ao enviar imagem.')
    } finally {
      if (mode === 'avatar') setUploadingFoto(false)
      else setUploadingBanner(false)
    }
  }

  const handleRemoverFoto = async () => {
    if (avatarActionsRef.current) avatarActionsRef.current.open = false
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

  const handleRemoverBanner = async () => {
    if (!window.confirm('Remover o banner do perfil?')) return
    setRemovingBanner(true)
    try {
      const response = await usuarioService.removerBannerPerfil()
      updateUser(response.usuario)
      setBannerPreview(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao remover banner.')
    } finally {
      setRemovingBanner(false)
    }
  }

  useEffect(() => {
    const fecharAcoesImagem = (event) => {
      if (event.type === 'keydown' && event.key === 'Escape' && avatarActionsRef.current) avatarActionsRef.current.open = false
      if (event.type === 'pointerdown' && avatarActionsRef.current && !avatarActionsRef.current.contains(event.target)) avatarActionsRef.current.open = false
      if (event.type === 'keydown' && event.key === 'Escape' && bannerActionsRef.current) bannerActionsRef.current.open = false
      if (event.type === 'pointerdown' && bannerActionsRef.current && !bannerActionsRef.current.contains(event.target)) bannerActionsRef.current.open = false
    }
    document.addEventListener('pointerdown', fecharAcoesImagem)
    document.addEventListener('keydown', fecharAcoesImagem)
    return () => {
      document.removeEventListener('pointerdown', fecharAcoesImagem)
      document.removeEventListener('keydown', fecharAcoesImagem)
    }
  }, [])

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
      savedInfoRef.current = { ...form }
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
    setPasswordSave({ status: 'saving' })

    const erro = validarSenha(senhaForm.novaSenha)

    if (erro) {
      setSenhaErro(erro)
      setPasswordSave({ status: 'error', message: erro })
      return
    }

    if (senhaForm.novaSenha !== senhaForm.confirmarSenha) {
      setSenhaErro('As senhas não coincidem')
      setPasswordSave({ status: 'error', message: 'As senhas não coincidem.' })
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
      setPasswordSave({ status: 'saved', message: 'Senha alterada.' })
    } catch (error) {
      const msg = error.response?.data?.error || 'Erro ao alterar senha'
      setSenhaErro(msg)
      setPasswordSave({ status: 'error', message: msg })
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const toggleDiaEstudo = (index) => {
    setDisponibilidade((dias) =>
      dias.map((dia, i) =>
        i === index
          ? { ...dia, ocupado: dia.ocupado ? 0 : 1, ...(dia.ocupado ? { hora_inicio: horarioPadrao.hora_inicio, hora_fim: horarioPadrao.hora_fim } : {}) }
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
      savedStudyRef.current = { ...estudoForm }
      savedDaysRef.current = disponibilidade.map((dia) => ({ ...dia }))
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

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActiveSection(visible.target.id)
    }, { rootMargin: '-15% 0px -60% 0px' })
    document.querySelectorAll('.profile-section').forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [user])

  if (!user) {
    return (
      <main className="profile-page"><p role="status">Abrindo seu perfil…</p></main>
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

  const horarios = disponibilidade.filter((dia) => !dia.ocupado)
  const frequencias = new Map()
  horarios.forEach((dia) => {
    const key = `${dia.hora_inicio}|${dia.hora_fim}`
    frequencias.set(key, (frequencias.get(key) || 0) + 1)
  })
  const horarioMaisComum = [...frequencias].sort((a, b) => b[1] - a[1])[0]?.[0] || '08:00|18:00'
  const [hora_inicio, hora_fim] = horarioMaisComum.split('|')
  const horarioPadrao = { hora_inicio, hora_fim }
  const diasComExcecao = disponibilidade.filter((dia) => !dia.ocupado && (dia.hora_inicio !== hora_inicio || dia.hora_fim !== hora_fim))
  const infoPendente = Boolean(savedInfoRef.current && JSON.stringify(form) !== JSON.stringify(savedInfoRef.current))
  const estudoPendente = JSON.stringify(estudoForm) !== JSON.stringify(savedStudyRef.current) || JSON.stringify(disponibilidade) !== JSON.stringify(savedDaysRef.current)
  const senhaPendente = Object.values(senhaForm).some(Boolean)
  const algumaAlteracao = infoPendente || estudoPendente || senhaPendente
  const salvando = saving || loadingEstudos

  const alterarHorarioPadrao = (campo, valor) => {
    setDisponibilidade((dias) => dias.map((dia) => !dia.ocupado && dia.hora_inicio === hora_inicio && dia.hora_fim === hora_fim ? { ...dia, [campo]: valor } : dia))
    setStudySave({ status: 'pending', message: 'Horários ainda não salvos.' })
  }

  const salvarAlteracoes = async () => {
    if (infoPendente && infoFormRef.current?.reportValidity()) await handleSaveInfo({ preventDefault() {} })
    if (estudoPendente && studyFormRef.current?.reportValidity()) await handleSaveEstudos({ preventDefault() {} })
    if (senhaPendente && passwordFormRef.current?.reportValidity()) await handleSaveSenha({ preventDefault() {} })
  }

  const descartarAlteracoes = () => {
    if (savedInfoRef.current) setForm({ ...savedInfoRef.current })
    setEstudoForm({ ...savedStudyRef.current })
    setDisponibilidade(savedDaysRef.current.map((dia) => ({ ...dia })))
    setSenhaForm({ senhaAtual: '', novaSenha: '', confirmarSenha: '' })
    setSenhaErro('')
    setInfoSave({ status: 'ready' })
    setStudySave({ status: 'ready' })
    setPasswordSave({ status: 'ready' })
  }

  const irParaSecao = (id) => {
    const secao = document.getElementById(id)
    setActiveSection(id)
    secao?.scrollIntoView({ block: 'start' })
    secao?.querySelector('h2')?.focus({ preventScroll: true })
  }


  return (
    <main className="profile-page">
      <div className="profile-shell">
        <div>
          <header className={`profile-hero${bannerPreview ? ' has-banner' : ''}`} style={bannerPreview ? { backgroundImage: `linear-gradient(90deg, rgb(10 8 20 / .62), rgb(10 8 20 / .30)), url("${getFotoUrl(bannerPreview)}")` } : undefined}>
            <details ref={bannerActionsRef} className="profile-banner-actions">
              <summary aria-label={bannerPreview ? 'Editar banner' : 'Adicionar banner'} title={bannerPreview ? 'Editar banner' : 'Adicionar banner'}>
                {uploadingBanner ? <IconSpinner /> : <IconPencil />}
              </summary>
              <div className="profile-banner-menu">
                <button type="button" onClick={() => { bannerActionsRef.current.open = false; bannerFileRef.current?.click() }} disabled={uploadingBanner || removingBanner}>{bannerPreview ? 'Alterar banner' : 'Adicionar banner'}</button>
                {bannerPreview && <button type="button" onClick={handleRemoverBanner} disabled={uploadingBanner || removingBanner}>{removingBanner ? 'Removendo…' : 'Remover banner'}</button>}
              </div>
              <input ref={bannerFileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => handleChooseImage(event, 'banner')} />
            </details>
            <div className="profile-identity">
              <div className="profile-avatar-block">
                <div className="profile-avatar-wrap"><div className="profile-avatar">
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

                <details ref={avatarActionsRef} className="profile-avatar-actions">
                  <summary aria-label="Editar foto de perfil" title="Editar foto de perfil">
                    {uploadingFoto ? <IconSpinner /> : <IconPencil />}
                  </summary>
                  <div className="profile-avatar-menu">
                    <button type="button" onClick={() => { avatarActionsRef.current.open = false; fileRef.current?.click() }} disabled={uploadingFoto}>Alterar foto</button>
                    {avatarPreview && <button type="button" onClick={handleRemoverFoto} disabled={uploadingFoto || removingFoto}>{removingFoto ? 'Removendo…' : 'Remover foto'}</button>}
                  </div>
                </details>
                </div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  className="profile-file-input"
                  onChange={(event) => handleChooseImage(event, 'avatar')}
                />
              </div>

              <div className="profile-identity-copy">
                <p className="profile-eyebrow">Meu perfil</p>
                <h1><span>{displayName}</span></h1>
                <p className="profile-identity-email">{form.email || user.email}</p>
                <div className="profile-meta">
                  <span>{tipoLabel}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="profile-content-layout">
            <nav className="profile-index" aria-label="Índice do perfil">
              <button type="button" aria-current={activeSection === 'quem-sou' ? 'location' : undefined} onClick={() => irParaSecao('quem-sou')}>Quem sou</button>
              <button type="button" aria-current={activeSection === 'meu-ritmo' ? 'location' : undefined} onClick={() => irParaSecao('meu-ritmo')}>Meu ritmo</button>
              <button type="button" aria-current={activeSection === 'seguranca' ? 'location' : undefined} onClick={() => irParaSecao('seguranca')}>Segurança</button>
            </nav>
            <div className="profile-sections">
            <section id="quem-sou" className="profile-section profile-section-info" aria-labelledby="profile-info-heading">
              <div className="profile-section-head"><h2 id="profile-info-heading" tabIndex={-1}>Quem sou</h2></div>
              <form ref={infoFormRef} onSubmit={(e) => { e.preventDefault(); salvarAlteracoes() }} className="space-y-6" onChange={() => setInfoSave({ status: 'pending', message: 'Informações ainda não salvas.' })}><fieldset disabled={saving} className="min-w-0 space-y-6 border-0 p-0">
                <div className="profile-field-grid">
                  <label className="profile-field">Nome completo<input autoComplete="name" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required /></label>
                  <label className="profile-field">Como quer que a gente chame você?<input value={form.apelido} onChange={(e) => setForm((f) => ({ ...f, apelido: e.target.value }))} placeholder="Nome de preferência (opcional)" /></label>
                </div>

                <details className="profile-treatment"><summary><span className="profile-treatment-label">Tratamento e pronomes</span><span className="profile-treatment-value">{form.pronome==='personalizado' ? form.pronomePersonalizado.trim() || 'Outros pronomes' : ({ela_dela:'Ela / dela',ele_dele:'Ele / dele',elu_delu:'Elu / delu',nome_proprio:'Use meu nome'}[form.pronome] || 'Prefiro não informar')}</span></summary><fieldset className="profile-pronoun-choice"><legend>Pronomes</legend><p className="profile-field-hint">Opcional. Escolha uma preferência de tratamento.</p><div className="profile-pronoun-options">{[['','Prefiro não informar'],['ela_dela','Ela / dela'],['ele_dele','Ele / dele'],['elu_delu','Elu / delu'],['nome_proprio','Use meu nome'],['personalizado','Outros pronomes']].map(([value,label])=><label key={value} className={form.pronome===value?'is-selected':''}><input type="radio" name="pronome" value={value} checked={form.pronome===value} onChange={()=>setForm(f=>({...f,pronome:value}))}/><span>{label}</span></label>)}</div></fieldset>

                {form.pronome === 'personalizado' && <label className="profile-field">Quais pronomes você usa?<input value={form.pronomePersonalizado} onChange={(e) => setForm((f) => ({ ...f, pronomePersonalizado: e.target.value }))} maxLength={80} placeholder="Ex.: they/them, xe/xem ou ela/elu" /><small className="profile-field-hint">Escreva do jeito que prefere.</small></label>}

                <div className="profile-pronoun-preview" aria-live="polite"><span>Como a Lumi vai falar com você</span><p>“{fraseConviteLumi(form.pronome === 'personalizado' ? form.pronomePersonalizado : form.pronome)}”</p><small>{form.pronome === 'personalizado' && form.pronomePersonalizado.trim() ? `Preferência informada: ${form.pronomePersonalizado.trim()}. ` : ''}Sua preferência só muda ao salvar.</small></div></details>

                <label className="profile-field">Email da conta<input autoComplete="email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required /></label>

              </fieldset>{infoSave.status !== 'ready' && <SaveFeedback status={infoSave.status} message={infoSave.message} />}</form>
            </section>

            <section id="meu-ritmo" className="profile-section profile-section-studies" aria-labelledby="profile-studies-heading">
              <div className="profile-section-head"><h2 id="profile-studies-heading" tabIndex={-1}>Meu ritmo</h2></div>

              <form ref={studyFormRef} onSubmit={(e) => { e.preventDefault(); salvarAlteracoes() }} className="space-y-6" onChange={() => setStudySave({ status: 'pending', message: 'Perfil de estudo ainda não salvo.' })}><fieldset disabled={loadingEstudos} className="min-w-0 space-y-6 border-0 p-0">
                <div className="profile-study-sentence">
                  <span className="profile-sentence-copy">Estou no</span>
                  <label className="profile-field"><span className="profile-mobile-label">Ano escolar</span><select aria-label="Ano escolar (opcional)" value={estudoForm.ano_escolar} onChange={(e) => setEstudoForm((f) => ({ ...f, ano_escolar: e.target.value }))}>
                    <option value="">Prefiro informar depois</option>
                    <option value="9º">9º ano</option>
                    <option value="1º EM">1º ano EM</option>
                    <option value="2º EM">2º ano EM</option>
                    <option value="3º EM">3º ano EM</option>
                  </select></label>

                  <span className="profile-sentence-copy">e estudo para</span>
                  <label className="profile-field"><span className="profile-mobile-label">Objetivo</span><select aria-label="Objetivo" value={estudoForm.objetivo} onChange={(e) => setEstudoForm((f) => ({ ...f, objetivo: e.target.value }))} required>
                    <option value="">Objetivo</option>
                    <option value="ENEM">ENEM</option>
                    <option value="VESTIBULAR">Vestibular</option>
                    <option value="OBMEP">OBMEP</option>
                    <option value="CURSO">Curso</option>
                  </select></label>
                  <span className="profile-sentence-copy">. Quero focar em:</span>
                </div>

                <div className="profile-focus-matters"><ChecklistMaterias
                  value={estudoForm.areas_foco}
                  onChange={(novaAreas) => { setEstudoForm((f) => ({ ...f, areas_foco: novaAreas })); setStudySave({ status: 'pending', message: 'Matérias ainda não salvas.' }) }}
                />
                <p className="profile-matter-count" aria-live="polite">{areasFocoParaLista(estudoForm.areas_foco).length} {areasFocoParaLista(estudoForm.areas_foco).length === 1 ? 'matéria selecionada' : 'matérias selecionadas'}</p></div>

                <p className="profile-study-lead">Para caber na minha semana, posso estudar:</p>
                <div className="profile-field-grid">
                  <label className="profile-field">Minutos por dia<input type="number" min="30" max="480" value={estudoForm.tempo_diario_min} onChange={(e) => setEstudoForm((f) => ({ ...f, tempo_diario_min: Number(e.target.value) }))} /></label>

                  <label className="profile-field">Horizonte do planejamento<select value={estudoForm.prazo_estimado} onChange={(e) => setEstudoForm((f) => ({ ...f, prazo_estimado: Number(e.target.value) }))}>
                    <option value={30}>Mensal</option>
                    <option value={90}>Trimestral</option>
                    <option value={180}>Semestral</option>
                    <option value={365}>Anual</option>
                  </select></label>
                </div>

                <div className="profile-availability"><h3>Meus dias de estudo</h3>
                  <div className="profile-days" role="group" aria-label="Dias em que posso estudar">
                    {disponibilidade.map((dia, index) => <button key={dia.dia_semana} type="button" title={dia.label} aria-label={dia.label} aria-pressed={!dia.ocupado} onClick={() => toggleDiaEstudo(index)}>{dia.dia_semana.charAt(0)}</button>)}
                  </div>
                  <div className="profile-standard-time" role="group" aria-label="Horário padrão de estudo">
                    <span>Horário padrão</span>
                    <input aria-label="Início do horário padrão" type="time" value={hora_inicio} onChange={(e) => alterarHorarioPadrao('hora_inicio', e.target.value)} />
                    <span>às</span>
                    <input aria-label="Fim do horário padrão" type="time" value={hora_fim} onChange={(e) => alterarHorarioPadrao('hora_fim', e.target.value)} />
                  </div>
                  <details className="profile-exceptions"><summary>Ajustar horário por dia{diasComExcecao.length ? ` · ${diasComExcecao.length} ${diasComExcecao.length === 1 ? 'exceção' : 'exceções'}` : ''}</summary>
                    {disponibilidade.map((dia, index) => !dia.ocupado && <div key={dia.dia_semana} className="profile-day"><span>{dia.label}</span><div className="profile-day-times">
                      <input aria-label={`Início de ${dia.label}`} type="time" value={dia.hora_inicio} onChange={(e) => { setDisponibilidade((dias) => dias.map((item, i) => i === index ? { ...item, hora_inicio: e.target.value } : item)); setStudySave({ status: 'pending', message: 'Horários ainda não salvos.' }) }} />
                      <span>às</span>
                      <input aria-label={`Fim de ${dia.label}`} type="time" value={dia.hora_fim} onChange={(e) => { setDisponibilidade((dias) => dias.map((item, i) => i === index ? { ...item, hora_fim: e.target.value } : item)); setStudySave({ status: 'pending', message: 'Horários ainda não salvos.' }) }} />
                    </div></div>)}
                  </details>
                </div>

                <div className="profile-study-actions">
                  <button type="button" onClick={handleRegenerarCronograma} disabled={regenerando} className="profile-secondary-button">
                    {regenerando ? 'Gerando...' : 'Regenerar cronograma'}
                  </button>
                </div>
              </fieldset>{studySave.status !== 'ready' && <SaveFeedback status={studySave.status} message={studySave.message} />}</form>
            </section>

            <section id="seguranca" className="profile-section profile-section-security" aria-labelledby="profile-security-heading">
              <div className="profile-section-head"><h2 id="profile-security-heading" tabIndex={-1}>Segurança</h2></div>

              <form ref={passwordFormRef} onSubmit={(e) => { e.preventDefault(); salvarAlteracoes() }} className="profile-security-form">
                <label className="profile-field">Senha atual<input type="password" autoComplete="current-password" value={senhaForm.senhaAtual} onChange={(e) => setSenhaForm((f) => ({ ...f, senhaAtual: e.target.value }))} required /></label>
                <label className="profile-field">Nova senha<input type="password" autoComplete="new-password" aria-describedby="profile-password-rules" value={senhaForm.novaSenha} onChange={(e) => setSenhaForm((f) => ({ ...f, novaSenha: e.target.value }))} required /></label>
                <p id="profile-password-rules" className="profile-password-rules" role="status" aria-live="polite">{senhaForm.novaSenha ? (validarSenha(senhaForm.novaSenha) || 'Senha pronta para usar.') : 'Use pelo menos 8 caracteres, com maiúscula, minúscula e número.'}</p>
                <label className="profile-field">Confirme a nova senha<input type="password" autoComplete="new-password" aria-invalid={Boolean(senhaForm.confirmarSenha && senhaForm.confirmarSenha !== senhaForm.novaSenha)} aria-describedby={senhaForm.confirmarSenha && senhaForm.confirmarSenha !== senhaForm.novaSenha ? 'profile-password-confirmation-error' : undefined} value={senhaForm.confirmarSenha} onChange={(e) => setSenhaForm((f) => ({ ...f, confirmarSenha: e.target.value }))} required /></label>
                {senhaForm.confirmarSenha && senhaForm.confirmarSenha !== senhaForm.novaSenha && <p id="profile-password-confirmation-error" className="pn-erro" role="alert">As senhas precisam ser iguais.</p>}

                {senhaErro && (
                  <div role="alert" className="profile-security-error">
                    {senhaErro}
                  </div>
                )}

                {passwordSave.status !== 'ready' && <SaveFeedback status={passwordSave.status} message={passwordSave.message} />}
              </form>
            </section>

            </div>
          </div>
        </div>
      </div>
      {algumaAlteracao && <div className="profile-savebar" role="region" aria-label="Alterações pendentes"><span role="status" aria-live="polite">Alterações não salvas</span><div><button type="button" onClick={descartarAlteracoes} disabled={salvando} className="profile-secondary-button">Descartar</button><button type="button" onClick={salvarAlteracoes} disabled={salvando} className="profile-primary-button">{salvando ? 'Salvando…' : 'Salvar alterações'}</button></div></div>}
      {imageEditor && <ProfileImageEditor file={imageEditor.file} mode={imageEditor.mode} onCancel={() => setImageEditor(null)} onSave={handleSaveImage} saving={uploadingFoto || uploadingBanner} />}
    </main>
  )
}
