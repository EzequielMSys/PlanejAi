import { useCallback, useEffect, useRef, useState } from 'react'
import useDialogFocus from '../hooks/useDialogFocus'
import usuarioService from '../services/usuarioService'
import AccountUsagePanel from '../components/AccountUsagePanel'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'
import './UsuariosAdmin.css'

const tipoLabel = {
  dono: 'Dono',
  admin: 'Admin',
  docente: 'Docente',
  aluno: 'Aluno'
}



const USUARIOS_POR_PAGINA = 10

function getId(usuario) {
  return usuario.id_usuario || usuario.id
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(dataStr)?dataStr+'T12:00:00':dataStr).toLocaleDateString('pt-BR')
}

export default function UsuariosAdmin() {
  const { user, isDono } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [loaded,setLoaded]=useState(false)
  const [listError,setListError]=useState('')
  const listRequest=useRef(0)
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [statusFiltro, setStatusFiltro] = useState('')
  const [usageFilter, setUsageFilter] = useState('')
  const [managingId,setManagingId]=useState(null)
  const manageButton = useRef(null)
  const managePanel = useRef(null)
  const [usageAccount, setUsageAccount] = useState(null)
  const usageButton = useRef(null)
  const directory = useRef(null)
  const [paginaAtual, setPaginaAtual] = useState(1)
  useEffect(()=>{
    setManagingId(null)
    setUsageAccount(null)
  },[busca,tipoFiltro,statusFiltro,usageFilter,paginaAtual])
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [totalRegistros, setTotalRegistros] = useState(0)
  const [stats, setStats] = useState({ total: 0, ativos: 0, alunos: 0, admins: 0 })
  const [acaoLoading, setAcaoLoading] = useState(null)

  const [modalSenha, setModalSenha] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)
  const [senhaTemporaria, setSenhaTemporaria] = useState(null)
  const [senhaErro,setSenhaErro]=useState('')
  const dialogRef=useRef(null),savingPassword=useRef(false)
  useDialogFocus(dialogRef,Boolean(modalSenha||senhaTemporaria),()=>modalSenha?fecharModalSenha():setSenhaTemporaria(null),salvandoSenha)

  const carregarUsuarios = useCallback(async () => {
    const request=++listRequest.current
    setListError('')
    setLoading(true)

    try {
      const data = await usuarioService.listar({
        page: paginaAtual,
        limit: USUARIOS_POR_PAGINA,
        search: busca,
        tipo: tipoFiltro,
        status: statusFiltro,
        acompanhamento: usageFilter
      })
      if(request!==listRequest.current)return
      setLoaded(true)
      setUsuarios(data.usuarios || [])
      setTotalPaginas(data.total_paginas || 1)
      setTotalRegistros(data.total_registros || 0)
      setStats(data.stats || { total: 0, ativos: 0, alunos: 0, admins: 0 })
    } catch (error) {
      if(request===listRequest.current){const message=error.response?.data?.error || 'Não foi possível carregar as pessoas.';setListError(message);toast.error(message)}
    } finally {
      if(request===listRequest.current)setLoading(false)
    }
  }, [paginaAtual, busca, tipoFiltro, statusFiltro, usageFilter])

  useDialogFocus(managePanel, Boolean(managingId), () => setManagingId(null))
  const managedUser = usuarios.find(item => getId(item) === managingId)

  useEffect(() => {
    const timer = setTimeout(carregarUsuarios, 250)
    return () => window.clearTimeout(timer)
  }, [carregarUsuarios])

  useEffect(() => {
    setPaginaAtual((pagina) => Math.min(pagina, totalPaginas))
  }, [totalPaginas])

  function atualizarBusca(valor) {
    setBusca(valor)
    setPaginaAtual(1)
  }

  function atualizarTipoFiltro(valor) {
    setTipoFiltro(valor)
    setPaginaAtual(1)
  }

  function podeMexer(usuario) {
    const usuarioLogadoId = user?.id_usuario || user?.id
    const alvoId = getId(usuario)

    if (String(usuarioLogadoId) === String(alvoId)) return false
    if (usuario.tipo === 'dono') return false

    return true
  }

  async function alterarTipo(usuario, novoTipo) {
    if (!isDono) {
      toast.error('Apenas o dono pode alterar tipos de usuário.')
      return
    }

    if (!podeMexer(usuario)) {
      toast.error('Você não pode alterar este usuário.')
      return
    }

    const id = getId(usuario)
    setAcaoLoading(`tipo-${id}`)

    try {
      await usuarioService.alterarTipo(id, novoTipo)
      await carregarUsuarios()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar tipo.')
    } finally {
      setAcaoLoading(null)
    }
  }

  async function alterarStatus(usuario) {
    if (!isDono) {
      toast.error('Apenas o dono pode ativar ou desativar usuários.')
      return
    }

    if (!podeMexer(usuario)) {
      toast.error('Você não pode alterar este usuário.')
      return
    }

    const id = getId(usuario)
    if (!window.confirm(`${Number(usuario.ativo) ? 'Desativar' : 'Ativar'} a conta de ${usuario.nome || usuario.email}?`)) return
    setAcaoLoading(`status-${id}`)

    try {
      await usuarioService.alterarStatus(id, !Number(usuario.ativo))
      await carregarUsuarios()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar status.')
    } finally {
      setAcaoLoading(null)
    }
  }

  async function resetarSenha(usuario) {
    if (!podeMexer(usuario)) {
      toast.error('Você não pode resetar a senha deste usuário.')
      return
    }

    const confirmar = confirm(`Resetar senha de ${usuario.nome}?`)
    if (!confirmar) return

    const id = getId(usuario)
    setAcaoLoading(`senha-${id}`)

    try {
      const data = await usuarioService.resetarSenha(id)

      setSenhaTemporaria({ nome: usuario.nome || usuario.email, senha: data.senha_temporaria })
      await carregarUsuarios()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao resetar senha.')
    } finally {
      setAcaoLoading(null)
    }
  }

  async function definirSenha() {
    if (!modalSenha || savingPassword.current) return

    if (!novaSenha || !confirmarSenha) {
      setSenhaErro('Preencha a nova senha e a confirmação.')
      return
    }

    if (novaSenha.length < 8) {
      setSenhaErro('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      setSenhaErro('As senhas precisam ser iguais.')
      return
    }

    try {
      savingPassword.current=true
      setSenhaErro('')
      setSalvandoSenha(true)

      await usuarioService.definirSenha(
        getId(modalSenha),
        novaSenha,
        confirmarSenha
      )

      setModalSenha(null)
      setNovaSenha('')
      setConfirmarSenha('')

      await carregarUsuarios()
    } catch (error) {
      setSenhaErro(error.response?.data?.error || 'Não foi possível confirmar a alteração. Confira antes de tentar novamente.')
    } finally {
      savingPassword.current=false
      setSalvandoSenha(false)
    }
  }

  function abrirModalSenha(usuario) {
    if (!isDono) {
      toast.error('Apenas o dono pode definir senhas.')
      return
    }

    if (!podeMexer(usuario)) {
      toast.error('Você não pode definir senha para este usuário.')
      return
    }

    setModalSenha(usuario)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  function fecharModalSenha() {
    if(savingPassword.current)return
    setSenhaErro('')
    setModalSenha(null)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  if (loading && !loaded) {
    return (
      <div className="min-h-screen bg-[rgb(var(--pn-superficie-alt-rgb)/1)] flex items-center justify-center">
        <div className="bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[3rem] p-10 shadow-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] text-center">
          <div className="h-14 w-14 border-b-4 border-[rgb(var(--pn-primaria-borda-rgb)/1)] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[rgb(var(--pn-texto-rgb)/0.6)]">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="users-admin-page min-h-screen bg-[rgb(var(--pn-superficie-alt-rgb)/1)] text-[rgb(var(--pn-texto-rgb)/1)] px-4 sm:px-6 lg:px-8 py-10">
      {usageAccount && (isDono || usuarios.some(item => getId(item) === usageAccount.id && item.tipo === 'aluno')) &&
        <AccountUsagePanel key={usageAccount.id} {...usageAccount} onClose={() => {
          setUsageAccount(null)
          if (directory.current) directory.current.hidden = false
          usageButton.current?.focus()
        }}/>
      }
      <div ref={directory} hidden={Boolean(usageAccount && (isDono || usuarios.some(item => getId(item) === usageAccount.id && item.tipo === 'aluno')))} className="max-w-7xl mx-auto">
        <header className="users-hero"><div><span className="users-kicker">PLANEJAI / GESTÃO DE ACESSOS</span><h1>Pessoas e acessos</h1><p>Gerencie contas, permissões e atividades em um só lugar.</p></div><details className="users-permissions"><summary>Sobre as permissões</summary><p>{isDono?'Só o dono pode alterar perfis e ativar ou desativar contas.':'As ações disponíveis respeitam as permissões da sua conta.'}</p></details></header>

        {loaded && <section className="users-overview" aria-label="Resumo das contas"><h2>Resumo das contas</h2><div className="users-stats">
          <CardStat titulo="Total de contas" valor={stats.total} />
          <CardStat titulo="Contas ativas" valor={stats.ativos} />
          <CardStat titulo="Contas inativas" valor={stats.inativos} />
        </div></section>}

        <section className="users-toolbar bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2.5rem] p-5 sm:p-6 shadow-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[rgb(var(--pn-texto-rgb)/1)]">
                Diretório de pessoas
              </h2>

              <p className="text-[rgb(var(--pn-texto-rgb)/0.6)]">
                {isDono
                  ? 'Consulte contas e gerencie acessos conforme a necessidade.'
                  : 'Consulte contas e use apenas as ações disponíveis ao seu perfil.'}
              </p>
            </div>

            <div className="users-filter-grid">
              <label className="users-filter-label">Nome ou email<input
                type="search"
                value={busca}
                onChange={(e) => atualizarBusca(e.target.value)}
                placeholder="Buscar por nome ou email..."
                aria-label="Buscar usuário por nome ou email"
                className="rounded-full px-5 py-3 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] outline-none focus:ring-2 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/1)]"
              /></label>

              <label className="users-filter-label">Perfil da conta<select
                value={tipoFiltro}
                onChange={(e) => atualizarTipoFiltro(e.target.value)}
                aria-label="Filtrar usuários por tipo"
                className="rounded-full px-5 py-3 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] outline-none focus:ring-2 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/1)]"
              >
                <option value="">Todos</option>
                <option value="dono">Dono</option>
                <option value="admin">Admin</option>
                <option value="docente">Docente</option>
                <option value="aluno">Aluno</option>
              </select></label>
              <label className="users-filter-label">Status da conta<select value={statusFiltro} onChange={event => {setStatusFiltro(event.target.value);setPaginaAtual(1)}}><option value="">Todas</option><option value="ativo">Ativas</option><option value="inativo">Inativas</option></select></label>
              <label className="users-filter-label">Acompanhamento<select value={usageFilter} onChange={event => { setUsageFilter(event.target.value); setPaginaAtual(1) }}><option value="">Todas as contas</option><option value="atrasadas">Com atividades atrasadas</option><option value="sem-uso">Sem uso registrado nos últimos 7 dias</option></select></label>
            </div>
          </div>
        </section>

        {usageFilter === 'sem-uso' && <p>Inclui contas ativas com cobertura de medição durante todo o período.</p>}
        {(busca || tipoFiltro || statusFiltro || usageFilter) && <div className="users-filter-summary"><span>{totalRegistros} resultado(s) encontrado(s)</span><button type="button" onClick={()=>{atualizarBusca('');atualizarTipoFiltro('');setStatusFiltro('');setUsageFilter('')}}>Limpar filtros</button></div>}
        {listError&&<p className="users-list-error" role="alert">{listError} <button type="button" onClick={carregarUsuarios}>Tentar novamente</button></p>}
        {loaded&&loading&&<p className="users-updating" role="status">Atualizando pessoas…</p>}
        <section className="users-table-shell bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2.5rem] shadow-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="users-directory" aria-busy={loading}>
              <thead className="bg-[rgb(var(--pn-primaria-forte-rgb)/0.2)]">
                <tr>
                  <Th>Usuário</Th>
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                  <Th>Cadastro</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#9394CF]/20">
                {usuarios.map((usuario) => {
                  const id = getId(usuario)
                  const podeAlterar = podeMexer(usuario)

                  return (
                    <tr key={id} className="hover:bg-[rgb(var(--pn-superficie-alt-rgb)/1)] transition-colors">
                      <td className="p-5" data-label="Pessoa">
                        <div className="users-person"><span aria-hidden="true">{(usuario.nome || usuario.email || '?').charAt(0).toUpperCase()}</span><div><strong>{usuario.nome || 'Sem nome'}</strong><span className="users-email">{usuario.email}</span><small>ID #{id}</small></div></div>
                      </td>

                      <td className="p-5" data-label="Perfil">
                        <span className="users-role">{tipoLabel[usuario.tipo] || usuario.tipo}</span>
                      </td>

                      <td className="p-5" data-label="Status">
                        <span className={`users-status ${Number(usuario.ativo)?'is-active':'is-inactive'}`}><i aria-hidden="true"/>{Number(usuario.ativo)?'Ativo':'Inativo'}</span>
                      </td>

                      <td className="p-5 text-sm text-[rgb(var(--pn-texto-rgb)/0.6)]" data-label="Cadastro">
                        {formatarData(usuario.data_cadastro || usuario.data_criacao || usuario.criado_em)}
                      </td>

                      <td className="p-5" data-label="Ações">
                        <button type="button" className="users-action-trigger" aria-label={`Gerenciar conta de ${usuario.nome || usuario.email}`} aria-haspopup="dialog" onClick={event => { manageButton.current = event.currentTarget; setManagingId(id) }}>•••</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {usuarios.length === 0 && !listError && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-black text-[rgb(var(--pn-texto-rgb)/1)] mb-2">
                Nenhum usuário encontrado
              </h3>

              <p className="text-[rgb(var(--pn-texto-rgb)/0.6)]">
                Tente ajustar a busca ou o filtro.
              </p>
            </div>
          )}

          {usuarios.length > 0 && (
            <nav
              aria-label="Paginação de usuários"
              className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] px-5 py-5"
            >
              <p className="text-sm text-[rgb(var(--pn-texto-rgb)/0.6)]">
                Mostrando{' '}
                <strong className="text-[rgb(var(--pn-texto-rgb)/1)]">
                  {(paginaAtual - 1) * USUARIOS_POR_PAGINA + 1}
                </strong>{' '}
                a{' '}
                <strong className="text-[rgb(var(--pn-texto-rgb)/1)]">
                  {Math.min(
                    paginaAtual * USUARIOS_POR_PAGINA,
                    totalRegistros
                  )}
                </strong>{' '}
                de <strong className="text-[rgb(var(--pn-texto-rgb)/1)]">{totalRegistros}</strong>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  disabled={paginaAtual === 1}
                  onClick={() => setPaginaAtual((pagina) => pagina - 1)}
                  className="pn-tool px-4 py-2 rounded-full border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] font-bold text-sm hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.15)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Anterior
                </button>

                {Array.from({ length: totalPaginas }, (_, indice) => indice + 1).map((pagina) => (
                  <button
                    key={pagina}
                    type="button"
                    aria-current={pagina === paginaAtual ? 'page' : undefined}
                    aria-label={`Ir para página ${pagina}`}
                    onClick={() => setPaginaAtual(pagina)}
                    className={`h-10 min-w-10 px-3 rounded-full font-black text-sm transition ${
                      pagina === paginaAtual
                        ? 'bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white shadow-lg'
                        : 'bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.3)] text-[rgb(var(--pn-texto-rgb)/1)] hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.2)]'
                    }`}
                  >
                    {pagina}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPaginaAtual((pagina) => pagina + 1)}
                  className="pn-tool px-4 py-2 rounded-full border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] font-bold text-sm hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.15)] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Próxima
                </button>
              </div>
            </nav>
          )}
        </section>
      </div>

      {managedUser && <div className="users-drawer-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) {setManagingId(null);manageButton.current?.focus()} }}>
        <aside ref={managePanel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="users-drawer-title" className="users-drawer">
          <header><div><span className="users-kicker">GERENCIAMENTO DE CONTA</span><h2 id="users-drawer-title">{managedUser.nome || 'Sem nome'}</h2><p>{managedUser.email}</p></div><button type="button" onClick={() => {setManagingId(null);manageButton.current?.focus()}} aria-label="Fechar gerenciamento">×</button></header>
          <dl className="users-drawer-meta"><div><dt>Perfil</dt><dd>{tipoLabel[managedUser.tipo] || managedUser.tipo}</dd></div><div><dt>Status</dt><dd>{Number(managedUser.ativo) ? 'Ativo' : 'Inativo'}</dd></div><div><dt>Identificador</dt><dd>#{getId(managedUser)}</dd></div></dl>
          {isDono && podeMexer(managedUser) && <section><h3>Perfil de acesso</h3><label className="users-role-field">Perfil da conta<select value={managedUser.tipo} disabled={Boolean(acaoLoading)} onChange={event => alterarTipo(managedUser, event.target.value)} className="users-role-select"><option value="admin">Admin</option><option value="docente">Docente</option><option value="aluno">Aluno</option></select></label></section>}
          {isDono && podeMexer(managedUser) && <section><h3>Status da conta</h3><button type="button" disabled={Boolean(acaoLoading)} onClick={() => alterarStatus(managedUser)}>{Number(managedUser.ativo) ? 'Desativar conta' : 'Ativar conta'}</button></section>}
          {podeMexer(managedUser) && <section><h3>Credenciais</h3><p>Uma senha temporária é exibida apenas após a redefinição. Compartilhe-a por um canal seguro.</p><button type="button" disabled={Boolean(acaoLoading)} onClick={() => resetarSenha(managedUser)}>Redefinir senha temporária</button>{isDono && <button type="button" onClick={() => abrirModalSenha(managedUser)}>Definir senha</button>}</section>}
          {(isDono || managedUser.tipo === 'aluno') && <section><h3>Acompanhamento</h3><button type="button" onClick={() => {usageButton.current = manageButton.current;setManagingId(null);setUsageAccount({id:getId(managedUser),name:managedUser.nome || managedUser.email})}}>Ver acompanhamento</button></section>}
        </aside>
      </div>}

      {modalSenha && (
        <div className="users-password-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="users-password-title" className="users-password-dialog w-full max-w-md bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2.5rem] shadow-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[rgb(var(--pn-primaria-rgb)/1)] font-black mb-2">
                PlanejAI
              </p>

              <h2 id="users-password-title" className="text-3xl font-black text-[rgb(var(--pn-texto-rgb)/1)] mb-2">
                Definir senha
              </h2>

              <p className="text-[rgb(var(--pn-texto-rgb)/0.6)]">
                Defina uma nova senha para:
              </p>

              <p className="font-black text-[rgb(var(--pn-primaria-rgb)/1)] mt-2">
                {modalSenha.nome || modalSenha.email}
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Nova senha"
                aria-label="Nova senha"
                autoComplete="new-password"
                disabled={salvandoSenha}
                value={novaSenha}
                onChange={(e) => {setNovaSenha(e.target.value);setSenhaErro('')}}
                className="w-full rounded-2xl px-5 py-4 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.3)] outline-none focus:ring-2 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/1)]"
              />

              <input
                type="password"
                placeholder="Confirmar senha"
                aria-label="Confirmar nova senha"
                autoComplete="new-password"
                disabled={salvandoSenha}
                aria-invalid={Boolean(senhaErro)}
                aria-describedby={senhaErro?'users-password-error':undefined}
                value={confirmarSenha}
                onChange={(e) => {setConfirmarSenha(e.target.value);setSenhaErro('')}}
                className="w-full rounded-2xl px-5 py-4 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.3)] outline-none focus:ring-2 focus:ring-[rgb(var(--pn-primaria-borda-rgb)/1)]"
              />
            </div>

            {senhaErro&&<p id="users-password-error" role="alert" className="users-password-error">{senhaErro}</p>}

            <p className="text-xs text-[rgb(var(--pn-texto-rgb)/0.5)] mt-3">
              A senha será salva criptografada no banco. A senha anterior não pode ser visualizada.
            </p>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={fecharModalSenha}
                disabled={salvandoSenha}
                className="flex-1 py-3 rounded-full bg-[rgb(var(--pn-superficie-alt-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.3)] font-bold hover:bg-[rgb(var(--pn-primaria-forte-rgb)/0.1)] transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={salvandoSenha}
                onClick={definirSenha}
                className="pn-command flex-1 py-3 rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white font-black hover:bg-black transition disabled:opacity-60"
              >
                {salvandoSenha ? 'Salvando...' : 'Salvar senha'}
              </button>
            </div>
          </div>
        </div>
      )}
      {senhaTemporaria && <div className="users-secret-backdrop" role="presentation"><section ref={dialogRef} tabIndex={-1} className="users-secret-dialog" role="dialog" aria-modal="true" aria-labelledby="users-secret-title"><span className="users-kicker">ACESSO TEMPORÁRIO</span><h2 id="users-secret-title">Senha redefinida</h2><p>Compartilhe esta senha com {senhaTemporaria.nome} por um canal seguro. Ela será mostrada apenas enquanto este aviso estiver aberto.</p><code>{senhaTemporaria.senha}</code><button type="button" onClick={() => setSenhaTemporaria(null)}>Concluir</button></section></div>}
    </main>
  )
}

function CardStat({ titulo, valor }) {
  return (
    <div className="users-stat bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2rem] p-6 shadow-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
      <p className="text-sm font-bold text-[rgb(var(--pn-texto-rgb)/0.5)] mb-1">
        {titulo}
      </p>

      <p className="text-3xl font-black text-[rgb(var(--pn-primaria-rgb)/1)]">
        {valor}
      </p>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="text-left p-5 text-sm font-black text-[rgb(var(--pn-texto-rgb)/1)] border-b border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
      {children}
    </th>
  )
}
