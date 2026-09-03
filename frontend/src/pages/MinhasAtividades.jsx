import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'react-hot-toast'
import atividadeService from '../services/atividadeService'
import MaterialViewer from '../components/MaterialViewer'

const FILTROS = [
  { key: 'TODOS', label: 'Todas' },
  { key: 'PENDENTE', label: 'Pendentes' },
  { key: 'ENTREGUE', label: 'Em correção' },
  { key: 'CORRIGIDA', label: 'Corrigidas' }
]

const statusLabel = (item) => item.minha_resposta_status === 'CORRIGIDA'
  ? 'Corrigida'
  : item.minha_resposta_status === 'ENTREGUE' ? 'Em correção' : 'Pendente'

export default function MinhasAtividades() {
  const [itens, setItens] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('TODOS')
  const [selecionada, setSelecionada] = useState(null)
  const [respostas, setRespostas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [material, setMaterial] = useState(null)

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

  const filtradas = useMemo(() => itens.filter((item) => {
    if (filtro === 'TODOS') return true
    if (filtro === 'PENDENTE') return !item.minha_resposta_status
    return item.minha_resposta_status === filtro
  }), [itens, filtro])

  const abrir = async (item) => {
    try {
      const data = await atividadeService.obter(item.id_atividade)
      setSelecionada({ ...data.atividade, minhaResposta: data.minhaResposta })
      setRespostas(data.minhaResposta?.resposta || {})
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível abrir a atividade.')
    }
  }

  const atualizarCheckbox = (id, opcao) => {
    setRespostas((atual) => {
      const lista = Array.isArray(atual[id]) ? atual[id] : []
      return { ...atual, [id]: lista.includes(opcao) ? lista.filter((valor) => valor !== opcao) : [...lista, opcao] }
    })
  }

  const enviar = async () => {
    const incompletas = selecionada.questoes.some((questao) => {
      const valor = respostas[questao.id]
      return Array.isArray(valor) ? !valor.length : !String(valor ?? '').trim()
    })
    if (incompletas) return toast.error('Responda todas as questões antes de entregar.')
    setEnviando(true)
    try {
      const data = await atividadeService.responder(selecionada.id_atividade, respostas)
      toast.success(data.message)
      setSelecionada(null)
      await carregar()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Não foi possível entregar a atividade.')
    } finally {
      setEnviando(false)
    }
  }

  if (loading) return <div className="app-page-loading"><span />Carregando suas atividades…</div>

  return (
    <main className="learning-page">
      <div className="learning-shell">
        <header className="learning-hero">
          <div><p>PLANEJAI · SALA DE APRENDIZAGEM</p><h1>Suas missões de estudo</h1><span>Resolva atividades, acompanhe correções e transforme cada entrega em progresso real.</span></div>
          <div className="learning-hero-score"><strong>{itens.filter((item) => item.minha_resposta_status === 'CORRIGIDA').length}</strong><small>concluídas</small></div>
        </header>

        <nav className="learning-filters" aria-label="Filtrar atividades">
          {FILTROS.map((item) => <button key={item.key} type="button" aria-pressed={filtro === item.key} onClick={() => setFiltro(item.key)}>{item.label}</button>)}
        </nav>

        {!filtradas.length ? (
          <section className="learning-empty"><span>✓</span><h2>Tudo em dia por aqui</h2><p>Novas atividades ou resultados aparecerão neste espaço.</p></section>
        ) : (
          <section className="learning-grid">
            {filtradas.map((item, index) => (
              <motion.article key={item.id_atividade} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="learning-card">
                <div className="learning-card-top"><span data-status={item.minha_resposta_status || 'PENDENTE'}>{statusLabel(item)}</span><small>{item.questoes?.length || 0} questões</small></div>
                <h2>{item.titulo || item.pergunta}</h2><p>{item.descricao || 'Seu professor preparou esta atividade para você.'}</p>
                <div className="learning-card-meta"><span>{item.prazo ? `Até ${new Date(item.prazo).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'Sem prazo'}</span>{item.minha_resposta_status === 'CORRIGIDA' && <strong>{Number(item.minha_nota || 0).toFixed(0)}%</strong>}</div>
                <button type="button" onClick={() => abrir(item)}>{item.minha_resposta_status ? 'Ver resultado' : 'Começar atividade'} <span>→</span></button>
              </motion.article>
            ))}
          </section>
        )}
      </div>

      <AnimatePresence>
        {selecionada && (
          <motion.div className="activity-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={() => setSelecionada(null)}>
            <motion.section className="activity-player" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
              <header><div><p>ATIVIDADE</p><h2>{selecionada.titulo}</h2><span>{selecionada.descricao}</span></div><button type="button" onClick={() => setSelecionada(null)} aria-label="Fechar">×</button></header>
              {selecionada.anexos?.length > 0 && <div className="activity-materials">{selecionada.anexos.map((anexo, index) => <button type="button" key={`${anexo.url}-${index}`} onClick={() => setMaterial({ ...anexo, titulo: anexo.nome || 'Anexo da atividade', tipo: anexo.tipo || 'IMAGEM' })}>Abrir {anexo.nome || `anexo ${index + 1}`}</button>)}</div>}
              {selecionada.minhaResposta && <div className="activity-result"><strong>{selecionada.minhaResposta.status === 'CORRIGIDA' ? `Nota: ${Number(selecionada.minhaResposta.nota || 0).toFixed(0)}%` : 'Entrega enviada para correção'}</strong>{selecionada.minhaResposta.feedback && <p>{selecionada.minhaResposta.feedback}</p>}</div>}
              <div className="activity-questions">
                {selecionada.questoes.map((questao, index) => (
                  <fieldset key={questao.id} disabled={Boolean(selecionada.minhaResposta)}>
                    <legend><span>{String(index + 1).padStart(2, '0')}</span>{questao.enunciado}</legend>
                    {questao.tipo === 'DISSERTATIVA' ? <textarea value={respostas[questao.id] || ''} onChange={(e) => setRespostas({ ...respostas, [questao.id]: e.target.value })} placeholder="Desenvolva sua resposta…" /> : <div className="activity-options">{questao.opcoes.map((opcao) => <label key={opcao}><input type={questao.tipo === 'CHECKBOX' ? 'checkbox' : 'radio'} name={questao.id} value={opcao} checked={questao.tipo === 'CHECKBOX' ? (respostas[questao.id] || []).includes(opcao) : respostas[questao.id] === opcao} onChange={() => questao.tipo === 'CHECKBOX' ? atualizarCheckbox(questao.id, opcao) : setRespostas({ ...respostas, [questao.id]: opcao })} /><span>{opcao}</span></label>)}</div>}
                  </fieldset>
                ))}
              </div>
              <footer>{!selecionada.minhaResposta && <button type="button" disabled={enviando} onClick={enviar}>{enviando ? 'Enviando…' : 'Entregar atividade'}</button>}</footer>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
      {material && <MaterialViewer material={material} onClose={() => setMaterial(null)} />}
    </main>
  )
}
