import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useStudyDraft from '../hooks/useStudyDraft'
import { pathError } from '../hooks/usePersonalPath'
import { currentUser } from '../utils/offlineStore'
import service from '../services/guidedStudyService'
import { OriginalPicker, OriginalLink, PathFeedback, SavedPathFeedback, pathDate } from './PersonalPathTools'
import RecordCopy from './RecordCopy'
import './LearningExperiments.css'

const decisions = { manter: 'Manter para experimentar novamente', adaptar: 'Adaptar o procedimento', deixar: 'Deixar de lado neste contexto' }
const attemptFields = { response: 'Minha resposta', procedureUsed: 'Como apliquei o procedimento', supports: 'Apoios utilizados', conditions: 'Condições da tentativa', difficulty: 'Dificuldade percebida', minutes: 'Tempo utilizado' }
function Field({ label, value, onChange, max = 1200, required = true, rows = 3 }) {
  return <label>{label}<textarea required={required} maxLength={max} rows={rows} value={value} onChange={e => onChange(e.target.value)} /></label>
}
function DraftHint({ safe }) { return <small role="status">{safe ? 'Rascunho preservado neste aparelho até confirmar o envio.' : 'Não foi possível preservar no aparelho. Mantenha esta página aberta.'}</small> }
function useInquiry(record) {
  const [preview, setPreview] = useState(null), [asking, setAsking] = useState(false), [error, setError] = useState('')
  const owner = currentUser()
  useEffect(() => { setPreview(null) }, [record.version])
  async function ask(body) {
    setAsking(true); setError(''); setPreview(null)
    try { const value = await service.investigate(record.id, body); if (owner === currentUser()) setPreview(value) }
    catch (e) { if (owner === currentUser()) setError(pathError(e)) }
    finally { if (owner === currentUser()) setAsking(false) }
  }
  return { preview, asking, error, ask, discard: () => setPreview(null) }
}
function ExperimentCreate({ record, mutate, busy }) {
  const [open, setOpen] = useState(false)
  const [draft, update, clear, safe] = useStudyDraft(`experiment-create-${record.id}`, { key: window.crypto.randomUUID(), title: '', difficulty: '', expectation: '', common: '', differences: '', activities: [0, 1].map(() => ({ title: '', prompt: '', source: null })) })
  const edit = (name, value) => update({ ...draft, [name]: value })
  const activity = (index, value) => update({ ...draft, activities: draft.activities.map((a, i) => i === index ? { ...a, ...value } : a) })
  return <details className="experiment-create" onToggle={e => { if(e.currentTarget.open)setOpen(true) }}><summary>Planejar uma comparação com duas atividades</summary>
    {open && <form className="guided-form" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'experimentCreate', ...draft })) clear() }}><fieldset disabled={busy || record.archived}>
      <legend>O que quero investigar sobre esta estratégia</legend>
      <p>Escolha duas atividades relacionadas, com enunciados suficientes para tentar resolvê-las. Você pode escrever suas próprias atividades ou vincular registros do laboratório e de outros espaços.</p>
      <label>Nome desta comparação<input required maxLength={120} value={draft.title} onChange={e => edit('title', e.target.value)} /></label>
      <Field label="Dificuldade que quero trabalhar" value={draft.difficulty} onChange={v => edit('difficulty', v)} max={1000} />
      <Field label="O que espero que a estratégia ajude a fazer" value={draft.expectation} onChange={v => edit('expectation', v)} />
      <Field label="O que as duas atividades têm em comum" value={draft.common} onChange={v => edit('common', v)} />
      <Field label="O que é diferente entre elas" value={draft.differences} onChange={v => edit('differences', v)} />
      <div className="experiment-pair">{draft.activities.map((a, i) => <fieldset key={i}><legend>Atividade {i + 1}</legend>
        <label>Título da atividade {i + 1}<input required maxLength={160} value={a.title} onChange={e => activity(i, { title: e.target.value })} /></label>
        <Field label={`Enunciado da atividade ${i + 1}`} max={2000} value={a.prompt} onChange={v => activity(i, { prompt: v })} />
        <OptionalOriginal value={a.source} onChange={source => activity(i, { source })} />
      </fieldset>)}</div>
      <p><strong>Procedimento que será preservado nesta comparação:</strong> {record.procedure}</p>
      <button>Guardar plano das duas atividades</button><DraftHint safe={safe} />
    </fieldset></form>}
  </details>
}
function OptionalOriginal({value,onChange}) {
  const [open,setOpen]=useState(false)
  return <details onToggle={e=>{if(e.currentTarget.open)setOpen(true)}}><summary>Vincular um registro de origem (opcional)</summary>{open&&<OriginalPicker value={value} onChange={onChange}/>}</details>
}
function ExperimentAttempt({ record, experiment, slot, mutate, busy }) {
  const previous = experiment.attempts.filter(a => a.slot === slot).at(-1)
  const [draft, update, clear, safe] = useStudyDraft(`experiment-attempt-${experiment.id}-${slot}-${previous?.id || 'first'}`, { key: window.crypto.randomUUID(), response: '', supports: '', conditions: '', difficulty: '', procedureUsed: '', minutes: 15, reason: '' })
  return <details><summary>{previous ? 'Registrar outra tentativa, preservando esta' : 'Registrar minha tentativa'}</summary>
    <form className="guided-form" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'experimentAttempt', experiment: experiment.id, slot, ...draft })) clear() }}><fieldset disabled={busy}>
      <legend>Minha experiência na atividade {slot + 1}</legend>
      {Object.entries(attemptFields).filter(([key]) => key !== 'minutes').map(([key, label]) => <Field key={key} label={label} max={key === 'response' ? 4000 : key === 'procedureUsed' ? 1600 : 1200} value={draft[key]} onChange={v => update({ ...draft, [key]: v })} />)}
      <p>Se não usou apoio, registre isso. Descreva também interrupções, consulta ao exemplo ou mudanças no procedimento.</p>
      <label>Minutos utilizados<input required type="number" min="1" max="240" value={draft.minutes} onChange={e => update({ ...draft, minutes: Number(e.target.value) })} /></label>
      {previous && <Field label="Por que fiz outra tentativa" value={draft.reason} onChange={v => update({ ...draft, reason: v })} />}
      <button>Guardar tentativa da atividade {slot + 1}</button><DraftHint safe={safe} />
    </fieldset></form>
  </details>
}
function ExperimentCompare({ record, experiment, mutate, busy }) {
  const [draft, update, clear, safe] = useStudyDraft(`experiment-decision-${experiment.id}-${experiment.decisions.length}`, { key: window.crypto.randomUUID(), comparison: '', limitations: '', decision: 'manter', justification: '', adaptation: '' })
  const latest = [0, 1].map(slot => experiment.attempts.filter(a => a.slot === slot).at(-1))
  if (latest.some(a => !a)) return <p className="experiment-notice">Guarde uma tentativa de cada atividade para comparar e tomar uma decisão. Pedir ajuda faz parte do registro.</p>
  return <form className="guided-form experiment-decision" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'experimentDecision', experiment: experiment.id, ...draft })) clear() }}><fieldset disabled={busy}>
    <legend>Comparar antes de decidir</legend>
    <p>Esta comparação usará as tentativas mais recentes das atividades 1 e 2. Tempo, familiaridade e dificuldade podem mudar o resultado; duas tentativas não demonstram uma causa.</p>
    <Field label="O que percebi ao comparar as respostas e o procedimento" max={2400} value={draft.comparison} onChange={v => update({ ...draft, comparison: v })} />
    <Field label="Diferenças e limites que impedem uma conclusão mais ampla" max={1600} value={draft.limitations} onChange={v => update({ ...draft, limitations: v })} />
    <label>Minha decisão para este contexto<select value={draft.decision} onChange={e => update({ ...draft, decision: e.target.value })}>{Object.entries(decisions).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    <Field label="Por que tomei essa decisão" max={1600} value={draft.justification} onChange={v => update({ ...draft, justification: v })} />
    {draft.decision === 'adaptar' && <Field label="Como quero adaptar o procedimento" max={2000} value={draft.adaptation} onChange={v => update({ ...draft, adaptation: v })} />}
    <p>A decisão ficará nesta comparação. Ela não altera automaticamente o procedimento do seu repertório.</p><button>Guardar comparação e minha decisão</button><DraftHint safe={safe} />
  </fieldset></form>
}
function ExperimentLumi({ record, experiment, mutate, busy }) {
  const inquiry = useInquiry(record), [selected, setSelected] = useState([]), [fields, setFields] = useState([])
  const [draft, update] = useStudyDraft(`experiment-lumi-${experiment.id}`, { goal: '' })
  const toggle = (setter, list, id) => { inquiry.discard(); setter(list.includes(id) ? list.filter(v => v !== id) : [...list, id]) }
  if (!experiment.attempts.length) return null
  return <details className="path-lumi"><summary>Examinar esta comparação com a Lumi</summary><fieldset disabled={busy || inquiry.asking}>
    <legend>Contexto que escolho compartilhar</legend><p>Serão enviados os enunciados das tentativas marcadas, as partes selecionadas e o objetivo abaixo. Origens vinculadas, outras experiências e decisões não serão enviadas.</p>
    <Field label="O que quero examinar com a Lumi (opcional)" max={1000} required={false} value={draft.goal} onChange={goal => { inquiry.discard(); update({ goal }) }} />
    {experiment.attempts.map((a, i) => <label className="guided-check" key={a.id}><input type="checkbox" checked={selected.includes(a.id)} disabled={!selected.includes(a.id) && selected.length >= 2} onChange={() => toggle(setSelected, selected, a.id)} />Tentativa {i + 1} · atividade {a.slot + 1}</label>)}
    {Object.entries(attemptFields).map(([key, label]) => <label className="guided-check" key={key}><input type="checkbox" checked={fields.includes(key)} onChange={() => toggle(setFields, fields, key)} />{label}</label>)}
    <div className="path-context"><h4>Prévia do contexto</h4>{experiment.attempts.filter(a => selected.includes(a.id)).map(a => <article key={a.id}><strong>Enunciado</strong><p>{experiment.activities[a.slot].prompt}</p>{fields.map(f => <p key={f}><strong>{attemptFields[f]}:</strong> {a[f]}</p>)}</article>)}</div>
    <button type="button" disabled={!selected.length || !fields.length} onClick={() => inquiry.ask({ mode: 'experiment', experiment: experiment.id, attempts: selected, fields, goal: draft.goal })}>{inquiry.asking ? 'Examinando o contexto…' : 'Enviar somente este contexto à Lumi'}</button>
  </fieldset>{inquiry.error && <p role="alert">{inquiry.error}</p>}{inquiry.preview && <aside><h4>Orientação ainda não guardada</h4><PathFeedback value={inquiry.preview.feedback} /><button disabled={busy} onClick={async () => { if (await mutate({ action: 'feedback', receipt: inquiry.preview.receipt })) inquiry.discard() }}>Guardar orientação nesta tentativa</button><button onClick={inquiry.discard}>Descartar orientação</button></aside>}</details>
}
function ExperimentDetail({ record, experiment, mutate, busy }) {
  const latest = [0, 1].map(slot => experiment.attempts.filter(a => a.slot === slot).at(-1))
  const [history, setHistory] = useState(false)
  return <article className="learning-experiment"><header><span className="pj-eyebrow">COMPARAÇÃO PLANEJADA · {pathDate(experiment.created)}</span><h3>{experiment.title}</h3><p><strong>Dificuldade:</strong> {experiment.difficulty}</p><p><strong>O que esperava:</strong> {experiment.expectation}</p><p><strong>Procedimento escolhido:</strong> {experiment.procedure}</p></header>
    <div className="experiment-premises"><p><strong>Em comum:</strong> {experiment.common}</p><p><strong>Diferenças previstas:</strong> {experiment.differences}</p></div>
    <div className="experiment-pair">{experiment.activities.map((a, slot) => <section className="experiment-activity" key={slot}><span className="pj-eyebrow">ATIVIDADE {slot + 1}</span><h4>{a.title}</h4><p>{a.prompt}</p>{a.source && <OriginalLink source={a.source} />}
      {latest[slot] ? <><h4>Minha tentativa mais recente</h4>{Object.entries(attemptFields).map(([key, label]) => <p key={key}><strong>{label}:</strong> {latest[slot][key]}</p>)}<SavedPathFeedback entry={latest[slot]} record={record} mutate={mutate} busy={busy} /></> : <p>Ainda não registrei uma tentativa nesta atividade.</p>}
      <ExperimentAttempt key={latest[slot]?.id || 'first'} record={record} experiment={experiment} slot={slot} mutate={mutate} busy={busy} />
    </section>)}</div>
    <ExperimentCompare key={experiment.decisions.length} record={record} experiment={experiment} mutate={mutate} busy={busy} />
    {experiment.decisions.map((d, i) => <article className="experiment-decision-record" key={d.id}><h4>Decisão {i + 1} · {decisions[d.decision]}</h4><p>{d.comparison}</p><p><strong>Limites:</strong> {d.limitations}</p><p><strong>Minha justificativa:</strong> {d.justification}</p>{d.adaptation && <p><strong>Adaptação proposta:</strong> {d.adaptation}</p>}<small>Baseada nas tentativas {d.attempts.map(id => experiment.attempts.findIndex(a => a.id === id) + 1).join(' e ')}. As respostas daquele momento permanecem no histórico.</small></article>)}
    <details onToggle={e => setHistory(e.currentTarget.open)}><summary>Histórico completo das tentativas ({experiment.attempts.length})</summary>{history && experiment.attempts.map((a, i) => <article className="path-version" key={a.id}><h4>Tentativa {i + 1} · atividade {a.slot + 1} · {pathDate(a.created)}</h4>{Object.entries(attemptFields).map(([key, label]) => <p key={key}><strong>{label}:</strong> {a[key]}</p>)}{a.reason && <p>Por que tentei novamente: {a.reason}</p>}<SavedPathFeedback entry={a} record={record} mutate={mutate} busy={busy} /></article>)}</details>
    <ExperimentLumi record={record} experiment={experiment} mutate={mutate} busy={busy} />
    {experiment.attempts.length > 0 && <RecordCopy key={experiment.attempts.at(-1).id} record={record} entry={experiment.attempts.at(-1)} />}
  </article>
}
export default function LearningExperiments({ record, mutate, busy }) {
  return <section className="learning-experiments" aria-labelledby="experiments-title"><header><span className="pj-eyebrow">DO REPERTÓRIO À EXPERIÊNCIA</span><h2 id="experiments-title">Experimentar em situações comparáveis.</h2><p>Duas atividades, condições explícitas e uma decisão sua sobre o que vale tentar de novo.</p><Link to="/laboratorio">Buscar uma situação no laboratório →</Link></header><ExperimentCreate record={record} mutate={mutate} busy={busy} />{(record.experiments || []).map(e => <SavedExperiment key={e.id} record={record} experiment={e} mutate={mutate} busy={busy}/>)}</section>
}
function SavedExperiment({record,experiment,mutate,busy}) {
  const [open,setOpen]=useState(false)
  return <details className="experiment-saved" onToggle={e=>{if(e.currentTarget.open)setOpen(true)}}><summary>{experiment.title} · {experiment.attempts.length} tentativas · {experiment.decisions.length?'com comparação registrada':'em investigação'}</summary>{open&&<ExperimentDetail record={record} experiment={experiment} mutate={mutate} busy={busy}/>}</details>
}
