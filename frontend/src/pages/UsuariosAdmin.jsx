import { useState, useEffect } from 'react'
import usuarioService from '../services/usuarioService'
import { toast } from 'react-hot-toast'

const tipoBadge = {
  dono: 'bg-[#4B4C9D] text-white border-[#4B4C9D]',
  admin: 'bg-[#9394CF]/30 text-black border-[#9394CF]',
  docente: 'bg-white text-black border-[#9394CF]/50',
  aluno: 'bg-[#F7F7FB] text-black border-[#9394CF]/40'
}

const tipoLabel = {
  dono: 'Dono',
  admin: 'Admin',
  docente: 'Docente',
  aluno: 'Aluno'
}

const formatarData = (dataStr) => {
  if (!dataStr) return '-'
  const data = new Date(dataStr)
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const UsuariosAdmin = () => {
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState({ busca: '', tipo: '' })
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ nome: '', email: '', tipo: 'aluno' })

  useEffect(() => {
    carregarUsuarios()
  }, [])

  const carregarUsuarios = async () => {
    setLoading(true)
    try {
      const data = await usuarioService.listar()
      setUsuarios(data)
    } catch (error) {
      toast.error('Erro ao carregar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const handleEditar = (usuario) => {
    setEditingUser(usuario)
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      tipo: usuario.tipo
    })
  }

  const handleSalvarEdicao = async (id) => {
    try {
      await usuarioService.atualizar(id, formData)
      toast.success('Usuario atualizado!')
      carregarUsuarios()
      setEditingUser(null)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao atualizar')
    }
  }

  const handleAlterarTipo = async (id, novoTipo) => {
    try {
      await usuarioService.alterarTipo(id, novoTipo)
      toast.success('Tipo alterado!')
      carregarUsuarios()
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erro ao alterar tipo')
    }
  }

  const handleAtivarDesativar = async (id, ativo) => {
    try {
      await usuarioService.alterarStatus(id, ativo)
      toast.success('Status alterado!')
      carregarUsuarios()
    } catch (error) {
      toast.error('Erro ao alterar status')
    }
  }

  const handleResetSenha = async (id) => {
    if (!confirm('Redefinir senha para este usuario?')) return
    
    try {
      const result = await usuarioService.resetarSenha(id)
      alert(`Senha temporaria gerada: ${result.senha_temporaria}`)
      toast.success('Senha redefinida!')
      carregarUsuarios()
    } catch (error) {
      toast.error('Erro ao resetar senha')
    }
  }

  const usuariosFiltrados = usuarios.filter(u => {
    const matchesBusca = u.nome.toLowerCase().includes(filtro.busca.toLowerCase()) ||
                         u.email.toLowerCase().includes(filtro.busca.toLowerCase())
    const matchesTipo = !filtro.tipo || u.tipo === filtro.tipo
    return matchesBusca && matchesTipo
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D]">
        <div className="bg-white/85 backdrop-blur-md rounded-[3rem] p-12 text-center shadow-2xl border border-white/60">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#4B4C9D] mx-auto mb-4"></div>
          <p className="text-black font-bold">Carregando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black pt-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] pt-16 pb-20 mb-12">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-10 right-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/85 backdrop-blur-md rounded-[3rem] p-10 shadow-2xl border border-white/60">
            <p className="uppercase tracking-[0.35em] text-sm font-black text-[#4B4C9D] mb-4">
              painel administrativo
            </p>

            <h1 className="text-4xl md:text-5xl font-black text-black mb-3 tracking-tight">
              Gerenciar <span className="text-[#4B4C9D]">Usuarios</span>
            </h1>

            <p className="text-lg text-black/65">
              Administre contas de alunos, docentes e administradores
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-black text-black">
              Lista de usuarios
            </h2>
            <p className="text-black/60">
              Busque, edite e altere permissões
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex bg-white rounded-full border border-[#9394CF]/30 shadow-md px-4">
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                className="bg-transparent px-2 py-3 text-black placeholder-black/45 outline-none flex-1"
                value={filtro.busca}
                onChange={(e) => setFiltro({ ...filtro, busca: e.target.value })}
              />
            </div>

            <select
              className="bg-white border border-[#9394CF]/30 rounded-full px-5 py-3 text-black shadow-md focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
              value={filtro.tipo}
              onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="dono">Dono</option>
              <option value="admin">Admin</option>
              <option value="docente">Docente</option>
              <option value="aluno">Aluno</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl border border-[#9394CF]/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#9394CF]/20">
                <tr>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Nome</th>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Email</th>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Tipo</th>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Status</th>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Cadastro</th>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Ultimo Login</th>
                  <th className="text-left p-6 text-black font-black text-sm border-b border-[#9394CF]/20">Acoes</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#9394CF]/20">
                {usuariosFiltrados.map((usuario) => (
                  <tr key={usuario.id} className="hover:bg-[#F7F7FB] transition-colors duration-200">
                    <td className="p-6 font-bold text-black">
                      {editingUser?.id === usuario.id ? (
                        <input
                          type="text"
                          value={formData.nome}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className="w-full rounded-full px-4 py-2 bg-[#F7F7FB] border border-[#9394CF]/40 text-black focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        usuario.nome
                      )}
                    </td>

                    <td className="p-6 text-black/65 font-mono text-sm truncate max-w-xs">
                      {editingUser?.id === usuario.id ? (
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full rounded-full px-4 py-2 bg-[#F7F7FB] border border-[#9394CF]/40 text-black focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                        />
                      ) : (
                        usuario.email
                      )}
                    </td>

                    <td className="p-6">
                      {editingUser?.id === usuario.id ? (
                        <select
                          value={formData.tipo}
                          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                          className="bg-[#F7F7FB] border border-[#9394CF]/40 rounded-full px-4 py-2 text-black text-sm focus:ring-2 focus:ring-[#9394CF] focus:outline-none"
                        >
                          <option value="dono">Dono</option>
                          <option value="admin">Admin</option>
                          <option value="docente">Docente</option>
                          <option value="aluno">Aluno</option>
                        </select>
                      ) : (
                        <select
                          value={usuario.tipo}
                          onChange={(e) => handleAlterarTipo(usuario.id, e.target.value)}
                          className={`px-4 py-2 rounded-full text-sm font-bold border cursor-pointer ${tipoBadge[usuario.tipo] || tipoBadge.aluno}`}
                        >
                          {Object.entries(tipoLabel).map(([key, label]) => (
                            <option key={key} value={key} className="bg-white text-black">{label}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="p-6">
                      <span className={`px-4 py-2 rounded-full text-sm font-bold border ${
                        usuario.ativo 
                          ? 'bg-green-100 text-green-700 border-green-300' 
                          : 'bg-red-100 text-red-700 border-red-300'
                      }`}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>

                    <td className="p-6 text-black/60 text-sm">
                      {formatarData(usuario.data_criacao)}
                    </td>

                    <td className="p-6 text-black/60 text-sm">
                      {formatarData(usuario.ultimo_login)}
                    </td>

                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        {editingUser?.id === usuario.id ? (
                          <>
                            <button
                              onClick={() => handleSalvarEdicao(usuario.id)}
                              className="px-4 py-2 bg-[#4B4C9D] text-white rounded-full text-sm font-bold hover:bg-black shadow-md transition-all duration-200"
                            >
                              Salvar
                            </button>

                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-4 py-2 bg-black text-white rounded-full text-sm font-bold hover:bg-[#4B4C9D] transition-all duration-200"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditar(usuario)}
                              className="p-2 hover:bg-[#9394CF]/20 rounded-full transition-all duration-200"
                              title="Editar"
                            >
                              <svg className="w-5 h-5 text-[#4B4C9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleAtivarDesativar(usuario.id, !usuario.ativo)}
                              className={`p-2 rounded-full transition-all duration-200 ${
                                usuario.ativo 
                                  ? 'hover:bg-red-100 text-red-600' 
                                  : 'hover:bg-green-100 text-green-600'
                              }`}
                              title={usuario.ativo ? 'Desativar' : 'Ativar'}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={usuario.ativo ? "M6 18L18 6M6 6l12 12" : "M5 13l4 4L19 7"} />
                              </svg>
                            </button>

                            <button
                              onClick={() => handleResetSenha(usuario.id)}
                              className="p-2 hover:bg-[#9394CF]/20 text-black hover:text-[#4B4C9D] rounded-full transition-all duration-200"
                              title="Reset Senha"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {usuariosFiltrados.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-[#9394CF]/20 rounded-full mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#4B4C9D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>

              <h3 className="text-2xl font-black text-black mb-2">Nenhum usuario encontrado</h3>
              <p className="text-black/60">Tente ajustar os filtros de busca</p>
            </div>
          )}
        </div>

        <div className="text-sm text-black/60 mt-8 text-center">
          Total: <span className="font-black text-[#4B4C9D]">{usuarios.length}</span> usuarios
        </div>
      </div>
    </div>
  )
}

export default UsuariosAdmin