import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import usuarioService from '../services/usuarioService'
import { toast } from 'react-hot-toast'

export default function PainelDono() {
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      try {
        const data = await usuarioService.listar()
        setUsuarios(data)
      } catch (error) {
        toast.error('Erro ao carregar métricas do dono.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  const stats = useMemo(() => {
    return {
      total: usuarios.length,
      ativos: usuarios.filter((u) => Number(u.ativo) === 1).length,
      inativos: usuarios.filter((u) => Number(u.ativo) === 0).length,
      donos: usuarios.filter((u) => u.tipo === 'dono').length,
      admins: usuarios.filter((u) => u.tipo === 'admin').length,
      docentes: usuarios.filter((u) => u.tipo === 'docente').length,
      alunos: usuarios.filter((u) => u.tipo === 'aluno').length
    }
  }, [usuarios])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] flex items-center justify-center">
        <div className="bg-white rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60">Carregando painel...</p>
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
              PlanejAI Owner
            </p>

            <h1 className="text-3xl md:text-5xl font-black text-white mb-2">
              Painel do Dono
            </h1>

            <p className="text-white/85 max-w-2xl">
              Supervisão geral da plataforma, usuários, permissões e métricas principais.
            </p>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <CardStat titulo="Usuários totais" valor={stats.total} />
          <CardStat titulo="Usuários ativos" valor={stats.ativos} />
          <CardStat titulo="Inativos" valor={stats.inativos} />
          <CardStat titulo="Administradores" valor={stats.admins} />
        </section>

        <section className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
            <h2 className="text-2xl font-black text-black mb-4">
              Distribuição de tipos
            </h2>

            <div className="space-y-3">
              <LinhaMetrica label="Dono" valor={stats.donos} total={stats.total} />
              <LinhaMetrica label="Admins" valor={stats.admins} total={stats.total} />
              <LinhaMetrica label="Docentes" valor={stats.docentes} total={stats.total} />
              <LinhaMetrica label="Alunos" valor={stats.alunos} total={stats.total} />
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
            <h2 className="text-2xl font-black text-black mb-4">
              Ações rápidas
            </h2>

            <div className="grid gap-3">
              <button
                onClick={() => navigate('/dono/usuarios')}
                className="w-full bg-[#4B4C9D] text-white rounded-full px-6 py-3 font-bold hover:bg-black transition"
              >
                Gerenciar usuários
              </button>

              <button
                onClick={() => navigate('/usuarios')}
                className="w-full bg-[#F7F7FB] text-black border border-[#9394CF]/40 rounded-full px-6 py-3 font-bold hover:bg-[#9394CF]/20 transition"
              >
                Abrir painel admin
              </button>

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-white text-black border border-[#9394CF]/40 rounded-full px-6 py-3 font-bold hover:bg-[#F7F7FB] transition"
              >
                Voltar ao dashboard
              </button>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
          <h2 className="text-2xl font-black text-black mb-4">
            Últimos usuários cadastrados
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead className="bg-[#9394CF]/20">
                <tr>
                  <Th>Nome</Th>
                  <Th>Email</Th>
                  <Th>Tipo</Th>
                  <Th>Status</Th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#9394CF]/20">
                {usuarios.slice(0, 6).map((usuario) => (
                  <tr key={usuario.id_usuario || usuario.id}>
                    <td className="p-4 font-bold">{usuario.nome}</td>
                    <td className="p-4 text-sm text-black/60 font-mono">{usuario.email}</td>
                    <td className="p-4 capitalize">{usuario.tipo}</td>
                    <td className="p-4">
                      {Number(usuario.ativo) ? 'Ativo' : 'Inativo'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function CardStat({ titulo, valor }) {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-xl border border-[#9394CF]/20">
      <p className="text-sm font-bold text-black/50 mb-1">{titulo}</p>
      <p className="text-3xl font-black text-[#4B4C9D]">{valor}</p>
    </div>
  )
}

function LinhaMetrica({ label, valor, total }) {
  const porcentagem = total ? Math.round((valor / total) * 100) : 0

  return (
    <div>
      <div className="flex justify-between text-sm font-bold mb-1">
        <span>{label}</span>
        <span>{valor} • {porcentagem}%</span>
      </div>

      <div className="h-3 bg-[#F7F7FB] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#4B4C9D] rounded-full"
          style={{ width: `${porcentagem}%` }}
        />
      </div>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="text-left p-4 text-sm font-black text-black border-b border-[#9394CF]/20">
      {children}
    </th>
  )
}
