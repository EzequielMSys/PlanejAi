import { useEffect, useState } from 'react'
import useStudyDraft from '../hooks/useStudyDraft'
import service from '../services/guidedStudyService'
import { currentUser } from '../utils/offlineStore'
import { pathError } from '../hooks/usePersonalPath'
import { pathDay, pathDate } from './PersonalPathTools'
import RecordCopy from './RecordCopy'
import './LearningExperiments.css'

function Text({ label, value, onChange, max = 1600, required = true }) {
  return <label>{label}<textarea required={required} maxLength={max} value={value} onChange={e => onChange(e.target.value)} /></label>
}
function DefenceCreate({ record, mutate, busy }) {
  const [open, setOpen] = useState(false)
  const productions = record.entries.filter(e => e.type === 'producao')
  const [draft, update, clear, safe] = useStudyDraft(`defence-create-${record.id}`, { key: window.crypto.randomUUID(), production: '', excerpt: '', claim: '', sources: [] })
  const production = productions.find(e => e.id === draft.production)
  return <details className="defence-create" onToggle={e => { if(e.currentTarget.open)setOpen(true) }}><summary>Escolher uma conclusão minha para aprofundar</summary>
    {open && (!productions.length ? <p>Guarde primeiro uma produção própria no marco “Produzir e revisar a conclusão”. Depois escolha um trecho para esta conversa.</p> : <form className="guided-form" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'defenceCreate', ...draft })) clear() }}><fieldset disabled={busy}>
      <legend>Afirmação, trecho e evidências que quero examinar</legend>
      <label>Produção de origem<select required value={draft.production} onChange={e => update({ ...draft, production: e.target.value, excerpt: '', sources: [] })}><option value="">Escolha uma produção própria</option>{productions.map(e => <option key={e.id} value={e.id}>{pathDate(e.created)} · {e.text.slice(0,90)}</option>)}</select></label>
      {production && <details><summary>Conferir minha produção original</summary><p className="defence-original">{production.text}</p></details>}
      <Text label="Trecho exato que escolho da produção" max={3000} value={draft.excerpt} onChange={excerpt => update({ ...draft, excerpt })} />
      <Text label="Afirmação que quero defender ou rever" max={1500} value={draft.claim} onChange={claim => update({ ...draft, claim })} />
      <fieldset><legend>Referências que escolho compartilhar (até cinco)</legend>{record.sources.length ? record.sources.map(s => <label className="guided-check" key={s.id}><input type="checkbox" checked={draft.sources.includes(s.id)} disabled={!draft.sources.includes(s.id) && draft.sources.length >= 5} onChange={() => update({ ...draft, sources: draft.sources.includes(s.id) ? draft.sources.filter(id => id !== s.id) : [...draft.sources, s.id] })} />{s.origin} — {s.purpose}</label>) : <p>Não há fontes cadastradas. É possível examinar o raciocínio, mas a Lumi deverá indicar essa limitação.</p>}</fieldset>
      <p>Guardar esta seleção não envia nada à Lumi. Você verá o contexto e confirmará cada pedido de pergunta ou pista.</p><button disabled={!production}>Preparar minha mesa de argumentação</button><small>{safe ? 'Rascunho preservado neste aparelho.' : 'Mantenha a página aberta para preservar o rascunho.'}</small>
    </fieldset></form>)}
  </details>
}
function Respond({ defence, turn, mutate, busy }) {
  const [draft, update, clear] = useStudyDraft(`defence-answer-${defence.id}-${turn.id}`, { key: window.crypto.randomUUID(), responseType: 'responder', text: '' })
  return <form className="guided-form defence-response" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'defenceRespond', defence: defence.id, turn: turn.id, ...draft })) clear() }}><fieldset disabled={busy}>
    <legend>Como quero continuar</legend><label>Minha escolha<select value={draft.responseType} onChange={e => update({ ...draft, responseType: e.target.value })}><option value="responder">Responder com meu raciocínio</option><option value="contestar">Contestar a pergunta ou seu pressuposto</option><option value="pular">Seguir sem responder esta pergunta</option></select></label>
    <Text label={draft.responseType === 'contestar' ? 'Por que discordo da pergunta' : 'Minha resposta ou observação'} max={3000} required={draft.responseType !== 'pular'} value={draft.text} onChange={text => update({ ...draft, text })} />
    <button>Guardar minha escolha nesta conversa</button><small>Sua resposta fica salva. Nenhum novo pedido é enviado automaticamente à Lumi.</small>
  </fieldset></form>
}
function DefenceLumi({ record, defence, mutate, busy }) {
  const [preview, setPreview] = useState(null), [error, setError] = useState(''), [asking, setAsking] = useState(false), [consent, setConsent] = useState(false)
  const owner = currentUser(), last = defence.turns.at(-1), pending = last && !last.events.length
  useEffect(() => { setPreview(null); setConsent(false) }, [record.version])
  async function ask(request) {
    setAsking(true); setError(''); setPreview(null)
    try { const result = await service.investigate(record.id, { mode: 'defence', attempts: [defence.id], request }); if (owner === currentUser()) setPreview({ ...result, request, key: window.crypto.randomUUID() }) }
    catch (e) { if (owner === currentUser()) setError(pathError(e)) }
    finally { if (owner === currentUser()) setAsking(false) }
  }
  if (defence.status !== 'aberta') return null
  return <section className="defence-lumi"><details><summary>Conferir exatamente o contexto desta conversa</summary><div className="path-context">
    <h4>Afirmação atual</h4><p>{defence.revisions.at(-1)?.claim || defence.claim}</p><h4>Trecho original selecionado</h4><p>{defence.excerpt}</p><h4>Referências escolhidas</h4>{defence.sources.length ? defence.sources.map(s => <article key={s.id}><strong>{s.origin}</strong><p>{s.purpose}</p><p>Limites: {s.limits || '(não preenchidos)'}</p>{s.url && <p>{s.url}</p>}</article>) : <p>Nenhuma referência selecionada.</p>}
    <h4>Perguntas, pistas e respostas já guardadas nesta conversa</h4>{defence.turns.length ? defence.turns.map(t => <article key={t.id}><p>{t.question}</p>{t.hints.map(h => <p key={h.id}>Pista: {h.text}</p>)}{t.events.map(e => <p key={e.id}>{e.type}: {e.text || '(sem resposta)'}</p>)}</article>) : <p>Ainda não há mensagens anteriores.</p>}
  </div></details><fieldset disabled={busy || asking}><legend>Uma pergunta de cada vez</legend><p>Serão enviados apenas a afirmação atual, o trecho original, as referências selecionadas e as perguntas, pistas e respostas desta conversa. Outros registros e fontes completas não são consultados.</p>
    <label className="guided-check"><input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setPreview(null) }} />Conferi o contexto e quero compartilhá-lo neste pedido</label>
    <div className="guided-actions"><button disabled={!consent || Boolean(pending) || defence.turns.length >= 8} onClick={() => ask('question')}>{asking ? 'Lumi está preparando a orientação…' : defence.turns.length ? 'Pedir a próxima pergunta' : 'Pedir a primeira pergunta'}</button>{pending && <button disabled={!consent || last.hints.length >= 2} onClick={() => ask('hint')}>Pedir uma pista para esta pergunta</button>}</div>
    <small>{pending ? 'Responda, conteste ou pule a pergunta atual antes de pedir outra. Você pode encerrar quando quiser.' : 'Até oito perguntas por conversa. As orientações podem conter erros e não equivalem a uma avaliação de domínio.'}</small>
  </fieldset>{error && <p role="alert">{error}</p>}{preview && <aside className="defence-preview"><h4>{preview.request === 'hint' ? 'Pista ainda não guardada' : 'Pergunta ainda não guardada'}</h4><p>{preview.feedback.pergunta}</p>{preview.request === 'question' && <><p><strong>O que o trecho apresenta:</strong> {preview.feedback.claro}</p><p><strong>O que pede investigação:</strong> {preview.feedback.lacuna}</p></>}<p><strong>Limites:</strong> {preview.feedback.incerteza}</p><button disabled={busy} onClick={async () => { if (await mutate({ action: 'defenceQuestion', key: preview.key, receipt: preview.receipt })) setPreview(null) }}>Guardar {preview.request === 'hint' ? 'pista' : 'pergunta'} nesta conversa</button><button onClick={() => setPreview(null)}>Descartar orientação</button></aside>}</section>
}
function Revision({ record, defence, mutate, busy }) {
  const previous = record.entries.find(e => e.id === (defence.revisions.at(-1)?.entry || defence.production))
  const [draft, update, clear] = useStudyDraft(`defence-revise-${defence.id}-${defence.revisions.length}`, { key: window.crypto.randomUUID(), text: previous?.text || '', claim: defence.revisions.at(-1)?.claim || defence.claim, reason: '' })
  return <details><summary>Rever minha conclusão e preservar a versão anterior</summary><form className="guided-form" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'defenceRevise', defence: defence.id, ...draft })) clear() }}><fieldset disabled={busy || defence.status !== 'aberta'}>
    <legend>Uma nova versão, escrita por mim</legend><Text label="Minha produção revisada" max={6000} value={draft.text} onChange={text => update({ ...draft, text })} /><Text label="Afirmação que quero examinar daqui em diante" max={1500} value={draft.claim} onChange={claim => update({ ...draft, claim })} /><Text label="O que me fez rever a conclusão" value={draft.reason} onChange={reason => update({ ...draft, reason })} />
    <p>A produção revisada será guardada no projeto. Na conversa, somente a afirmação atualizada e o trecho original serão compartilhados, junto ao histórico que você conferir.</p><button>Guardar minha versão e o motivo da mudança</button>
  </fieldset></form></details>
}
function NextStep({ record, defence, mutate, busy }) {
  const [draft, update, clear] = useStudyDraft(`defence-next-${defence.id}`, { key: window.crypto.randomUUID(), title: '', reason: '', date: pathDay(), minutes: Math.min(20, record.minutes), stage: 'analise' })
  return <details><summary>Transformar uma lacuna em próximo passo da investigação</summary><form className="guided-form" onSubmit={async e => { e.preventDefault(); if (await mutate({ action: 'projectNext', ...draft })) clear() }}><fieldset disabled={busy || record.status !== 'ativo'}>
    <legend>Conferir antes de levar para Hoje</legend>{record.next && <p>Esta ação substituirá “{record.next.title}”. A anterior ficará no histórico.</p>}{record.status !== 'ativo' && <p>Retome o projeto para escolher uma ação em Hoje.</p>}
    <label>Ação que escolho realizar<input required maxLength={180} value={draft.title} onChange={e => update({ ...draft, title: e.target.value })} /></label><Text label="Por que este passo responde à lacuna" max={1000} value={draft.reason} onChange={reason => update({ ...draft, reason })} />
    <div className="guided-grid"><label>Data escolhida<input required type="date" min={pathDay()} max={record.deadline || undefined} value={draft.date} onChange={e => update({ ...draft, date: e.target.value })} /></label><label>Minutos previstos<input required type="number" min="5" max={Math.min(90, record.minutes)} value={draft.minutes} onChange={e => update({ ...draft, minutes: Number(e.target.value) })} /></label></div>
    <button>Confirmar este próximo passo na minha rotina</button>
  </fieldset></form></details>
}
function DefenceDetail({ record, defence, mutate, busy }) {
  const [closing, updateClosing] = useStudyDraft(`defence-close-${defence.id}`, { key: window.crypto.randomUUID(), reflection: '' })
  const production = record.entries.find(e => e.id === (defence.revisions.at(-1)?.entry || defence.production))
  const latest = defence.turns.at(-1)
  return <article className="conclusion-defence"><header><span className="pj-eyebrow">{defence.status === 'aberta' ? 'CONVERSA ABERTA' : 'CONVERSA ENCERRADA'} · {pathDate(defence.created)}</span><h3>{defence.revisions.at(-1)?.claim || defence.claim}</h3><p className="defence-original">{defence.excerpt}</p><p>Trecho original preservado · {defence.sources.length} referências escolhidas · sem nota automática</p></header>
    <ol className="defence-turns">{defence.turns.map((turn, i) => <li key={turn.id}><article><span className="pj-eyebrow">PERGUNTA {i + 1}</span><h4>{turn.question}</h4><p><strong>O que o trecho apresenta:</strong> {turn.supported}</p><p><strong>O que pede investigação:</strong> {turn.investigate}</p><p><strong>Limites da orientação:</strong> {turn.uncertainty}</p>{turn.hints.map(h => <aside key={h.id}><strong>Pista que pedi</strong><p>{h.text}</p><small>{h.uncertainty}</small></aside>)}{turn.events.map(e => <aside className="defence-own-answer" key={e.id}><strong>{e.type === 'responder' ? 'Minha resposta' : e.type === 'contestar' ? 'Minha contestação' : 'Escolhi seguir sem responder'}</strong><p>{e.text}</p></aside>)}{turn === latest && !turn.events.length && defence.status === 'aberta' && <Respond defence={defence} turn={turn} mutate={mutate} busy={busy} />}</article></li>)}</ol>
    <DefenceLumi record={record} defence={defence} mutate={mutate} busy={busy} />
    <Revision key={defence.revisions.length} record={record} defence={defence} mutate={mutate} busy={busy} />
    {defence.revisions.length > 0 && <details><summary>Versões da conclusão e motivos da mudança</summary>{defence.revisions.map((r, i) => <article className="path-version" key={r.id}><h4>Revisão {i + 1} · {pathDate(r.created)}</h4><p>{r.claim}</p><p>{record.entries.find(e => e.id === r.entry)?.text}</p><p><strong>Por que revi:</strong> {r.reason}</p></article>)}</details>}
    {production && <RecordCopy key={production.id} record={record} entry={production} label="Registrar uma dúvida que ficou nesta conversa" draftKey={`-gap-${defence.id}`} initialType="duvida" initialTitle="" initialText="" />}
    <NextStep record={record} defence={defence} mutate={mutate} busy={busy} />
    {defence.status === 'aberta' ? <details><summary>Encerrar a conversa no meu momento</summary><form className="guided-form" onSubmit={async e => { e.preventDefault(); await mutate({ action: 'defenceClose', defence: defence.id, ...closing }) }}><fieldset disabled={busy}><legend>O que levo desta conversa</legend><Text label="Minha reflexão final (opcional)" required={false} value={closing.reflection} onChange={reflection => updateClosing({ ...closing, reflection })} /><p>Encerrar preserva todas as perguntas e respostas. Você não precisa responder à pergunta atual.</p><button>Encerrar e preservar a conversa</button></fieldset></form></details> : <p><strong>Minha reflexão ao encerrar:</strong> {defence.closing?.reflection || 'Encerrei sem acrescentar uma reflexão.'}</p>}
  </article>
}
export default function ConclusionDefence({ record, mutate, busy }) {
  return <section className="conclusion-defences" aria-labelledby="defence-title"><header><span className="pj-eyebrow">AFIRMAÇÃO → EVIDÊNCIAS → PERGUNTAS</span><h2 id="defence-title">Defender e rever uma conclusão.</h2><p>Uma conversa de aprofundamento sobre uma produção sua. A Lumi pergunta; você decide como responder e o que mudar.</p></header><DefenceCreate record={record} mutate={mutate} busy={busy} />{(record.defences || []).map(d => <SavedDefence key={d.id} record={record} defence={d} mutate={mutate} busy={busy}/>)}</section>
}
function SavedDefence({record,defence,mutate,busy}) {
  const [open,setOpen]=useState(false)
  return <details className="defence-saved" onToggle={e=>{if(e.currentTarget.open)setOpen(true)}}><summary>{defence.revisions.at(-1)?.claim||defence.claim} · {defence.turns.length} perguntas · {defence.status==='aberta'?'aberta':'encerrada'}</summary>{open&&<DefenceDetail record={record} defence={defence} mutate={mutate} busy={busy}/>}</details>
}
