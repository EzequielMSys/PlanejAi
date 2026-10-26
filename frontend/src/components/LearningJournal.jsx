import DeskPin from './DeskPin'
import { Link } from 'react-router-dom'
import { useEffect, useId, useRef, useState } from 'react'
import journal from '../services/learningJournalService'
import { currentUser, scopedCacheKey } from '../utils/offlineStore'
import { downloadTextCopy } from '../utils/downloadTextCopy'
import { readJournalDraft, keepJournalDraft, clearJournalDraft } from '../utils/journalDrafts'
import './LearningJournal.css'

const labels = {explicacao:'Explicação',tentativa:'Tentativa',anotacao:'Anotação vinculada',exemplo:'Exemplo / referência',resolucao:'O que fez a diferença',reabertura:'Dúvida reaberta'}
const date = value => new Date(String(value).replace(' ','T')).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})
const message = error => error?.response?.data?.message || 'O servidor não confirmou o salvamento. Seu texto continua aqui para tentar novamente.'
const key = () => window.crypto.randomUUID?.().replaceAll('-','') || Array.from(window.crypto.getRandomValues(new Uint8Array(16)),byte=>byte.toString(16).padStart(2,'0')).join('')

// Drafts are device/account scoped, never automatically sent or treated as cloud saves.
function JournalEditor({record, tipo, content, notes, onSaved}) {
  const owner = currentUser()
  const storageKey = scopedCacheKey(`journal-draft:${record?.id || `new:${tipo}:${content?.id_conteudo || 'livre'}`}`)
  const uid = useId()
  const initial = useRef(null)
  if (!initial.current) {
    initial.current = readJournalDraft(storageKey)
    if (!initial.current || typeof initial.current.texto !== 'string') initial.current = {titulo:content?.titulo || '',texto:'',tipo:record?.resolvido ? 'reabertura' : tipo === 'explicacao' ? 'explicacao' : 'tentativa',chave:key()}
  }
  const [draft,setDraft] = useState(initial.current)
  const [local,setLocal] = useState(true)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const saving = useRef(false)
  const dirty = Boolean(draft.texto || (!record && draft.titulo && draft.titulo!==content?.titulo))
  useEffect(()=>{
    const prevent = event => { if(dirty && !local) { event.preventDefault(); event.returnValue='' } }
    window.addEventListener('beforeunload',prevent)
    return ()=>window.removeEventListener('beforeunload',prevent)
  },[dirty,local])
  function update(changes) {
    const next = {...draft,...changes,idConteudo:record?.id_conteudo || content?.id_conteudo || null,chave:key()}
    setDraft(next);setError('')
    setLocal(keepJournalDraft(storageKey,next))
  }
  function discard() {
    if (!window.confirm('Descartar este rascunho deste aparelho?')) return
    clearJournalDraft(storageKey)
    setDraft({titulo:content?.titulo || '',texto:'',tipo:record?.resolvido ? 'reabertura' : tipo==='explicacao'?'explicacao':'tentativa',chave:key()});setError('')
  }
  function copyNotes() {
    const combined = `${draft.texto}${draft.texto?'\n\n':''}${notes}`
    if(combined.length>4000) {setError('As anotações ultrapassam o limite deste registro. Copie e cole somente o trecho que quer vincular.');return}
    update({texto:combined,tipo:record?'anotacao':draft.tipo})
  }
  async function save(event) {
    event.preventDefault()
    if(saving.current) return
    saving.current=true;setBusy(true);setError('')
    try {
      const result = await journal.save(record?.id,{...draft,...(!record ? {tipo,idConteudo:content?.id_conteudo || null} : {})})
      if(owner !== currentUser()) return
      if(!result?.salvo) throw Error('unconfirmed')
      clearJournalDraft(storageKey)
      setDraft({...draft,texto:'',chave:key()})
      onSaved(result.id)
    } catch(error) { if(owner===currentUser()) setError(message(error)) }
    finally { saving.current=false;setBusy(false) }
  }
  return <form className="journal-editor" onSubmit={save}>
    <h3>{!record ? tipo==='explicacao'?'Explique com suas palavras.':'Que dúvida você quer acompanhar?' : tipo==='explicacao'?'Tente explicar novamente, sem consultar.':record.resolvido?'O que ainda precisa ser investigado?':'Qual foi seu próximo passo?'}</h3>
    <p>{tipo==='explicacao' ? 'Escreva uma ideia curta e um exemplo. Cada envio preserva uma versão; a retomada é sugerida após três dias.' : 'Registre a dificuldade e, a cada tentativa, o que você experimentou. Você decide quando ela foi resolvida.'}</p>
    {!record && <label htmlFor={`${uid}-title`}>Assunto<input id={`${uid}-title`} required maxLength={160} value={draft.titulo} disabled={busy} onChange={e=>update({titulo:e.target.value})} placeholder="Ex.: Força e velocidade"/></label>}
    {record?.tipo==='duvida' && !record.resolvido && <label htmlFor={`${uid}-type`}>Tipo de passo<select id={`${uid}-type`} value={draft.tipo} disabled={busy} onChange={e=>update({tipo:e.target.value})}>{['tentativa','anotacao','exemplo','resolucao'].map(value=><option key={value} value={value}>{labels[value]}</option>)}</select></label>}
    <label htmlFor={`${uid}-text`}>{draft.tipo==='resolucao'?'O que fez a diferença para você entender?':tipo==='explicacao'?'Minha explicação':'Meu registro'}<textarea id={`${uid}-text`} required maxLength={4000} rows={6} value={draft.texto} disabled={busy} onChange={e=>update({texto:e.target.value})} placeholder={tipo==='explicacao'?'O que entendi, por que funciona e um exemplo meu…':'Ainda confundo… Tentei… Meu próximo passo será…'}/></label>
    {notes && tipo==='duvida' && !record?.resolvido && <button type="button" disabled={busy} onClick={copyNotes}>Copiar minhas anotações para revisar antes de salvar</button>}
    <small>{draft.texto.length}/4000 · {dirty ? local ? 'Rascunho neste aparelho; ainda não enviado à conta.' : 'Sem cópia local: mantenha esta página aberta e baixe seu texto.' : 'Nada é enviado à Lumi ao salvar.'}</small>
    {error && <p role="alert" className="journal-error">{error}</p>}
    <div className="journal-actions"><button type="submit" disabled={busy || !draft.texto.trim() || (!record && !draft.titulo.trim())}>{busy?'Confirmando…':draft.tipo==='resolucao'?'Salvar e marcar como resolvida':record?.resolvido?'Salvar e reabrir dúvida':'Salvar na minha conta'}</button>{dirty && <><button type="button" disabled={busy} onClick={()=>downloadTextCopy(`${draft.titulo}\n\n${draft.texto}`,'planejai-rascunho.txt')}>Baixar rascunho</button><button type="button" disabled={busy} onClick={discard}>Descartar rascunho</button></>}</div>
  </form>
}

