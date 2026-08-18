import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-hot-toast'
import redacaoService from '../services/redacaoService'
import './EssayStudio.css'
import WritingRadar from './WritingRadar'

const DRAFT_KEY = 'planejai:redacao:rascunho:v2'

function contar(texto) {
  const palavras = texto.trim() ? texto.trim().split(/\s+/).length : 0
  const paragrafos = texto.split(/\n+/).filter((p) => p.trim()).length
  const frases = texto.split(/[.!?]+/).filter((f) => f.trim()).length
  return { palavras, paragrafos, frases, linhas: Math.max(0, Math.round(palavras / 10)), leitura: Math.max(1, Math.ceil(palavras / 180)) }
}

function checarEstrutura(texto) {
  const t = texto.toLowerCase()
  const paragrafos = texto.split(/\n+/).filter((p) => p.trim())
  return [
    { nome: 'Introdução', ok: paragrafos.length >= 1 && contar(paragrafos[0] || '').palavras >= 35, dica: 'Contexto + recorte + tese' },
    { nome: 'Argumento 1', ok: paragrafos.length >= 2 && contar(paragrafos[1] || '').palavras >= 45, dica: 'Causa, prova e análise' },
    { nome: 'Argumento 2', ok: paragrafos.length >= 3 && contar(paragrafos[2] || '').palavras >= 45, dica: 'Novo eixo, sem repetir' },
    { nome: 'Intervenção', ok: paragrafos.length >= 4 && ['deve', 'por meio', 'a fim de', 'para que'].some((x) => t.includes(x)), dica: 'Agente + ação + meio + fim' }
  ]
}

function TemaLab({ sugestao, usarTema }) {
  if (!sugestao) return null
  const textos = sugestao.textosMotivadores || []
  const repertorios = [...(sugestao.repertorio || []), ...(sugestao.recomendacoes || [])]
  return <section className="essay-theme-lab">
    <header><div><span>TEMA LAB / {sugestao.area || 'ENEM'}</span><h3>{sugestao.tema}</h3></div><button type="button" onClick={() => usarTema(sugestao.tema)}>Usar este tema</button></header>
    {sugestao.questaoNorteadora && <blockquote>{sugestao.questaoNorteadora}</blockquote>}
    {textos.length > 0 && <div className="essay-motivators">{textos.map((item) => <article key={item.rotulo}><b>{item.rotulo}</b><p>{item.texto}</p></article>)}</div>}
    <div className="essay-lab-grid">
      <div><h4>Rotas de tese</h4>{(sugestao.rotasDeTese || []).map((r, i) => <p key={r}><span>0{i + 1}</span>{r}</p>)}</div>
      <div><h4>Repertório para investigar</h4>{repertorios.slice(0, 6).map((r) => <article key={`${r.tipo}-${r.titulo}`}><span>{r.tipo}</span><b>{r.titulo}</b>{r.autor && <small>{r.autor}</small>}<p>{r.como_usar}</p></article>)}</div>
    </div>
    {(sugestao.armadilhas || []).length > 0 && <footer><b>Evite:</b> {sugestao.armadilhas.join(' · ')}</footer>}
  </section>
}

function DiagnosticPanel({ diagnostico }) {
  if (!diagnostico) return null
  return <section className="essay-diagnostic" aria-live="polite">
    <header><div><span>PRÉVIA FORMATIVA</span><h3>{diagnostico.notaEstimada}<small>/1000</small></h3></div><p>Não é uma nota oficial. Use como mapa de revisão.</p></header>
    <div className="essay-competences">{(diagnostico.competencias || []).map((c) => <article key={c.codigo}><div><span>C{c.codigo}</span><b>{c.nota}/200</b></div><meter min="0" max="200" value={c.nota} /><p>{c.feedback}</p></article>)}</div>
    <div className="essay-revision-roadmap"><h4>Próximas 3 revisões</h4>{(diagnostico.planoRevisao || []).map((p) => <div key={p.competencia}><b>{p.prioridade}</b><span><strong>{p.titulo}</strong><small>{p.acao}</small></span></div>)}</div>
    {diagnostico.sinaisAutoria && <details className="essay-authorship"><summary>Sinais de estilo e autoria <span>análise limitada</span></summary><p>{diagnostico.sinaisAutoria.aviso}</p>{diagnostico.sinaisAutoria.evidencias?.map((e) => <small key={e}>• {e}</small>)}</details>}
    <footer>{diagnostico.privacidade}</footer>
  </section>
}

