import { useEffect, useMemo, useState } from 'react'
import usuarioService from '../services/usuarioService'
import { useAuth } from '../context/AuthContext'
import { toast } from 'react-hot-toast'

const tipoLabel = {
  dono: 'Dono',
  admin: 'Admin',
  docente: 'Docente',
  aluno: 'Aluno'
}

const tipoBadge = {
  dono: 'bg-black text-white border-black',
  admin: 'bg-[#4B4C9D] text-white border-[#4B4C9D]',
  docente: 'bg-[#9394CF]/25 text-black border-[#9394CF]',
  aluno: 'bg-[#F7F7FB] text-black border-[#9394CF]/40'
}

function getId(usuario) {
  return usuario.id_usuario || usuario.id
}

function formatarData(dataStr) {
  if (!dataStr) return '-'
  return new Date(dataStr).toLocaleDateString('pt-BR')
}

export default function UsuariosAdmin() {
  const { user, isDono } = useAuth()

  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [acaoLoading, setAcaoLoading] = useState(null)

  const [modalSenha, setModalSenha] = useState(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  async function carregarUsuarios() {
    setLoading(true)

    try {
      const data = await usuarioService.listar()
      setUsuarios(Array.isArray(data) ? data : data.usuarios || [])
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((usuario) => {
      const texto = `${usuario.nome || ''} ${usuario.email || ''}`.toLowerCase()
      const buscaOk = texto.includes(busca.toLowerCase())
      const tipoOk = !tipoFiltro || usuario.tipo === tipoFiltro

      return buscaOk && tipoOk
    })
  }, [usuarios, busca, tipoFiltro])

  const stats = useMemo(() => {
    return {
      total: usuarios.length,
      ativos: usuarios.filter((u) => Number(u.ativo) === 1).length,
      alunos: usuarios.filter((u) => u.tipo === 'aluno').length,
      admins: usuarios.filter((u) => u.tipo === 'admin').length
    }
  }, [usuarios])

  function podeMexer(usuario) {
    const usuarioLogadoId = user?.id_usuario || user?.id
    const alvoId = getId(usuario)

    if (usuarioLogadoId === alvoId) return false
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

      alert(`Senha temporária: ${data.senha_temporaria}`)
      await carregarUsuarios()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao resetar senha.')
    } finally {
      setAcaoLoading(null)
    }
  }

  async function definirSenha() {
    if (!modalSenha) return

    if (!novaSenha || !confirmarSenha) {
      toast.error('Preencha todos os campos.')
      return
    }

    if (novaSenha.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.')
      return
    }

    if (novaSenha !== confirmarSenha) {
      toast.error('As senhas não coincidem.')
      return
    }

    try {
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
      toast.error(error.response?.data?.error || 'Erro ao definir senha.')
    } finally {
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
    setModalSenha(null)
    setNovaSenha('')
    setConfirmarSenha('')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black px-4 sm:px-6 lg:px-8 py-10">
      <div className="max-w-7xl mx-auto">
        <section className="workspace-hero bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />

          <div className="relative z-10">
            <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
              PlanejAI
            </p>

            <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
              Painel de Usuários
            </h1>

            <p className="text-white/85">
              Supervisione alunos, docentes, administradores e permissões.
            </p>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CardStat titulo="Total" valor={stats.total} />
          <CardStat titulo="Ativos" valor={stats.ativos} />
          <CardStat titulo="Alunos" valor={stats.alunos} />
          <CardStat titulo="Admins" valor={stats.admins} />
        </section>

        <section className="bg-white rounded-[2.5rem] p-5 sm:p-6 shadow-xl border border-[#9394CF]/20 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-black">
                Gerenciamento
              </h2>

              <p className="text-black/60">
                {isDono
                  ? 'Você possui acesso total de dono.'
                  : 'Você possui acesso administrativo limitado.'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome ou email..."
                className="rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 outline-none focus:ring-2 focus:ring-[#9394CF]"
              />

              <select
                value={tipoFiltro}
                onChange={(e) => setTipoFiltro(e.target.value)}
                className="rounded-full px-5 py-3 bg-[#F7F7FB] border border-[#9394CF]/40 outline-none focus:ring-2 focus:ring-[#9394CF]"
              >
                <option value="">Todos</option>
                <option value="dono">Dono</option>
                <option value="admin">Admin</option>
                <option value="docente">Docente</option>
                <option value="aluno">Aluno</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] shadow-2xl border border-[#9394CF]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-[#9394CF]/20">
                <tr>
                  <Th>Usuário</Th>
                  <Th>Email</Th>
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                  <Th>Cadastro</Th>
                  <Th>Ações</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#9394CF]/20">
                {usuariosFiltrados.map((usuario) => {
                  const id = getId(usuario)
                  const podeAlterar = podeMexer(usuario)

                  return (
                    <tr key={id} className="hover:bg-[#F7F7FB] transition-colors">
                      <td className="p-5">
                        <div className="font-black text-black">
                          {usuario.nome || 'Sem nome'}
                        </div>

                        <div className="text-xs text-black/50">
                          ID #{id}
                        </div>
                      </td>

                      <td className="p-5 text-sm text-black/65 font-mono">
                        {usuario.email}
                      </td>

                      <td className="p-5">
                        {isDono && podeAlterar ? (
                          <select
                            value={usuario.tipo}
                            disabled={acaoLoading === `tipo-${id}`}
                            onChange={(e) => alterarTipo(usuario, e.target.value)}
                            className={`px-4 py-2 rounded-full text-sm font-bold border outline-none ${tipoBadge[usuario.tipo] || tipoBadge.aluno}`}
                          >
                            <option value="admin">Admin</option>
                            <option value="docente">Docente</option>
                            <option value="aluno">Aluno</option>
                          </select>
                        ) : (
                          <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border ${tipoBadge[usuario.tipo] || tipoBadge.aluno}`}>
                            {tipoLabel[usuario.tipo] || usuario.tipo}
                          </span>
                        )}
                      </td>

                      <td className="p-5">
                        <span
                          className={`inline-flex px-4 py-2 rounded-full text-sm font-bold border ${
                            Number(usuario.ativo)
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }`}
                        >
                          {Number(usuario.ativo) ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>

                      <td className="p-5 text-sm text-black/60">
                        {formatarData(usuario.data_criacao || usuario.criado_em)}
                      </td>

                      <td className="p-5">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={!isDono || !podeAlterar || acaoLoading === `status-${id}`}
                            onClick={() => alterarStatus(usuario)}
                            className="px-4 py-2 rounded-full bg-[#F7F7FB] border border-[#9394CF]/40 text-sm font-bold disabled:opacity-40 hover:bg-[#9394CF]/20 transition"
                          >
                            {Number(usuario.ativo) ? 'Desativar' : 'Ativar'}
                          </button>

                          <button
                            type="button"
                            disabled={!podeAlterar || acaoLoading === `senha-${id}`}
                            onClick={() => resetarSenha(usuario)}
                            className="px-4 py-2 rounded-full bg-[#4B4C9D] text-white text-sm font-bold disabled:opacity-40 hover:bg-black transition"
                          >
                            Resetar senha
                          </button>

                          <button
                            type="button"
                            disabled={!isDono || !podeAlterar}
                            onClick={() => abrirModalSenha(usuario)}
                            className="px-4 py-2 rounded-full bg-black text-white text-sm font-bold disabled:opacity-40 hover:bg-[#4B4C9D] transition"
                          >
                            Definir senha
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {usuariosFiltrados.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-2xl font-black text-black mb-2">
                Nenhum usuário encontrado
              </h3>

              <p className="text-black/60">
                Tente ajustar a busca ou o filtro.
              </p>
            </div>
          )}
        </section>
      </div>

      {modalSenha && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-[#9394CF]/20 p-8">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.3em] text-[#4B4C9D] font-black mb-2">
                PlanejAI
              </p>

              <h2 className="text-3xl font-black text-black mb-2">
                Definir senha
              </h2>

              <p className="text-black/60">
                Defina uma nova senha para:
              </p>

              <p className="font-black text-[#4B4C9D] mt-2">
                {modalSenha.nome || modalSenha.email}
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                placeholder="Nova senha"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                className="w-full rounded-2xl px-5 py-4 bg-[#F7F7FB] border border-[#9394CF]/30 outline-none focus:ring-2 focus:ring-[#9394CF]"
              />

              <input
                type="password"
                placeholder="Confirmar senha"
                value={confirmarSenha}
                onChange={(e) => setConfirmarSenha(e.target.value)}
                className="w-full rounded-2xl px-5 py-4 bg-[#F7F7FB] border border-[#9394CF]/30 outline-none focus:ring-2 focus:ring-[#9394CF]"
              />
            </div>

            <p className="text-xs text-black/50 mt-3">
              A senha será salva criptografada no banco. A senha anterior não pode ser visualizada.
            </p>

            <div className="flex gap-3 mt-8">
              <button
                type="button"
                onClick={fecharModalSenha}
                className="flex-1 py-3 rounded-full bg-[#F7F7FB] border border-[#9394CF]/30 font-bold hover:bg-[#9394CF]/10 transition"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={salvandoSenha}
                onClick={definirSenha}
                className="flex-1 py-3 rounded-full bg-[#4B4C9D] text-white font-black hover:bg-black transition disabled:opacity-60"
              >
                {salvandoSenha ? 'Salvando...' : 'Salvar senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function CardStat({ titulo, valor }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-[#9394CF]/20">
      <p className="text-sm font-bold text-black/50 mb-1">
        {titulo}
      </p>

      <p className="text-3xl font-black text-[#4B4C9D]">
        {valor}
      </p>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="text-left p-5 text-sm font-black text-black border-b border-[#9394CF]/20">
      {children}
    </th>
  )
}
