import {useEffect,useId,useMemo,useRef,useState} from 'react'
import memory,{newRecordKey} from '../services/studyMemoryService'
import {currentUser} from '../utils/offlineStore'
import SaveFeedback from './SaveFeedback'
import './LumiConversations.css'

const payload=(objetivo,snapshot)=>({objetivo:objetivo.trim(),materia:snapshot.materia||'',itens:snapshot.itens.map(({tipo,titulo,texto})=>({tipo,titulo,texto})),mensagens:snapshot.mensagens.filter(item=>['user','assistant'].includes(item.role)).map(({role,content})=>({role,content}))})
export default function LumiConversations({snapshot,onRestore,busy,draftMessage='',requestedId}){
  const uid=useId(),owner=useRef(currentUser()).current,key=useRef(newRecordKey()),saving=useRef(false),request=useRef(0)
  const [expanded,setExpanded]=useState(false),[title,setTitle]=useState(''),[current,setCurrent]=useState(null),[status,setStatus]=useState('ready'),[error,setError]=useState(''),[lastSaved,setLastSaved]=useState(''),[rows,setRows]=useState(null),[more,setMore]=useState(false),[page,setPage]=useState(1),[archived,setArchived]=useState(false),[pending,setPending]=useState(null),[listing,setListing]=useState(false)
  const serialized=useMemo(()=>JSON.stringify(payload(title,snapshot)),[title,snapshot.materia,snapshot.itens,snapshot.mensagens]),dirty=lastSaved&&serialized!==lastSaved
  useEffect(()=>{if(!requestedId)return;const controller=new window.AbortController();setExpanded(true);setListing(true);setError('');memory.conversation(requestedId,controller.signal).then(record=>{if(!controller.signal.aborted&&owner===currentUser()){if(Number(record?.arquivado)||!Array.isArray(record?.mensagens)||!Array.isArray(record?.itens))throw Error('unavailable');setPending(record)}}).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setError('Não foi possível abrir essa conversa. Ela pode ter sido arquivada ou seu acesso mudou.')}).finally(()=>{if(!controller.signal.aborted)setListing(false)});return()=>controller.abort()},[requestedId,owner])
  async function list(nextPage=1,archive=archived){
    const id=++request.current;setListing(true);setError('')
    try{const result=await memory.conversations(nextPage,archive);if(id!==request.current||owner!==currentUser())return;if(!Array.isArray(result?.itens))throw Error('invalid');setRows(old=>nextPage===1?result.itens:[...(old||[]),...result.itens]);setMore(result.mais);setPage(nextPage);setArchived(archive)}catch{if(id===request.current)setError('Não foi possível consultar suas conversas. A conversa aberta continua nesta tela.')}
    finally{if(id===request.current)setListing(false)}
  }
  async function save(copy=false){
    if(saving.current||busy||owner!==currentUser())return
    if(title.trim().length<3){setError('Dê um objetivo com pelo menos 3 caracteres para guardar a conversa.');return}
    saving.current=true;setStatus('saving');setError('');const data=payload(title,snapshot);if(copy)key.current=newRecordKey()
    try{const result=await memory.saveConversation({...data,chave:key.current,...(!copy&&current?{versao:current.versao}:{})},!copy?current?.id:undefined,owner);if(owner!==currentUser())return;if(!result?.salvo)throw Error('unconfirmed');setCurrent({id:result.id,versao:result.versao});setLastSaved(JSON.stringify(data));setStatus('saved');if(rows)list(1)}
    catch(failure){if(owner===currentUser()){setStatus('error');setError(failure.response?.data?.message||'Não foi possível confirmar a conversa na conta. Suas mensagens continuam aqui para tentar novamente.')}}finally{saving.current=false}
  }
  async function open(id){if(busy||saving.current)return;setListing(true);setError('');try{const record=await memory.conversation(id);if(!Array.isArray(record?.mensagens)||!Array.isArray(record?.itens))throw Error('invalid');if(owner===currentUser())setPending(record)}catch{setError('Não foi possível abrir essa conversa. Confira o acesso ou tente novamente.')}finally{setListing(false)}}
  function restore(){
    if(!pending||busy||saving.current||owner!==currentUser())return
    if((draftMessage.trim()||(snapshot.mensagens.length&&(!lastSaved||dirty)))&&!window.confirm('Trocar a conversa desta tela? Guarde suas alterações antes de continuar se quiser retomá-las depois.'))return
    setTitle(pending.objetivo);setCurrent({id:pending.id,versao:pending.versao});setLastSaved(JSON.stringify(payload(pending.objetivo,pending)));setStatus('saved');setError('');key.current=newRecordKey();onRestore(pending);setPending(null);setExpanded(false)
  }
  async function archive(row){if(busy||saving.current)return;saving.current=true;setListing(true);setError('');try{await memory.archive('conversation',row.id,row.versao,!archived,owner);if(owner===currentUser()){if(current?.id===row.id){setCurrent(null);setLastSaved('');setStatus('ready');key.current=newRecordKey()}await list(1)}}catch(failure){setError(failure.response?.data?.message||'Não foi possível alterar o arquivo. A conversa continua preservada.')}finally{saving.current=false;setListing(false)}}
  return <details className="lumi-conversations" open={expanded}><summary onClick={event=>{event.preventDefault();setExpanded(value=>!value)}}>Conversas por objetivo <span>{current?title||'Conversa guardada':'Organizar e retomar'}</span>{dirty&&<small> · Alterações pendentes</small>}</summary><div>
    <p>Guarde esta conversa por objetivo para retomá-la depois. A lista não consulta a Lumi.</p>
    <label htmlFor={`${uid}-title`}>Objetivo desta conversa<input id={`${uid}-title`} maxLength={100} value={title} disabled={busy||status==='saving'} onChange={event=>setTitle(event.target.value)} placeholder="Ex.: Entender as leis de Newton"/></label>
    <div className="lumi-conversation-actions"><button type="button" disabled={busy||status==='saving'||!snapshot.mensagens.length} onClick={()=>save()}>{status==='saving'?'Salvando…':current?'Salvar alterações da conversa':'Guardar conversa por objetivo'}</button>{(current||status==='error')&&<button type="button" disabled={busy||status==='saving'} onClick={()=>save(true)}>Salvar como outra conversa</button>}</div>
    {status!=='ready'&&<SaveFeedback status={error?'error':status==='saved'&&dirty?'pending':status} message={error||((status==='saved'&&dirty)?'Há alterações nesta conversa que ainda não foram guardadas por objetivo.':undefined)} onRetry={status==='error'?()=>save():undefined}/>}
    {error&&status==='ready'&&<p role="alert">{error}</p>}
    <button type="button" disabled={busy||listing||status==='saving'} onClick={()=>list(1)}>{listing?'Consultando…':'Consultar conversas guardadas'}</button>
    {rows&&<><button type="button" disabled={busy||listing} onClick={()=>list(1,!archived)}>{archived?'Ver conversas ativas':'Ver conversas arquivadas'}</button>{!rows.length&&<p>Nenhuma conversa {archived?'arquivada':'guardada'} nesta lista.</p>}{rows.map(row=><article key={row.id}><strong>{row.objetivo}</strong><small>{row.total} mensagens{row.materia?` · ${row.materia}`:''}</small><div>{!archived&&<button type="button" disabled={busy||listing} onClick={()=>open(row.id)}>Conferir antes de retomar</button>}<button type="button" disabled={busy||listing} onClick={()=>archive(row)}>{archived?'Restaurar conversa':'Arquivar conversa'}</button></div></article>)}{more&&<button type="button" disabled={listing||busy} onClick={()=>list(page+1)}>Carregar mais conversas</button>}</>}
    {pending&&<section className="lumi-conversation-preview" aria-label="Contexto da conversa a retomar"><h3>{pending.objetivo}</h3><p>{pending.mensagens.length} mensagens serão abertas nesta tela. Ao enviar uma nova mensagem, a Lumi usará até as 12 mais recentes e os itens abaixo.</p><strong>Matéria: {pending.materia||'Nenhuma'}</strong>{pending.itens.map((item,index)=><blockquote key={index}><strong>{item.titulo}</strong><p>{item.texto}</p></blockquote>)}{!pending.itens.length&&<p>Nenhum registro adicional guardado.</p>}<button type="button" disabled={busy} onClick={restore}>Retomar com este contexto</button><button type="button" onClick={()=>setPending(null)}>Cancelar retomada</button></section>}
  </div></details>
}
