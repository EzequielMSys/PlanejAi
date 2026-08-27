import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import dashboardService from '../services/dashboardService'
import avisoService from '../services/avisoService'
import PedagogicalInterventions from '../components/PedagogicalInterventions'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

function formatarData(data) {
  if (!data) return '-'
  return new Date(data).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function Card({ titulo, valor, cor }) {
  return (
    <div className="bg-white dark:bg-[#1E1D3A] rounded-[2rem] p-6 shadow-xl border border-[#9394CF]/20">
      <p className="text-sm font-bold text-black/50 dark:text-white/50 mb-1">{titulo}</p>
      <p className="text-3xl font-black" style={{ color: cor || '#4B4C9D' }}>{valor}</p>
    </div>
  )
}

export default function DashboardGestor() {
  const { user, isGestor } = useAuth()
  const [estatisticas, setEstatisticas] = useState(null)
  const [entregas, setEntregas] = useState([])
  const [desempenho, setDesempenho] = useState([])
  const [aprendizagem, setAprendizagem] = useState([])
  const [avisos, setAvisos] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [mostrarFormAviso, setMostrarFormAviso] = useState(false)
  const [novoAviso, setNovoAviso] = useState({ titulo: '', mensagem: '', destinatarios: 'todos' })
  const [enviandoAviso, setEnviandoAviso] = useState(false)

  useEffect(() => {
    if (!isGestor) return
    carregarDados()
  }, [isGestor])

  async function carregarDados() {
    try {
      const [est, ent, des, apr, av] = await Promise.all([
        dashboardService.estatisticas(),
        dashboardService.entregasPendentes(),
        dashboardService.desempenho(),
        dashboardService.aprendizagem(),
        avisoService.listar()
      ])
      setEstatisticas(est)
      setEntregas(Array.isArray(ent) ? ent : [])
      setDesempenho(Array.isArray(des) ? des : [])
      setAprendizagem(Array.isArray(apr) ? apr : [])
      setAvisos(Array.isArray(av) ? av : [])
    } catch {
      toast.error('Erro ao carregar dados do painel.')
    } finally {
      setCarregando(false)
    }
  }

  const stats = useMemo(() => {
    if (!estatisticas) return []
    return [
      { titulo: 'Usuários ativos', valor: estatisticas.totalUsuarios || 0, cor: '#4B4C9D' },
      { titulo: 'Atividades publicadas', valor: estatisticas.totalAtividadesPublicadas || 0, cor: '#6B6FCD' },
      { titulo: 'Entregas realizadas', valor: estatisticas.totalEntregas || 0, cor: '#8A8DDF' },
      { titulo: 'Cronogramas ativos', valor: estatisticas.totalCronogramasAtivos || 0, cor: '#9394CF' }
    ]
  }, [estatisticas])

  async function criarAviso(e) {
    e.preventDefault()
    setEnviandoAviso(true)
    try {
      await avisoService.criar(novoAviso)
      toast.success('Aviso publicado.')
      setNovoAviso({ titulo: '', mensagem: '', destinatarios: 'todos' })
      setMostrarFormAviso(false)
      const av = await avisoService.listar()
      setAvisos(Array.isArray(av) ? av : [])
    } catch {
      toast.error('Erro ao publicar aviso.')
    } finally {
      setEnviandoAviso(false)
    }
  }

  async function removerAviso(id) {
    try {
      await avisoService.deletar(id)
      toast.success('Aviso removido.')
      setAvisos((prev) => prev.filter((a) => a.id_aviso !== id))
    } catch {
      toast.error('Erro ao remover aviso.')
    }
  }

  if (!isGestor) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-black mb-2">Acesso restrito</h1>
          <p className="text-black/60 dark:text-white/60">Esta página é exclusiva para docentes, administradores e dono.</p>
        </div>
      </div>
    )
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] flex items-center justify-center">
        <div className="bg-white dark:bg-[#1E1D3A] rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60 dark:text-white/60">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] text-black dark:text-white px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="workspace-hero bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[2.5rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <p className="text-xs font-black uppercase tracking-[.3em] text-white/70">Painel pedagógico</p>
              <h1 className="mt-2 text-3xl md:text-4xl font-black text-white tracking-tight">Olá, {user?.apelido || user?.nome || 'gestor'}</h1>
              <p className="mt-2 text-white/85 max-w-2xl">Acompanhe entregas, desempenho e movimentação da plataforma em tempo real.</p>
            </div>
          </section>
        </motion.div>

        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((item) => <Card key={item.titulo} {...item} />)}
        </motion.section>
        <PedagogicalInterventions />

        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#1E1D3A] rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
            <h2 className="text-xl font-black mb-4">Entregas pendentes de correção</h2>
            {entregas.length === 0 ? (
              <p className="text-black/60 dark:text-white/60">Nenhuma entrega pendente no momento.</p>
            ) : (
              <div className="space-y-3">
                {entregas.map((e) => (
                  <div key={e.id_resposta} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F7F7FB] dark:bg-white/5 rounded-[2rem] p-4 border border-[#9394CF]/20">
                    <div>
                      <p className="font-black text-sm">{e.atividade_titulo}</p>
                      <p className="text-xs text-black/60 dark:text-white/60">{e.aluno_nome} • {e.aluno_email}</p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs font-bold w-fit">
                      {formatarData(e.respondido_em)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#1E1D3A] rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
            <h2 className="text-xl font-black mb-4">Desempenho geral</h2>
            {desempenho.length === 0 ? (
              <p className="text-black/60 dark:text-white/60">Sem dados de desempenho ainda.</p>
            ) : (
              <div className="space-y-3">
                {desempenho.slice(0, 8).map((u) => (
                  <div key={u.id_usuario} className="flex items-center justify-between bg-[#F7F7FB] dark:bg-white/5 rounded-[2rem] p-4 border border-[#9394CF]/20">
                    <div>
                      <p className="font-black text-sm">{u.nome}</p>
                      <p className="text-xs text-black/60 dark:text-white/60 capitalize">{u.tipo}</p>
                    </div>
                    <span className="text-sm font-black text-[#4B4C9D] dark:text-[#A9AAE8]">
                      {u.media_nota ? `${Number(u.media_nota).toFixed(1)}%` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="rounded-[2.5rem] border border-[#9394CF]/20 bg-white p-6 shadow-xl dark:bg-[#1E1D3A]">
          <div className="mb-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#6D3EC5] dark:text-[#CBB3FF]">Sinais pedagógicos</p><h2 className="text-xl font-black">Quem precisa de uma intervenção</h2></div>
          {aprendizagem.length === 0 ? <p className="text-sm text-black/55 dark:text-white/55">Os indicadores aparecem depois das primeiras práticas.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-black/10 text-xs uppercase tracking-wider text-black/45 dark:border-white/10 dark:text-white/45"><th className="p-3">Aluno</th><th className="p-3">Acerto</th><th className="p-3">Erros</th><th className="p-3">Revisões vencidas</th><th className="p-3">Sinal</th></tr></thead><tbody>{aprendizagem.map((aluno)=>{const risco=Number(aluno.taxa_acerto)<50||Number(aluno.revisoes_atrasadas)>5;return <tr key={aluno.id_usuario} className="border-b border-black/5 dark:border-white/5"><td className="p-3"><b>{aluno.nome}</b><small className="block opacity-55">{aluno.email}</small></td><td className="p-3 font-black">{aluno.taxa_acerto}%</td><td className="p-3">{aluno.erros_pendentes}</td><td className="p-3">{aluno.revisoes_atrasadas}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${risco?'bg-amber-100 text-amber-800':'bg-emerald-100 text-emerald-800'}`}>{risco?'Acompanhar':'No ritmo'}</span></td></tr>})}</tbody></table></div>}
        </motion.section>

        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="bg-white dark:bg-[#1E1D3A] rounded-[2.5rem] p-6 shadow-xl border border-[#9394CF]/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Avisos</h2>
            <button
              type="button"
              onClick={() => setMostrarFormAviso(!mostrarFormAviso)}
              className="rounded-full bg-[#4B4C9D] text-white px-5 py-2 text-sm font-bold hover:bg-black transition"
            >
              {mostrarFormAviso ? 'Cancelar' : 'Novo aviso'}
            </button>
          </div>

          {mostrarFormAviso && (
            <form onSubmit={criarAviso} className="mb-6 space-y-3 rounded-2xl bg-[#F7F7FB] dark:bg-white/5 p-5 border border-[#9394CF]/20">
              <input
                value={novoAviso.titulo}
                onChange={(e) => setNovoAviso({ ...novoAviso, titulo: e.target.value })}
                placeholder="Título do aviso"
                className="w-full rounded-xl border border-[#9394CF]/40 bg-white px-4 py-2 text-sm text-black dark:bg-[#1E1D3A] dark:text-white"
                required
              />
              <textarea
                value={novoAviso.mensagem}
                onChange={(e) => setNovoAviso({ ...novoAviso, mensagem: e.target.value })}
                placeholder="Mensagem"
                className="h-24 w-full rounded-xl border border-[#9394CF]/40 bg-white px-4 py-2 text-sm text-black dark:bg-[#1E1D3A] dark:text-white"
                required
              />
              <select
                value={novoAviso.destinatarios}
                onChange={(e) => setNovoAviso({ ...novoAviso, destinatarios: e.target.value })}
                className="w-full rounded-xl border border-[#9394CF]/40 bg-white px-4 py-2 text-sm text-black dark:bg-[#1E1D3A] dark:text-white"
              >
                <option value="todos">Todos</option>
                <option value="docentes">Docentes</option>
                <option value="alunos">Alunos</option>
              </select>
              <button
                type="submit"
                disabled={enviandoAviso}
                className="rounded-full bg-[#4B4C9D] text-white px-6 py-2 text-sm font-bold hover:bg-black transition disabled:opacity-50"
              >
                {enviandoAviso ? 'Publicando...' : 'Publicar aviso'}
              </button>
            </form>
          )}

          {avisos.length === 0 ? (
            <p className="text-black/60 dark:text-white/60">Nenhum aviso publicado.</p>
          ) : (
            <div className="space-y-3">
              {avisos.map((aviso) => (
                <div key={aviso.id_aviso} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[#F7F7FB] dark:bg-white/5 rounded-[2rem] p-4 border border-[#9394CF]/20">
                  <div>
                    <p className="font-black text-sm">{aviso.titulo}</p>
                    <p className="text-xs text-black/60 dark:text-white/60">{aviso.mensagem}</p>
                    <p className="text-[10px] text-black/40 dark:text-white/40 mt-1">{formatarData(aviso.criado_em)} • {aviso.destinatarios}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removerAviso(aviso.id_aviso)}
                    className="text-xs font-bold text-red-500 hover:text-red-700"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}
