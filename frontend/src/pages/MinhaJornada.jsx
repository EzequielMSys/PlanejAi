import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import aprendizagemService from '../services/aprendizagemService'
import './MinhaJornada.css'

const presets = [15, 25, 45, 60]
const typeLabels = { AQUECIMENTO: 'Preparação', REVISAO: 'Revisão', ERROS: 'Recuperação', CONTEUDO: 'Conteúdo', REDACAO: 'Redação', PRATICA: 'Prática', FECHAMENTO: 'Fechamento' }

export default function MinhaJornada() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [minutes, setMinutes] = useState(25)
  const [journey, setJourney] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completed, setCompleted] = useState(() => new Set())

  async function generate(value = minutes) {
    const safe = Math.max(10, Math.min(180, Number(value) || 25))
    setMinutes(safe); setLoading(true); setCompleted(new Set())
    try { setJourney(await aprendizagemService.jornada(safe)) }
    catch { toast.error('Não foi possível montar sua jornada agora.') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    let active = true
    aprendizagemService.jornada(25)
      .then((result) => { if (active) setJourney(result) })
      .catch(() => { if (active) toast.error('Não foi possível montar sua jornada agora.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  function openBlock(block) {
    if (!block.path) {
      setCompleted((current) => new Set([...current, block.id]))
      return
    }
    if (block.type === 'CONTEUDO') navigate('/estudar', { state: { conteudo: block.payload, dia: { id_dia: block.payload?.id_dia, data_estudo: block.payload?.data_estudo } } })
    else navigate(block.path)
  }

  const doneMinutes = journey?.blocks.filter((block) => completed.has(block.id)).reduce((sum, block) => sum + block.minutes, 0) || 0
  const name = user?.apelido || user?.nome?.split(' ')[0] || 'estudante'

  return <main className="pj-page journey-page"><div className="pj-wrap">
    <header className="journey-hero pj-panel">
      <div><span className="pj-eyebrow">Minha jornada</span><h1>Quanto tempo você tem, <em>{name}</em>?</h1><p>O PlanejAI combina revisões, dificuldades e cronograma em uma sessão possível de terminar.</p></div>
      <div className="journey-time-box"><div>{presets.map((value) => <button type="button" key={value} className={minutes === value ? 'is-active' : ''} onClick={() => generate(value)}>{value}<small>min</small></button>)}</div><label>Outro tempo<input aria-label="Tempo personalizado em minutos" type="number" min="10" max="180" value={minutes} onChange={(event) => setMinutes(event.target.value)} onBlur={() => generate(minutes)} /></label></div>
    </header>

    {loading ? <section className="journey-loading pj-panel"><i /><b>Analisando suas prioridades…</b></section> : journey && <>
      <section className="journey-summary" aria-label="Resumo da jornada">
        <article><span>Tempo planejado</span><strong>{journey.plannedMinutes} min</strong></article>
        <article><span>Revisões prontas</span><strong>{journey.summary.reviews}</strong></article>
        <article><span>Erros pendentes</span><strong>{journey.summary.errors}</strong></article>
        <article><span>Meta semanal</span><strong>{journey.summary.weeklyMinutes}/{journey.summary.weeklyGoal}</strong></article>
      </section>

      <section className="journey-layout">
        <article className="journey-route pj-panel">
          <header><div><span className="pj-eyebrow">Rota sugerida</span><h2>Uma coisa por vez</h2></div><strong>{doneMinutes}/{journey.plannedMinutes} min</strong></header>
          <div className="journey-progress"><i style={{ width: `${journey.plannedMinutes ? (doneMinutes / journey.plannedMinutes) * 100 : 0}%` }} /></div>
          <ol>{journey.blocks.map((block, index) => <li key={block.id} className={completed.has(block.id) ? 'is-done' : ''}>
            <button type="button" onClick={() => openBlock(block)}>
              <span className="journey-index">{completed.has(block.id) ? '✓' : String(index + 1).padStart(2, '0')}</span>
              <span className="journey-copy"><small>{typeLabels[block.type] || block.type}</small><b>{block.title}</b><em>{block.detail}</em></span>
              <strong>{block.minutes} min</strong><i>{block.path ? '→' : '✓'}</i>
            </button>
          </li>)}</ol>
        </article>
        <aside className="journey-aside">
          <article className="pj-panel"><span className="pj-eyebrow">Por que esta rota?</span><h2>{journey.summary.criticalDiscipline ? `${journey.summary.criticalDiscipline.disciplina} precisa de atenção` : 'Construindo seu diagnóstico'}</h2><p>{journey.summary.criticalDiscipline ? `Seu índice atual é ${journey.summary.criticalDiscipline.acerto}% nessa disciplina. A sessão intercala recuperação e avanço para evitar sobrecarga.` : 'Quanto mais você responde e avalia revisões, mais específica fica a próxima jornada.'}</p></article>
          <button type="button" className="pj-button pj-button--secondary" onClick={() => generate(minutes)}>Remontar esta jornada</button>
        </aside>
      </section>
    </>}
  </div></main>
}
