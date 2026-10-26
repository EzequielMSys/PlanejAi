import {useRef,useState} from 'react'
import cards from '../services/flashcardService'
import {currentUser} from '../utils/offlineStore'

export default function CollectionPinButton({collection,onChanged,disabled=false}) {
 const owner=useRef(currentUser()).current,lock=useRef(false)
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const pinned=Boolean(Number(collection.fixada))
 async function toggle() {
  if(lock.current||owner!==currentUser())return
  lock.current=true;setBusy(true);setError('')
  try {
   const result=await cards.pin(collection.id,!pinned,owner)
   if(!result?.salvo)throw Error('unconfirmed')
   if(owner===currentUser())onChanged(pinned?'Coleção desafixada de Hoje. Seus cartões continuam preservados.':'Coleção fixada em Hoje. Você pode fixar até três prioridades.')
  } catch(failure) {if(owner===currentUser())setError(failure.response?.data?.message||'Não foi possível confirmar a prioridade. Tente novamente.')} finally {lock.current=false;setBusy(false)}
 }
 return <div className="collection-pin"><button type="button" disabled={busy||disabled} aria-pressed={pinned} onClick={toggle}>{busy?'Salvando prioridade…':pinned?'Desafixar de Hoje':'Fixar em Hoje'}</button>{error&&<p role="alert">{error}</p>}</div>
}
