import {createContext,useContext,useEffect,useId,useRef,useState} from 'react'
import memory,{newRecordKey} from '../services/studyMemoryService'
import {currentUser,scopedCacheKey} from '../utils/offlineStore'
import {readJournalDraft,keepJournalDraft,clearJournalDraft} from '../utils/journalDrafts'
import SaveFeedback from './SaveFeedback'
import HighlightReview from './HighlightReview'
import './ReadingHighlights.css'

const Highlights=createContext([])
export function ReadingText({text,section}){
  const records=useContext(Highlights),source=String(text||''),matches=[]
  for(const item of records.filter(row=>row.secao===section)){const start=source.indexOf(item.trecho);if(start>=0)matches.push({start,end:start+item.trecho.length,item})}
  matches.sort((a,b)=>a.start-b.start||b.end-a.end)
  let cursor=0;const nodes=[]
  for(const match of matches){if(match.start<cursor)continue;if(match.start>cursor)nodes.push(source.slice(cursor,match.start));nodes.push(<mark key={match.item.id} data-reading-highlight={match.item.id} title={match.item.nota||'Meu destaque'}>{source.slice(match.start,match.end)}</mark>);cursor=match.end}
  if(cursor<source.length)nodes.push(source.slice(cursor))
  return <span data-reading-text="true">{nodes.length?nodes:source}</span>
}
const blank=()=>({trecho:'',secao:'',nota:'',chave:newRecordKey()})
export default function ReadingHighlights({materialKey,title,root,children}){
  const owner=useRef(currentUser()).current,storageKey=useRef(scopedCacheKey(`reading-highlight-draft:${materialKey}`)).current,uid=useId()
  const [draft,setDraft]=useState(()=>{const saved=readJournalDraft(storageKey);return typeof saved?.trecho==='string'&&typeof saved?.nota==='string'&&typeof saved?.chave==='string'?saved:blank()})
  const [records,setRecords]=useState([]),[status,setStatus]=useState('loading'),[error,setError]=useState(''),[candidate,setCandidate]=useState(null),[archived,setArchived]=useState(false),[busy,setBusy]=useState(false),[saveStatus,setSaveStatus]=useState('ready'),[attempt,setAttempt]=useState(0)
  const [expanded,setExpanded]=useState(Boolean(draft.trecho))
  const [selected,setSelected]=useState([]),[reviewSources,setReviewSources]=useState([])
  const saving=useRef(false),editor=useRef(null)
  useEffect(()=>{const abort=new window.AbortController();setStatus('loading');memory.highlights(materialKey,archived,abort.signal).then(value=>{if(!abort.signal.aborted&&owner===currentUser()){if(!Array.isArray(value))throw Error('invalid');setRecords(value);setStatus('ready')}}).catch(()=>{if(!abort.signal.aborted&&owner===currentUser())setStatus('error')});return()=>abort.abort()},[materialKey,archived,attempt,owner])
  useEffect(()=>{
    const select=()=>{const selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return;const range=selection.getRangeAt(0),node=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;const span=node?.closest?.('[data-reading-text]');if(!span||!root.current?.contains(span))return;if(!span.contains(range.endContainer)){setCandidate(null);return}const quote=selection.toString().trim(),section=span.closest('section')?.querySelector('h3')?.textContent;if(quote.length>=3&&quote.length<=1200&&section){setCandidate({trecho:quote,secao:section});setExpanded(true)}else setCandidate(null)}
    document.addEventListener('selectionchange',select);return()=>document.removeEventListener('selectionchange',select)
  },[root])
  function update(next){setExpanded(true);setDraft(next);setError('');setSaveStatus(keepJournalDraft(storageKey,next)?'local':'unsaved')}
  function useSelection(){if(!candidate||saving.current)return;if(draft.trecho&&!window.confirm('Trocar o trecho deste rascunho? A anotação digitada será preservada.'))return;update({...candidate,nota:draft.nota,chave:newRecordKey()});setCandidate(null);window.requestAnimationFrame(()=>{editor.current?.scrollIntoView({block:'center',behavior:'auto'});editor.current?.focus({preventScroll:true})})}
  async function save(){
    if(saving.current||owner!==currentUser())return;saving.current=true;setBusy(true);setError('');setSaveStatus('saving')
    try{const saved=await memory.saveHighlight({...draft,materialKey,titulo:title.slice(0,160)},draft.id,owner);if(owner!==currentUser())return;if(!saved?.salvo)throw Error('unconfirmed');clearJournalDraft(storageKey);setDraft(blank());setCandidate(null);setSaveStatus('saved');setAttempt(value=>value+1)}
    catch(failure){if(owner===currentUser()){setSaveStatus(keepJournalDraft(storageKey,draft)?'error':'unsaved');setError(failure.response?.data?.message||'Não foi possível confirmar o destaque na conta. Seu trecho e anotação continuam aqui.')}}finally{saving.current=false;setBusy(false)}
  }
  function locate(item){const mark=[...(root.current?.querySelectorAll('[data-reading-highlight]')||[])].find(node=>node.getAttribute('data-reading-highlight')===String(item.id));const section=[...(root.current?.querySelectorAll('.study-guide>section')||[])].find(node=>node.querySelector('h3')?.textContent===item.secao);const target=mark||section;if(!target){setError('O material mudou e este trecho não foi localizado. O texto salvo continua disponível abaixo.');return}target.scrollIntoView({block:'center',behavior:'auto'});target.setAttribute('tabindex','-1');target.focus({preventScroll:true})}
  async function archive(item){if(saving.current)return;saving.current=true;setBusy(true);setError('');try{await memory.archive('highlight',item.id,item.versao,!archived,owner);if(owner===currentUser())setAttempt(value=>value+1)}catch(failure){setError(failure.response?.data?.message||'Não foi possível confirmar a alteração. O destaque continua preservado.')}finally{saving.current=false;setBusy(false)}}
  return <Highlights.Provider value={archived?[]:records.filter(item=>!Number(item.arquivado))}>{candidate&&<aside className="reading-selection-action" aria-label="Ações do trecho selecionado"><button type="button" disabled={busy} onClick={useSelection}>Destacar e anotar</button><button type="button" onClick={()=>setCandidate(null)}>Cancelar seleção</button></aside>}<details className="reading-highlights" open={expanded}><summary onClick={event=>{event.preventDefault();setExpanded(value=>!value)}}>Meus destaques e anotações <span>{archived?'Retirados':records.length?`${records.length} neste guia`:''}</span></summary><div>
    <p>Selecione de 3 a 1200 caracteres de um parágrafo ou item do guia e escolha destacar. O trecho e sua anotação ficam na sua conta; nada é enviado à Lumi.</p>
    {candidate&&<div className="highlight-selection"><blockquote>{candidate.trecho}</blockquote><button type="button" disabled={busy} onClick={useSelection}>Destacar trecho selecionado</button></div>}
    {draft.trecho&&<form onSubmit={event=>{event.preventDefault();save()}}><fieldset disabled={busy}><span>{draft.id?'Editar anotação do destaque':'Meu novo destaque'} · {draft.secao}</span><blockquote>{draft.trecho}</blockquote><label htmlFor={`${uid}-note`}>Minha anotação <small>(opcional)</small><textarea ref={editor} id={`${uid}-note`} rows={3} maxLength={4000} value={draft.nota} onChange={event=>update({...draft,nota:event.target.value})}/></label><button type="submit">{busy?'Salvando…':'Salvar destaque e anotação'}</button><button type="button" onClick={()=>{if(window.confirm('Descartar o rascunho deste destaque?')){clearJournalDraft(storageKey);setDraft(blank());setSaveStatus('ready')}}}>Descartar rascunho do destaque</button></fieldset></form>}
    {saveStatus!=='ready'&&<SaveFeedback status={error?'error':saveStatus} message={error||undefined} onRetry={draft.trecho&&['error','unsaved'].includes(saveStatus)?save:undefined}/>}
    {error&&saveStatus==='ready'&&<p role="alert">{error}</p>}
    <button type="button" disabled={busy} onClick={()=>setArchived(value=>!value)}>{archived?'Ver destaques ativos':'Ver destaques retirados'}</button>
    {!archived&&status==='ready'&&!!records.length&&<div className="highlight-review-selection"><p>Escolha até cinco destaques para preparar perguntas. Você poderá editar cada uma antes de salvar.</p>{records.map(item=><label key={item.id}><input type="checkbox" checked={selected.includes(item.id)} disabled={!selected.includes(item.id)&&selected.length>=5} onChange={event=>setSelected(old=>event.target.checked?[...old,item.id]:old.filter(id=>id!==item.id))}/><span>{item.trecho.slice(0,100)}{item.trecho.length>100?'…':''}</span></label>)}<button type="button" disabled={!records.some(item=>selected.includes(item.id))} onClick={()=>setReviewSources(records.filter(item=>selected.includes(item.id)))}>Preparar perguntas dos destaques</button></div>}
    {!!reviewSources.length&&<HighlightReview key={reviewSources.map(item=>item.id).join('-')} sources={reviewSources} onClose={()=>{setReviewSources([]);setSelected([])}}/>}
    {status==='loading'&&<p role="status">Consultando destaques…</p>}{status==='error'&&<p role="alert">Não foi possível consultar seus destaques. <button type="button" onClick={()=>setAttempt(value=>value+1)}>Consultar destaques novamente</button></p>}
    {status==='ready'&&!records.length&&<p>{archived?'Nenhum destaque retirado neste guia.':'Nenhum destaque salvo neste guia ainda.'}</p>}
    {records.map(item=><article key={item.id}><small>{item.secao}</small><blockquote>{item.trecho}</blockquote>{item.nota&&<p className="highlight-note">{item.nota}</p>}<div>{!archived&&<><button type="button" onClick={()=>locate(item)}>Localizar trecho</button><button type="button" disabled={busy} onClick={()=>{if(draft.trecho&&!window.confirm('Trocar o rascunho aberto por esta anotação?'))return;update({id:item.id,versao:item.versao,trecho:item.trecho,secao:item.secao,nota:item.nota,chave:newRecordKey()});editor.current?.focus()}}>Editar anotação</button></>}<button type="button" disabled={busy} onClick={()=>archive(item)}>{archived?'Restaurar destaque':'Retirar destaque'}</button></div></article>)}
  </div></details>{children}</Highlights.Provider>
}