export default function EssayStudio({ form, setForm, onSubmit, onCancel, enviando, sugestao, sugerindo, onSugerir }) {
  const [foco, setFoco] = useState(false)
  const [salvoEm, setSalvoEm] = useState(null)
  const [diagnostico, setDiagnostico] = useState(null)
  const [analisando, setAnalisando] = useState(false)
  const metricas = useMemo(() => contar(form.texto), [form.texto])
  const estrutura = useMemo(() => checarEstrutura(form.texto), [form.texto])
  const progresso = Math.min(100, Math.round((metricas.palavras / 280) * 100))

  useEffect(() => {
    if (form.tema || form.texto) return
    try {
      const salvo = JSON.parse(localStorage.getItem(DRAFT_KEY))
      if (salvo?.texto || salvo?.tema) {
        setForm({ tema: salvo.tema || '', texto: salvo.texto || '' })
        setSalvoEm(salvo.salvoEm || null)
        toast.success('Seu rascunho anterior foi recuperado.')
      }
    } catch { localStorage.removeItem(DRAFT_KEY) }
  }, []) // restaura apenas ao abrir o estúdio

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!form.tema && !form.texto) return
      const agora = new Date().toISOString()
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, salvoEm: agora }))
      setSalvoEm(agora)
    }, 650)
    return () => window.clearTimeout(timer)
  }, [form])

  async function analisar() {
    if (form.texto.trim().length < 80) return toast.error('Escreva mais um pouco antes da pré-análise.')
    setAnalisando(true)
    try { setDiagnostico(await redacaoService.analisarRascunho(form)) } finally { setAnalisando(false) }
  }

  function descartar() {
    if (!window.confirm('Descartar o rascunho salvo neste navegador?')) return
    localStorage.removeItem(DRAFT_KEY); setForm({ tema: '', texto: '' }); setDiagnostico(null); onCancel()
  }

  return <div className={`essay-studio ${foco ? 'is-focus' : ''}`}>
    <header className="essay-studio-top"><div><span>PLANEJAI / ESTÚDIO DE REDAÇÃO</span><h2>Construa, teste, revise.</h2></div><div><button type="button" onClick={() => setFoco((v) => !v)}>{foco ? 'Sair do foco' : 'Modo foco'}</button><button type="button" onClick={onCancel}>Fechar</button></div></header>
    <form onSubmit={onSubmit}>
      <aside className="essay-outline">
        <span className="essay-kicker">MAPA DO TEXTO</span>
        <div className="essay-progress"><div><b>{progresso}%</b><small>meta de 280 palavras</small></div><i><i style={{ width: `${progresso}%` }} /></i></div>
        <div className="essay-outline-list">{estrutura.map((item, i) => <article className={item.ok ? 'is-done' : ''} key={item.nome}><span>{item.ok ? '✓' : i + 1}</span><div><b>{item.nome}</b><small>{item.dica}</small></div></article>)}</div>
        <div className="essay-mini-stats"><div><b>{metricas.palavras}</b><span>palavras</span></div><div><b>{metricas.linhas}</b><span>linhas estim.</span></div><div><b>{metricas.paragrafos}</b><span>parágrafos</span></div><div><b>{metricas.leitura} min</b><span>leitura</span></div></div>
        <button className="essay-outline-analysis" type="button" onClick={analisar} disabled={analisando}>{analisando ? 'Lendo o projeto...' : 'Analisar meu rascunho'}</button>
        <small className="essay-private-note">Prévia processada pelo backend do PlanejAI, sem enviar o rascunho ao corretor externo.</small>
      </aside>

      <main className="essay-sheet">
        <div className="essay-sheet-meta"><span>RASCUNHO</span><span>{salvoEm ? `salvo ${new Date(salvoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'não salvo'}</span></div>
        <label htmlFor="essay-topic">Tema da redação</label>
        <div className="essay-topic-row"><input id="essay-topic" value={form.tema} onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))} placeholder="Delimite o tema aqui" /><button type="button" onClick={onSugerir} disabled={sugerindo}>{sugerindo ? 'Criando...' : 'Tema Lab'}</button></div>
        <textarea aria-label="Texto da redação" value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} placeholder={'Comece pela sua tese.\n\nDepois, desenvolva um argumento por parágrafo...'} spellCheck="true" />
        <div className="essay-sheet-actions"><button type="button" onClick={descartar}>Descartar</button><div><button type="button" onClick={analisar} disabled={analisando}>Pré-corrigir</button><button type="submit" disabled={enviando || metricas.palavras < 30}>{enviando ? 'Enviando...' : 'Finalizar e enviar'}</button></div></div>
      </main>
      {!foco && <aside className="essay-coach"><span className="essay-kicker">COACH DE REVISÃO</span><WritingRadar text={form.texto} />{diagnostico ? <DiagnosticPanel diagnostico={diagnostico} /> : <><h3>Antes de entregar</h3><p>O bom texto não nasce pronto. Faça três leituras, cada uma com uma missão.</p><ol><li><b>Ideia</b><span>A tese responde exatamente ao tema?</span></li><li><b>Prova</b><span>Cada argumento tem explicação e consequência?</span></li><li><b>Forma</b><span>Há clareza, coesão e pontuação?</span></li></ol><blockquote>Repertório bom não enfeita. Ele ajuda a provar alguma coisa.</blockquote></>}</aside>}
    </form>
    {!foco && <TemaLab sugestao={sugestao} usarTema={(tema) => setForm((f) => ({ ...f, tema }))} />}
  </div>
}
