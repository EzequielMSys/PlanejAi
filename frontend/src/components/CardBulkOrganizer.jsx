import {useId,useRef,useState} from 'react'
import cards from '../services/flashcardService'
import {currentUser} from '../utils/offlineStore'

export default function CardBulkOrganizer({items,collections,defaultCollection,onSaved,onClear,onCancel,onSelectPage,pageReady,busy,onBusy}) {
 const uid=useId(),owner=useRef(currentUser()).current,lock=useRef(false)
 const [target,setTarget]=useState(defaultCollection||''),[error,setError]=useState('')
 async function submit(event) {
  event.preventDefault()
  if(lock.current||owner!==currentUser())return
  if(!items.length||!collections.some(collection=>String(collection.id)===target)){setError('Escolha os cartões e uma coleção disponível nesta conta.');return}
  const ids=items.map(item=>item.id_flashcard),name=collections.find(collection=>String(collection.id)===target).nome
  lock.current=true;onBusy(true);setError('')
  try {
   const result=await cards.addMany(target,ids,owner)
   if(!result?.salvo||result.confirmados!==ids.length)throw Error('unconfirmed')
   if(owner===currentUser())onSaved(`${result.confirmados} ${result.confirmados===1?'cartão confirmado':'cartões confirmados'} na coleção “${name}”. Cartões que já estavam nela foram mantidos sem duplicar.`)
  } catch(failure) {
   if(owner===currentUser())setError(failure.response?.data?.message||'Não foi possível confirmar a inclusão. Sua seleção e a coleção foram preservadas; tente novamente.')
  } finally {lock.current=false;onBusy(false)}
 }
 return <form className="card-bulk-organizer" aria-label="Adicionar vários cartões a uma coleção" onSubmit={submit}>
  <h3>Reunir cartões em uma coleção</h3><p>Selecione até 50 cartões entre páginas e filtros. A seleção permanece até você salvar ou limpar. Incluir um arquivado não o restaura nem altera suas datas.</p>
  <p role="status"><strong>{items.length} {items.length===1?'cartão selecionado':'cartões selecionados'}</strong> de 50</p>
  <div className="card-actions"><button type="button" disabled={busy||!pageReady} onClick={onSelectPage}>Selecionar cartões desta página</button><button type="button" disabled={busy||!items.length} onClick={onClear}>Limpar seleção</button><button type="button" disabled={busy} onClick={onCancel}>Encerrar seleção</button></div>
  {items.length>0&&<details className="card-bulk-preview"><summary>Conferir os {items.length} cartões selecionados</summary><ul>{items.map(item=><li key={item.id_flashcard}>{item.frente}<small>{item.disciplina||'Sem matéria'}{Number(item.arquivado)?' · Arquivado':''}</small></li>)}</ul></details>}
  <label htmlFor={`${uid}-target`}>Coleção de destino<select id={`${uid}-target`} value={target} disabled={busy} required onChange={event=>{setTarget(event.target.value);setError('')}}><option value="">Escolha uma coleção</option>{target&&!collections.some(collection=>String(collection.id)===target)&&<option value={target}>Coleção indisponível</option>}{collections.map(collection=><option key={collection.id} value={String(collection.id)}>{collection.nome}</option>)}</select></label>
  {!collections.length&&<p>Crie uma coleção acima para adicionar os cartões selecionados.</p>}
  <button type="submit" disabled={busy||!items.length||!target||!collections.length}>{busy?'Confirmando inclusão…':`Adicionar ${items.length} ${items.length===1?'cartão':'cartões'} à coleção`}</button>
  {busy&&<p role="status">Salvando a seleção na sua conta…</p>}{error&&<p role="alert">{error}</p>}
 </form>
}
