import EssayIntentReview from './EssayIntentReview'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-hot-toast'
import redacaoService from '../services/redacaoService'
import DictationButton from './DictationButton'
import './EssayStudio.css'
import WritingRadar from './WritingRadar'
import { essayDraftKey, readEssayDraft, writeEssayDraft } from '../utils/essayDraft'
import SaveFeedback from './SaveFeedback'
import useExitWarning from '../hooks/useExitWarning'
import { downloadTextCopy } from '../utils/downloadTextCopy'


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
    <header><div><span>PRÉVIA FORMATIVA DA LUMI</span><h3>{diagnostico.notaEstimada == null ? 'Sem nota' : <>{diagnostico.notaEstimada}<small>/1000</small></>}</h3></div><p>{diagnostico.aviso}</p></header>
    <div className="essay-competences">{(diagnostico.competencias || []).map((c) => <article key={c.codigo}><div><span>C{c.codigo}</span><b>{c.nota}/200</b></div><meter min="0" max="200" value={c.nota} /><p><strong>Evidência:</strong> {c.evidencia}</p><p>{c.feedback}</p></article>)}</div>
    <div className="essay-revision-roadmap"><h4>Próximas 3 revisões</h4>{(diagnostico.planoRevisao || []).map((p) => <div key={p.competencia}><b>{p.prioridade}</b><span><strong>{p.titulo}</strong><small>{p.acao}</small></span></div>)}</div>
    {diagnostico.sinaisAutoria && <details className="essay-authorship"><summary>Sinais de estilo e autoria <span>análise limitada</span></summary><p>{diagnostico.sinaisAutoria.aviso}</p>{diagnostico.sinaisAutoria.evidencias?.map((e) => <small key={e}>• {e}</small>)}</details>}
    <footer>{diagnostico.privacidade} <a href="https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/a-redacao-do-enem-2026-cartilha-do-a-participante" target="_blank" rel="noreferrer">Consultar a cartilha oficial do Inep</a></footer>
  </section>
}

