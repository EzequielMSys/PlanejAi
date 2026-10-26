import {useId,useRef,useState} from 'react'
import cards from '../services/flashcardService'
import {currentUser} from '../utils/offlineStore'

export default function CollectionEditor({collection,onSaved,onClose}) {
 const uid=useId(),owner=useRef(currentUser()).current,lock=useRef(false)
 const [name,setName]=useState(collection.nome),[goal,setGoal]=useState(collection.objetivo)
 const [version,setVersion]=useState(collection.versao),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const [conflict,setConflict]=useState(false),[latest,setLatest]=useState(null)
 async function save(event) {
  event.preventDefault()
  if(lock.current||conflict)return
  lock.current=true;setBusy(true);setError('')
  try {
   const result=await cards.editCollection(collection.id,{nome:name,objetivo:goal,versao:version},owner)
   if(!result?.salvo)throw Error('unconfirmed')
   if(owner===currentUser())onSaved('Nome e objetivo da coleção salvos. Seus cartões foram preservados.')
  } catch(failure) {
   if(owner===currentUser()){
    setError(failure.response?.data?.message||'Não foi possível confirmar a edição. Seu texto continua aqui; tente novamente.')
    if(failure.response?.status===409){setConflict(true);setLatest(null)}
   }
  } finally {lock.current=false;setBusy(false)}
 }
 async function compare() {
  if(lock.current)return
  lock.current=true;setBusy(true);setError('')
  try {
   const groups=await cards.collections()
   if(owner!==currentUser())return
   const record=groups.find(item=>Number(item.id)===Number(collection.id))
   if(!record)throw Error('missing')
   setLatest(record)
  } catch {if(owner===currentUser())setError('Não foi possível consultar esta coleção. Seu texto continua aqui.')} finally {lock.current=false;setBusy(false)}
 }
 return <form className="card-organization-form collection-editor" onSubmit={save} aria-label="Editar coleção">
  <h3>Editar nome e objetivo</h3>
  <p>Os cartões, suas datas e seus históricos continuam vinculados à mesma coleção.</p>
  <label htmlFor={`${uid}-name`}>Nome da coleção<input id={`${uid}-name`} required minLength={2} maxLength={100} value={name} disabled={busy} onChange={event=>setName(event.target.value)}/></label>
  <label htmlFor={`${uid}-goal`}>Objetivo da coleção<textarea id={`${uid}-goal`} required minLength={3} maxLength={300} value={goal} disabled={busy} onChange={event=>setGoal(event.target.value)}/></label>
  <div className="card-actions"><button type="submit" disabled={busy||conflict}>{busy?'Salvando…':'Salvar alterações da coleção'}</button><button type="button" disabled={busy} onClick={onClose}>Cancelar edição</button></div>
  {error&&<p role="alert">{error}</p>}
  {conflict&&<div className="collection-conflict"><p>Confira a versão da conta antes de reaplicar seu texto.</p><button type="button" disabled={busy} onClick={compare}>Consultar versão atual da coleção</button>{latest&&<><h4>Versão atual na conta</h4><p><strong>{latest.nome}</strong></p><p>{latest.objetivo}</p><p>Seu texto nos campos acima foi preservado.</p><button type="button" disabled={busy} onClick={()=>{setVersion(latest.versao);setConflict(false);setError('');setLatest(null)}}>Usar esta versão como base</button></>}</div>}
 </form>
}
