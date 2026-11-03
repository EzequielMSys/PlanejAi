import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import RecoveryState from '../components/RecoveryState'
import ContentState from '../components/ContentState'
import avisoService from '../services/avisoService'

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

export default function AvisosAluno() {
  const [avisos, setAvisos] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError,setLoadError]=useState(false)

  async function carregar() {
    setLoading(true);setLoadError(false)
    try {
      const data = await avisoService.listar()
      if(!Array.isArray(data))throw Error('invalid')
      setAvisos(data)
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] flex items-center justify-center">
        <div className="bg-[rgb(var(--pn-superficie-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] rounded-[3rem] p-10 shadow-2xl border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)] text-center">
          <div className="h-14 w-14 border-b-4 border-[rgb(var(--pn-primaria-borda-rgb)/1)] rounded-full animate-spin mx-auto mb-4" />
          <p className="font-bold text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60">Carregando avisos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--pn-superficie-alt-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] text-[rgb(var(--pn-texto-rgb)/1)] dark:text-white px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[rgb(var(--pn-primaria-forte-rgb)/0.2)] rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[rgb(var(--pn-primaria-forte-rgb)/0.1)] rounded-full blur-3xl" />

      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <section className="workspace-hero bg-gradient-to-br from-[rgb(var(--pn-primaria-rgb)/1)] via-[rgb(var(--pn-primaria-rgb)/1)] to-[rgb(var(--pn-primaria-rgb)/1)] rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden student-page-heading">
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
                PlanejAI
              </p>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-3 tracking-tight">
                Avisos
              </h1>
              <p className="text-lg text-white/85 max-w-2xl">
                Fique por dentro dos comunicados da equipe.
              </p>
            </div>
          </section>
        </motion.div>

        {loadError ? <RecoveryState title="Não conseguimos consultar seus avisos." onRetry={carregar}><p>A lista não foi confirmada. Tente novamente para conferir os comunicados da equipe.</p></RecoveryState> : avisos.length === 0 ? (
          <ContentState title="Nenhum aviso por enquanto" description="Quando a equipe publicar um comunicado para você, ele aparecerá aqui."><Link to="/inicio">Voltar a Hoje</Link></ContentState>
        ) : (
          <section className="grid gap-5 md:grid-cols-2">
            {avisos.map((aviso, idx) => (
              <motion.article
                key={aviso.id_aviso || idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="content-card rounded-[2.5rem] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 shadow-xl dark:bg-[rgb(var(--pn-superficie-rgb)/1)] border border-[rgb(var(--pn-primaria-borda-rgb)/0.2)]"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/0.2)] px-3 py-1 text-xs font-black">
                    {aviso.destinatarios === 'todos' ? 'Todos' : aviso.destinatarios === 'docentes' ? 'Docentes' : 'Alunos'}
                  </span>
                  <span className="text-xs font-bold text-[rgb(var(--pn-texto-rgb)/0.5)] dark:text-white/50">{formatarData(aviso.criado_em)}</span>
                </div>

                <h2 className="text-xl font-black mb-2">{aviso.titulo}</h2>
                <p className="text-sm text-[rgb(var(--pn-texto-rgb)/0.6)] dark:text-white/60 whitespace-pre-wrap">{aviso.mensagem}</p>
              </motion.article>
            ))}
          </section>
        )}
      </div>
    </main>
  )
}