export default function EssayStudio({ form, setForm, onSubmit, onCancel, enviando, queued, sendError, sugestao, sugerindo, onSugerir }) {
  const editorRef=useRef(null)
  const [selection,setSelection]=useState(null)
  const [foco, setFoco] = useState(false)
  const [salvoEm, setSalvoEm] = useState(null)
  const [draftFailed, setDraftFailed] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const [diagnostico, setDiagnostico] = useState(null)
  const [analisando, setAnalisando] = useState(false)
  useExitWarning(draftFailed && Boolean(form.texto || form.tema))
  const metricas = useMemo(() => contar(form.texto), [form.texto])
  const estrutura = useMemo(() => checarEstrutura(form.texto), [form.texto])
  const progresso = Math.min(100, Math.round((metricas.palavras / 280) * 100))

  useEffect(() => {
    if (form.tema || form.texto) { setDraftReady(true); return }
    try {
      const salvo = readEssayDraft()
      if (salvo?.texto || salvo?.tema) {
        setForm({ tema: salvo.tema || '', texto: salvo.texto || '' })
        setSalvoEm(salvo.salvoEm || null)
        toast.success('Seu rascunho anterior foi recuperado.')
      }
    } catch { /* O formulário permanece disponível sem armazenamento. */ }
    setDraftReady(true)
  }, []) // restaura apenas ao abrir o estúdio

  useEffect(() => {
    if (!draftReady) return
    if (!form.tema && !form.texto) {
      try { localStorage.removeItem(essayDraftKey()); setSalvoEm(null); setDraftFailed(false) } catch { setDraftFailed(true) }
      return
    }
    const saved = writeEssayDraft(form)
    setSalvoEm(saved)
    setDraftFailed(!saved)
  }, [form, draftReady])

  async function analisar() {
    if (form.texto.trim().length < 80) return toast.error('Escreva mais um pouco antes da pré-análise.')
    if (!form.tema.trim()) return toast.error('Informe o tema para que a Lumi avalie a aderência do texto.')
    setAnalisando(true)
    try { setDiagnostico(await redacaoService.analisarRascunho(form)) } catch (error) { toast.error(error?.response?.data?.message || 'Não foi possível analisar o rascunho.'); } finally { setAnalisando(false) }
  }

  function descartar() {
    if (!window.confirm('Descartar o rascunho salvo neste navegador?')) return
    try { localStorage.removeItem(essayDraftKey()) } catch { toast.error('Não foi possível remover o rascunho deste aparelho.'); return }
    setForm({ tema: '', texto: '' }); setDiagnostico(null); onCancel()
  }

  return <div className={`essay-studio ${foco ? 'is-focus' : ''}`}>
    <header className="essay-studio-top"><div><span>PLANEJAI / ESTÚDIO DE REDAÇÃO</span><h2>Construa, teste, revise.</h2></div><div><button type="button" onClick={() => setFoco((v) => !v)}>{foco ? 'Sair do foco' : 'Modo foco'}</button><button type="button" onClick={onCancel}>Fechar</button></div></header>
    {draftFailed && <SaveFeedback status="unsaved" message="Não conseguimos guardar o rascunho neste aparelho. Mantenha esta tela aberta e copie seu texto antes de sair." onRetry={() => { const saved = writeEssayDraft(form); setSalvoEm(saved); setDraftFailed(!saved) }} />}
    {draftFailed && <button type="button" className="study-button" onClick={() => downloadTextCopy(`${form.tema}\n\n${form.texto}`, 'planejai-rascunho-redacao.txt')}>Baixar cópia do meu texto</button>}
    {queued && <SaveFeedback status="local" message="Esta versão já foi encaminhada pela fila deste aparelho. Ao reconectar, confira o histórico antes de tentar outro envio. Seu texto continua aqui." />}
    <form onSubmit={onSubmit} aria-busy={enviando}>
      <aside className="essay-outline">
        <span className="essay-kicker">MAPA DO TEXTO</span>
        <div className="essay-progress"><div><b>{progresso}%</b><small>meta de 280 palavras</small></div><i><i style={{ width: `${progresso}%` }} /></i></div>
        <div className="essay-outline-list">{estrutura.map((item, i) => <article className={item.ok ? 'is-done' : ''} key={item.nome}><span>{item.ok ? '✓' : i + 1}</span><div><b>{item.nome}</b><small>{item.dica}</small></div></article>)}</div>
        <div className="essay-mini-stats"><div><b>{metricas.palavras}</b><span>palavras</span></div><div><b>{metricas.linhas}</b><span>linhas estim.</span></div><div><b>{metricas.paragrafos}</b><span>parágrafos</span></div><div><b>{metricas.leitura} min</b><span>leitura</span></div></div>
        <button className="essay-outline-analysis" type="button" onClick={analisar} disabled={analisando}>{analisando ? 'Lendo o projeto...' : 'Analisar meu rascunho'}</button>
        <small className="essay-private-note">A prévia usa a Lumi e envia o texto ao provedor de IA configurado pelo PlanejAI. A nota é apenas estimada.</small>
      </aside>

      <section className="essay-sheet" aria-label="Texto e envio da redação">
        <div className="essay-sheet-meta"><span>RASCUNHO</span><span role="status">{salvoEm ? `Salvo neste aparelho · ${new Date(salvoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Ainda não salvo neste aparelho'}</span></div>
        <label htmlFor="essay-topic">Tema da redação</label>
        <div className="essay-topic-row"><input id="essay-topic" disabled={enviando} value={form.tema} onChange={(e) => setForm((f) => ({ ...f, tema: e.target.value }))} placeholder="Delimite o tema aqui" /><button type="button" onClick={onSugerir} disabled={sugerindo || enviando}>{sugerindo ? 'Criando...' : 'Tema Lab'}</button></div>
        <textarea ref={editorRef} onSelect={event=>{const node=event.currentTarget;setSelection({source:node.value,start:node.selectionStart,end:node.selectionEnd})}} aria-label="Texto da redação" disabled={enviando} value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} placeholder={'Comece pela sua tese.\n\nDepois, desenvolva um argumento por parágrafo...'} spellCheck="true" />
        <EssayIntentReview text={form.texto} selection={selection} onReturn={()=>editorRef.current?.focus()}/>
        {enviando && <SaveFeedback status="saving" message="Salvando a versão enviada na sua conta…" />}
        {sendError && !enviando && <SaveFeedback status="error" message={`${sendError} Seu texto continua aqui.`} onRetry={!queued && metricas.palavras >= 30 ? () => onSubmit({preventDefault(){}}) : undefined} />}
        <div className="essay-sheet-actions"><div><button type="button" onClick={descartar} disabled={enviando}>Descartar</button><DictationButton onText={(texto) => { if (!enviando) setForm((f) => ({ ...f, texto: `${f.texto}${f.texto ? ' ' : ''}${texto}` })) }}/></div><div><button type="button" onClick={analisar} disabled={analisando}>Pré-corrigir</button><button type="submit" disabled={enviando || queued || metricas.palavras < 30}>{enviando ? 'Enviando...' : queued ? 'Nesta versão: envio na fila' : 'Finalizar e enviar'}</button></div></div>
      </section>
      {!foco && <aside className="essay-coach"><span className="essay-kicker">COACH DE REVISÃO</span><WritingRadar text={form.texto} />{diagnostico ? <DiagnosticPanel diagnostico={diagnostico} /> : <><h3>Antes de entregar</h3><p>O bom texto não nasce pronto. Faça três leituras, cada uma com uma missão.</p><ol><li><b>Ideia</b><span>A tese responde exatamente ao tema?</span></li><li><b>Prova</b><span>Cada argumento tem explicação e consequência?</span></li><li><b>Forma</b><span>Há clareza, coesão e pontuação?</span></li></ol><blockquote>Repertório bom não enfeita. Ele ajuda a provar alguma coisa.</blockquote></>}</aside>}
    </form>
    {!foco && <TemaLab sugestao={sugestao} usarTema={(tema) => { if (!enviando) setForm((f) => ({ ...f, tema })) }} />}
  </div>
}
