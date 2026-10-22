import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import dashboardService from '../services/dashboardService'
import avisoService from '../services/avisoService'
import PedagogicalInterventions from '../components/PedagogicalInterventions'
import './DashboardGestor.css'

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

function Card({ titulo, valor, cor, legenda }) {
  return (
    <article className="pedagogy-stat"><span>{titulo}</span><strong style={{ color: cor || 'var(--pn-primaria)' }}>{valor}</strong><small>{legenda}</small></article>
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
      const [est, ent, des, apr, av] = await Promise.allSettled([
        dashboardService.estatisticas(),
        dashboardService.entregasPendentes(),
        dashboardService.desempenho(),
        dashboardService.aprendizagem(),
        avisoService.listar()
      ])
      if (est.status === 'fulfilled') setEstatisticas(est.value)
      setEntregas(ent.status === 'fulfilled' && Array.isArray(ent.value) ? ent.value : [])
      setDesempenho(des.status === 'fulfilled' && Array.isArray(des.value) ? des.value : [])
      setAprendizagem(apr.status === 'fulfilled' && Array.isArray(apr.value) ? apr.value : [])
      setAvisos(av.status === 'fulfilled' && Array.isArray(av.value) ? av.value : [])
      if ([est, ent, des, apr, av].some(item => item.status === 'rejected')) toast.error('Parte dos indicadores não pôde ser carregada.')
    } catch {
      toast.error('Erro ao carregar dados do painel.')
    } finally {
      setCarregando(false)
    }
  }

  const stats = useMemo(() => {
    if (!estatisticas) return []
    return [
      { titulo: 'Pessoas na plataforma', valor: estatisticas.totalUsuarios || 0, legenda: 'contas acompanhadas' },
      { titulo: 'Atividades publicadas', valor: estatisticas.totalAtividadesPublicadas || 0, legenda: 'propostas de estudo' },
      { titulo: 'Entregas realizadas', valor: estatisticas.totalEntregas || 0, legenda: 'respostas recebidas' },
      { titulo: 'Cronogramas ativos', valor: estatisticas.totalCronogramasAtivos || 0, legenda: 'planos em andamento' }
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
      <div className="min-h-screen bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] flex items-center justify-center text-center px-4">
        <div>
          <h1 className="text-2xl font-black mb-2">Acesso restrito</h1>
          <p className="text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">Esta página é exclusiva para docentes, administradores e dono.</p>
        </div>
      </div>
    )
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] flex items-center justify-center">
        <div className="bg-[rgb(var(--pn-superficie-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[3rem] p-10 shadow-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] text-center">
          <div className="h-14 w-14 border-b-4 border-[rgb(var(--pn-primaria-borda-rgb)/1)] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">Carregando painel...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="pedagogy-page">
      <div className="pedagogy-shell space-y-8">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="pedagogy-hero" aria-labelledby="pedagogy-title">
            <div><span>PLANEJAI · VISÃO PEDAGÓGICA</span><h1 id="pedagogy-title">Cada estudante merece um próximo passo.</h1><p>Olá, {user?.apelido || user?.nome || 'gestor'}. Veja quem precisa de atenção, acompanhe evidências e organize intervenções com clareza.</p><div className="pedagogy-hero-actions"><a href="#pedagogy-priorities">Ver prioridades <b aria-hidden="true">↓</b></a><Link to="/turmas">Gerenciar turmas <b aria-hidden="true">↗</b></Link></div></div>
            <div className="pedagogy-hero-note" aria-hidden="true"><span>ACOMPANHAR É AGIR</span><strong>Observe.<br />Converse.<br /><em>Oriente.</em></strong></div>
          </section>
        </motion.div>

        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="pedagogy-stats" aria-label="Indicadores gerais">
          {stats.map((item) => <Card key={item.titulo} {...item} />)}
        </motion.section>
        <nav className="pedagogy-jumps" aria-label="Navegar pela visão pedagógica"><a href="#pedagogy-priorities">01 · Prioridades</a><a href="#pedagogy-evidence">02 · Evidências</a><a href="#pedagogy-notices">03 · Avisos</a></nav>
        <section id="pedagogy-priorities" className="pedagogy-section"><header><span>ATENÇÃO AGORA</span><h2>Por onde começar hoje</h2><p>Alertas mostram sinais para investigar. Use as informações como ponto de partida para conversar com o estudante.</p></header><PedagogicalInterventions /></section>

        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="pedagogy-deliveries grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[rgb(var(--pn-superficie-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2.5rem] p-6 shadow-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
            <h2 className="text-xl font-black mb-4">Entregas pendentes de correção</h2>
            {entregas.length === 0 ? (
              <p className="text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">Nenhuma entrega pendente no momento.</p>
            ) : (
              <div className="space-y-3">
                {entregas.map((e) => (
                  <div key={e.id_resposta} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/0.05)] rounded-[2rem] p-4 border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
                    <div>
                      <p className="font-black text-sm">{e.atividade_titulo}</p>
                      <p className="text-xs text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">{e.aluno_nome} • {e.aluno_email}</p>
                    </div>
                    <span className="px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-300 text-xs font-bold w-fit">
                      {formatarData(e.respondido_em)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[rgb(var(--pn-superficie-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2.5rem] p-6 shadow-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
            <h2 className="text-xl font-black mb-4">Desempenho geral</h2>
            {desempenho.length === 0 ? (
              <p className="text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">Sem dados de desempenho ainda.</p>
            ) : (
              <div className="space-y-3">
                {desempenho.slice(0, 8).map((u) => (
                  <div key={u.id_usuario} className="flex items-center justify-between bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/0.05)] rounded-[2rem] p-4 border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
                    <div>
                      <p className="font-black text-sm">{u.nome}</p>
                      <p className="text-xs text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60 capitalize">{u.tipo}</p>
                    </div>
                    <span className="text-sm font-black text-[rgb(var(--pn-primaria-rgb)/1)] dark:text-[rgb(var(--pn-primaria-rgb)/1)]">
                      {u.media_nota ? `${Number(u.media_nota).toFixed(1)}%` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.section>
        <div id="pedagogy-evidence" className="pedagogy-section"><header><span>EVIDÊNCIAS DE APRENDIZAGEM</span><h2>Leia os sinais com contexto</h2><p>Taxas e revisões ajudam a escolher uma intervenção; não definem o potencial de um estudante.</p></header>
        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="rounded-[2.5rem] border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 shadow-xl dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
          <div className="mb-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-[rgb(var(--pn-primaria-rgb)/1)] dark:text-[rgb(var(--pn-primaria-rgb)/1)]">Sinais pedagógicos</p><h2 className="text-xl font-black">Quem precisa de uma intervenção</h2></div>
          {aprendizagem.length === 0 ? <p className="text-sm text-[rgb(var(--pn-texto-rgb)/0.55)] dark:text-white/55">Os indicadores aparecem depois das primeiras práticas.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b border-black/10 text-xs uppercase tracking-wider text-[rgb(var(--pn-texto-rgb)/0.45)] dark:border-white/10 dark:text-white/45"><th className="p-3">Aluno</th><th className="p-3">Acerto</th><th className="p-3">Erros</th><th className="p-3">Revisões vencidas</th><th className="p-3">Sinal</th></tr></thead><tbody>{aprendizagem.map((aluno)=>{const risco=Number(aluno.taxa_acerto)<50||Number(aluno.revisoes_atrasadas)>5;return <tr key={aluno.id_usuario} className="border-b border-black/5 dark:border-white/5"><td className="p-3"><b>{aluno.nome}</b><small className="block opacity-55">{aluno.email}</small></td><td className="p-3 font-black">{aluno.taxa_acerto}%</td><td className="p-3">{aluno.erros_pendentes}</td><td className="p-3">{aluno.revisoes_atrasadas}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-black ${risco?'bg-amber-100 text-amber-800':'bg-emerald-100 text-emerald-800'}`}>{risco?'Acompanhar':'No ritmo'}</span></td></tr>})}</tbody></table></div>}
        </motion.section></div>

        <motion.section id="pedagogy-notices" variants={fadeUp} initial="hidden" animate="visible" className="pedagogy-notices bg-[rgb(var(--pn-superficie-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[2.5rem] p-6 shadow-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black">Avisos</h2>
            <button
              type="button"
              onClick={() => setMostrarFormAviso(!mostrarFormAviso)}
              className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white px-5 py-2 text-sm font-bold hover:bg-black transition"
            >
              {mostrarFormAviso ? 'Cancelar' : 'Novo aviso'}
            </button>
          </div>

          {mostrarFormAviso && (
            <form onSubmit={criarAviso} className="mb-6 space-y-3 rounded-2xl bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/0.05)] p-5 border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
              <input
                value={novoAviso.titulo}
                onChange={(e) => setNovoAviso({ ...novoAviso, titulo: e.target.value })}
                placeholder="Título do aviso"
                className="w-full rounded-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] bg-[rgb(var(--pn-superficie-rgb)/1)] px-4 py-2 text-sm text-[rgb(var(--pn-texto-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] dark:text-white"
                required
              />
              <textarea
                value={novoAviso.mensagem}
                onChange={(e) => setNovoAviso({ ...novoAviso, mensagem: e.target.value })}
                placeholder="Mensagem"
                className="h-24 w-full rounded-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] bg-[rgb(var(--pn-superficie-rgb)/1)] px-4 py-2 text-sm text-[rgb(var(--pn-texto-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] dark:text-white"
                required
              />
              <select
                value={novoAviso.destinatarios}
                onChange={(e) => setNovoAviso({ ...novoAviso, destinatarios: e.target.value })}
                className="w-full rounded-xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.4)] bg-[rgb(var(--pn-superficie-rgb)/1)] px-4 py-2 text-sm text-[rgb(var(--pn-texto-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] dark:text-white"
              >
                <option value="todos">Todos</option>
                <option value="docentes">Docentes</option>
                <option value="alunos">Alunos</option>
              </select>
              <button
                type="submit"
                disabled={enviandoAviso}
                className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white px-6 py-2 text-sm font-bold hover:bg-black transition disabled:opacity-50"
              >
                {enviandoAviso ? 'Publicando...' : 'Publicar aviso'}
              </button>
            </form>
          )}

          {avisos.length === 0 ? (
            <p className="text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">Nenhum aviso publicado.</p>
          ) : (
            <div className="space-y-3">
              {avisos.map((aviso) => (
                <div key={aviso.id_aviso} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/0.05)] rounded-[2rem] p-4 border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]">
                  <div>
                    <p className="font-black text-sm">{aviso.titulo}</p>
                    <p className="text-xs text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">{aviso.mensagem}</p>
                    <p className="text-[10px] text-[rgb(var(--pn-texto-rgb)/0.4)] dark:text-white/40 mt-1">{formatarData(aviso.criado_em)} • {aviso.destinatarios}</p>
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
    </main>
  )
}
