import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import atividadeService from '../services/atividadeService'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

const FILTROS = [
  { key: 'TODOS', label: 'Todas' },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'ENTREGUE', label: 'Entregues' },
  { key: 'CORRIGIDA', label: 'Corrigidas' }
]

export default function MinhasAtividades() {
  const { user } = useAuth()
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')

  async function carregar() {
    try {
      const data = await atividadeService.listar()
      setItens(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Não foi possível carregar suas atividades.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const minhas = useMemo(() => {
    const meuId = String(user?.id_usuario || user?.id || '')
    return itens.filter((item) => {
      if (!item.atribuicao || item.atribuicao === 'TODOS') return true
      if (Array.isArray(item.destinatarios) && item.destinatarios.includes(meuId)) return true
      return false
    })
  }, [itens, user])

  const filtradas = useMemo(() => {
    if (filtro === 'TODOS') return minhas
    return minhas.filter((item) => {
      const status = String(item.status || '').toUpperCase()
      if (filtro === 'PENDENTE') return status === 'RASCUNHO' || status === 'PUBLICADA'
      return status === filtro
    })
  }, [minhas, filtro])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] flex items-center justify-center">
        <div className="bg-white dark:bg-[#1E1D3A] rounded-[3rem] p-10 shadow-2xl border border-[#9394CF]/20 text-center">
          <div className="h-14 w-14 border-b-4 border-[#4B4C9D] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-black/60 dark:text-white/60">Carregando suas atividades...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F7F7FB] dark:bg-[#0F0E20] text-black dark:text-white px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="workspace-hero bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
                PlanejAI
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                Minhas atividades
              </h1>
              <p className="text-lg text-white/85 max-w-2xl">
                Aqui aparecem as atividades atribuídas a você. Participe, envie respostas e acompanhe os prazos.
              </p>
            </div>
          </section>
        </motion.div>

        <motion.section variants={fadeUp} initial="hidden" animate="visible" className="mb-8">
          <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#1E1D3A] p-1.5 rounded-full border border-[#9394CF]/20 w-fit shadow-xl">
            {FILTROS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFiltro(f.key)}
                className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                  filtro === f.key
                    ? 'bg-[#4B4C9D] text-white shadow-lg'
                    : 'text-black/60 hover:text-black hover:bg-[#9394CF]/15'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.section>

        {filtradas.length === 0 ? (
          <section className="quiet-empty bg-white dark:bg-[#1E1D3A] rounded-[3rem] p-10 sm:p-12 text-center shadow-2xl border border-[#9394CF]/20">
            <div className="w-24 h-24 rounded-full bg-[#9394CF] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
              <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-1M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-black dark:text-white mb-3">
              Nenhuma atividade por enquanto
            </h2>
            <p className="text-black/60 dark:text-white/60 max-w-md mx-auto leading-relaxed">
              Quando seu professor publicar ou atribuir uma atividade, ela aparecerá aqui.
            </p>
          </section>
        ) : (
          <section className="grid gap-5 md:grid-cols-2">
            {filtradas.map((item) => (
              <motion.article
                key={item.id_atividade}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="content-card rounded-[2.5rem] bg-white p-6 shadow-xl dark:bg-[#1E1D3A] border border-[#9394CF]/20"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-[#9394CF]/20 px-3 py-1 text-xs font-black">{item.status}</span>
                  <span className="text-xs font-bold text-black/50 dark:text-white/50">{item.questoes?.length || 0} questões</span>
                </div>

                <h2 className="text-xl font-black mb-2">{item.titulo || item.pergunta}</h2>
                <p className="text-sm text-black/60 dark:text-white/60 line-clamp-2">{item.descricao}</p>

                {item.anexos?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.anexos.map((anexo, idx) => (
                      <img key={idx} src={anexo.url} alt={anexo.nome} className="h-20 w-20 rounded-xl object-cover border border-[#9394CF]/30" />
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-bold text-[#4B4C9D]">
                    {item.prazo ? `Prazo: ${new Date(item.prazo).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
                  </span>
                </div>
              </motion.article>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}
