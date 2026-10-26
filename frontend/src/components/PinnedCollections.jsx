import {useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import cards from '../services/flashcardService'
import {currentUser} from '../utils/offlineStore'

export default function PinnedCollections({collections,onReview,onReordered,disabled}) {
 const owner=useRef(currentUser()).current,lock=useRef(false)
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('')
 const pinned=collections.filter(collection=>Number(collection.fixada)).slice(0,3)
 if(!pinned.length)return null
 async function move(index,delta) {
  if(lock.current||owner!==currentUser())return
  const target=index+delta
  if(target<0||target>=pinned.length)return
  const previous=pinned.map(collection=>Number(collection.id)),desired=[...previous]
  ;[desired[index],desired[target]]=[desired[target],desired[index]]
  lock.current=true;setBusy(true);setError('');setNotice('')
  try {
   const result=await cards.reorder(previous,desired,owner)
   if(!result?.salvo||JSON.stringify(result.ordem)!==JSON.stringify(desired))throw Error('unconfirmed')
   if(owner===currentUser()){setNotice('Ordem das prioridades salva.');onReordered()}
  } catch(failure) {if(owner===currentUser())setError(failure.response?.data?.message||'Não foi possível confirmar a ordem. A lista exibida foi preservada; tente novamente ou atualize as prioridades.')} finally {lock.current=false;setBusy(false)}
 }
 return <section className="today-pinned-collections" aria-label="Coleções prioritárias de Hoje"><h3>Objetivos que você escolheu manter por perto</h3><p>Até três coleções fixadas por você. Use subir e descer para escolher a ordem. Elas continuam aqui nos próximos acessos, até você desafixar.</p><p role="status" className="priority-order-status">{busy?'Salvando ordem…':notice}</p>{error&&<div role="alert"><p>{error}</p><button type="button" disabled={busy||disabled} onClick={()=>{setError('');setNotice('');onReordered()}}>Atualizar prioridades</button></div>}<div className="today-pinned-grid">{pinned.map((collection,index)=><article key={collection.id}><span className="card-eyebrow">PRIORIDADE {index+1} DE {pinned.length}</span><h4>{collection.nome}</h4><p>{collection.objetivo}</p><p className="today-pinned-counts"><strong>{Number(collection.pendentes||0)}</strong> pendentes para hoje · <strong>{Number(collection.melhorar||0)}</strong> para melhorar</p>{pinned.length>1&&<div className="priority-order-controls" role="group" aria-label={`Posição de ${collection.nome}`}><button type="button" aria-label={`Subir ${collection.nome}`} disabled={busy||disabled||index===0} onClick={()=>move(index,-1)}><span aria-hidden="true">↑ </span>Subir</button><button type="button" aria-label={`Descer ${collection.nome}`} disabled={busy||disabled||index===pinned.length-1} onClick={()=>move(index,1)}><span aria-hidden="true">↓ </span>Descer</button></div>}<button type="button" disabled={disabled||busy} onClick={()=>onReview(String(collection.id))}>Revisar {collection.nome}</button><Link to={`/ferramentas-estudo?aba=ferramentas&colecao=${encodeURIComponent(collection.id)}`}>Abrir coleção</Link></article>)}</div><p className="card-recall-hint">As duas contagens podem incluir o mesmo cartão. Fixar ou reordenar não muda as datas de revisão.</p></section>
}