function JournalDetail({id,onBack,onChanged,notes}) {
  const [record,setRecord] = useState(null)
  const [error,setError] = useState('')
  const [revision,setRevision] = useState(0)
  const [history,setHistory] = useState(false)
  const [selected,setSelected] = useState([])
  const [feedback,setFeedback] = useState('')
  const [busy,setBusy] = useState(false)
  const [saved,setSaved] = useState(false)
  const [olderBusy,setOlderBusy] = useState(false)
  const request = useRef(false)
  const owner = currentUser()
  useEffect(()=>{
    const abort = new window.AbortController()
    setError('')
    journal.detail(id,undefined,abort.signal).then(value=>{if(owner===currentUser())setRecord(value)}).catch(error=>{if(!abort.signal.aborted)setError(message(error))})
    return ()=>abort.abort()
  },[id,revision,owner])
  async function older() {
    setOlderBusy(true);setError('')
    try { const result=await journal.detail(id,record.passos[0]?.id);if(owner===currentUser())setRecord(value=>({...value,mais:result.mais,passos:[...result.passos,...value.passos]})) }
    catch(error){setError(message(error))}finally{setOlderBusy(false)}
  }
  async function assist() {
    if(request.current)return
    request.current=true;setBusy(true);setError('');setFeedback('')
    try {const result=await journal.assist(id,selected);if(owner===currentUser())setFeedback(result.resposta)}
    catch(error){if(owner===currentUser())setError(message(error))}finally{request.current=false;setBusy(false)}
  }
  async function remove() {
    if (!window.confirm('Excluir este registro e todas as suas versões da conta? Esta ação não pode ser desfeita.')) return
    if(request.current)return
    request.current=true;setBusy(true)
    try {await journal.remove(id);if(owner===currentUser()){onChanged();onBack()}}
    catch(error){setError(message(error))}finally{request.current=false;setBusy(false)}
  }
  if(!record)return <div><button type="button" onClick={onBack}>← Voltar aos registros</button>{error?<p role="alert">{error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button></p>:<p role="status">Buscando suas versões…</p>}</div>
  const visible = history || record.tipo==='duvida'
  return <article className="journal-detail">
    <button type="button" onClick={onBack}>← Voltar aos registros</button><header><span className="pj-eyebrow">{record.tipo==='explicacao'?'MINHAS PALAVRAS':'CAMINHO DA DÚVIDA'}</span><h2>{record.titulo}</h2><p>{record.tipo==='duvida'?(record.resolvido?'Resolvida por você · pode ser reaberta':'Em investigação'):'Uma versão preservada a cada tentativa.'}</p></header>
    {record.tipo==='duvida'&&<DeskPin type="duvida" id={record.id}/>}
    {record.passos.length>0&&<Link to="/como-aprendo" state={{subject:record.titulo,source:{type:'diario',record:record.passos.at(-1).id}}}>Registrar uma estratégia que experimentei neste caminho →</Link>}
    {saved && <p role="status" className="journal-confirmed">Registro confirmado na sua conta.</p>}
    <JournalEditor key={`${record.id}:${record.resolvido}:${revision}`} record={record} tipo={record.tipo} notes={notes} onSaved={()=>{setRevision(n=>n+1);setHistory(true);setSelected([]);setFeedback('');setSaved(true);onChanged()}}/>
    {record.tipo==='explicacao' && <button type="button" aria-expanded={history} onClick={()=>setHistory(value=>!value)}>{history?'Ocultar versões anteriores':'Consultar versões anteriores / comparar'}</button>}
    {visible && <section className="journal-history" aria-label="Histórico do registro"><h3>{record.tipo==='explicacao'?'Suas versões, lado a lado.':'O caminho que você percorreu.'}</h3><p>Os textos originais são preservados. Selecione até quatro trechos para compartilhar com a Lumi.</p>{record.mais && <button type="button" disabled={olderBusy} onClick={older}>{olderBusy?'Carregando…':'Carregar registros anteriores'}</button>}
      <div className={record.tipo==='explicacao'?'journal-versions':'journal-timeline'}>{record.passos?.map(step=><article key={step.id} className="journal-step"><label><input type="checkbox" checked={selected.includes(step.id)} disabled={busy || (!selected.includes(step.id) && selected.length>=4)} onChange={event=>{setSelected(value=>event.target.checked?[...value,step.id]:value.filter(n=>n!==step.id));setFeedback('')}}/>Compartilhar este trecho com a Lumi</label><h4>{labels[step.tipo]}</h4><time>{date(step.criado_em)}</time><p>{step.texto}</p></article>)}</div>
      <aside className="journal-lumi"><h3>Outro olhar da Lumi.</h3><p>Serão enviados somente os {selected.length} trechos marcados, com tipo e data. Seu perfil, anotações não escolhidas e chat geral ficam fora desta consulta.</p><button type="button" disabled={busy || selected.length<(record.tipo==='explicacao'?2:1)} onClick={assist}>{busy?'Consultando…':record.tipo==='explicacao'?'Comparar trechos com a Lumi':'Investigar trechos com a Lumi'}</button><small>Até 20 consultas por dia. A resposta é uma sugestão, pode conter erros e não é salva no histórico. Você pode baixar uma cópia.</small>{feedback && <div role="status"><p className="journal-feedback">{feedback}</p><button type="button" onClick={()=>downloadTextCopy(feedback,'lumi-reflexao.txt')}>Baixar resposta</button></div>}</aside>
    </section>}
    {error && <p role="alert" className="journal-error">{error}</p>}
    <button type="button" className="journal-delete" disabled={busy} onClick={remove}>Excluir este registro e seu histórico</button>
  </article>
}

export default function LearningJournal({content,notes,embedded=false,initialRegistro,initialTipo}) {
  const [opened,setOpened] = useState(!embedded)
  const [tipo,setTipo] = useState(initialTipo==='duvida'?'duvida':'explicacao')
  const [page,setPage] = useState(1)
  const [list,setList] = useState(null)
  const [error,setError] = useState('')
  const [selected,setSelected] = useState(Number.isSafeInteger(Number(initialRegistro)) && Number(initialRegistro)>0?Number(initialRegistro):null)
  const [creating,setCreating] = useState(false)
  const [revision,setRevision] = useState(0)
  const owner = currentUser()
  useEffect(()=>{
    if(!opened)return
    const abort=new window.AbortController()
    setList(null);setError('')
    journal.list({tipo,pagina:page,idConteudo:content?.id_conteudo},abort.signal).then(value=>{if(owner===currentUser()){if(!Array.isArray(value?.itens))throw Error('invalid');setList(value)}}).catch(error=>{if(!abort.signal.aborted)setError(message(error))})
    return ()=>abort.abort()
  },[opened,tipo,page,revision,content?.id_conteudo,owner])
  return <section className={`learning-journal${embedded?' journal-embedded pj-panel':''}`} aria-label="Minhas palavras e dúvidas">
    <header className="journal-heading"><div><span className="pj-eyebrow">DA IDEIA AO ENTENDIMENTO</span><h2>O que mudou no seu jeito de entender?</h2><p>Preserve suas explicações. Transforme uma dúvida em um caminho que você pode retomar.</p></div>{embedded && <button type="button" aria-expanded={opened} onClick={()=>setOpened(value=>!value)}>{opened?'Recolher registros':'Explicar ou registrar uma dúvida'}</button>}</header>
    <div hidden={!opened}>{opened && <><nav className="journal-tabs" aria-label="Tipos de registro">{[['explicacao','Minhas palavras'],['duvida','Caminhos das dúvidas']].map(([value,label])=><button key={value} type="button" aria-pressed={tipo===value} onClick={()=>{setTipo(value);setPage(1);setSelected(null);setCreating(false)}}>{label}</button>)}</nav>
      {selected ? <JournalDetail key={selected} id={selected} notes={notes} onBack={()=>setSelected(null)} onChanged={()=>setRevision(n=>n+1)}/> : <>
        <button type="button" aria-expanded={creating} onClick={()=>setCreating(value=>!value)}>{creating?'Recolher rascunho':tipo==='explicacao'?'+ Escrever uma explicação':'+ Acompanhar uma dúvida'}</button>
        {creating && <JournalEditor key={`${tipo}:${content?.id_conteudo || 'livre'}`} tipo={tipo} content={content} notes={notes} onSaved={id=>{setSelected(id);setCreating(false);setRevision(n=>n+1)}}/>}
        {error?<p role="alert">{error} <button type="button" onClick={()=>setRevision(n=>n+1)}>Tentar novamente</button></p>:!list?<p role="status">Consultando seus registros…</p>:<>
          {!list.itens.length && <div className="journal-empty"><h3>{tipo==='explicacao'?'Seu entendimento merece um registro.':'Uma dúvida pode abrir um caminho.'}</h3><p>{tipo==='explicacao'?'Comece com uma explicação curta. Daqui a alguns dias, você poderá escrever outra versão e perceber o que mudou.':'Anote o que ainda confunde. Vincule exemplos e tentativas, depois registre o que fez a diferença.'}</p></div>}
          <div className="journal-list">{list.itens.map(item=><article key={item.id}><div><span>{item.disciplina || 'Meu estudo'} · {date(item.atualizado_em)}</span><h3>{item.titulo}</h3><p>{tipo==='duvida'?(item.resolvido?'Resolvida por você':'Em investigação'):`${item.versoes} ${Number(item.versoes)===1?'versão':'versões'} · ${item.retomar?'Hora de explicar novamente':'Retomada sugerida três dias após a última versão'}`}</p></div><button type="button" onClick={()=>setSelected(item.id)}>{tipo==='explicacao'?'Explicar novamente':'Retomar dúvida'} <span aria-hidden="true">↗</span><span className="sr-only"> {item.titulo}</span></button></article>)}</div>
          <nav className="journal-pagination" aria-label="Páginas do diário"><button type="button" disabled={page===1} onClick={()=>setPage(n=>n-1)}>Anterior</button><span>Página {page}</span><button type="button" disabled={!list.mais} onClick={()=>setPage(n=>n+1)}>Próxima</button></nav>
        </>}
      </>}
    </>}</div>
  </section>
}
