import {useEffect,useId,useRef,useState} from 'react'
import cards from '../services/flashcardService'
import {currentUser} from '../utils/offlineStore'

export default function CardBulkOrganizer({items,collections,defaultCollection,operation='adicionar',sourceCollection,onSaved,onClear,onCancel,onSelectPage,pageReady,busy,onBusy}) {
 const uid=useId(),owner=useRef(currentUser()).current,lock=useRef(false),form=useRef(null)
 const [target,setTarget]=useState(defaultCollection||''),[error,setError]=useState(''),[confirmed,setConfirmed]=useState(false)
 const removing=operation==='retirar',collectionId=removing?sourceCollection:target
 const group=collections.find(collection=>String(collection.id)===collectionId)
 useEffect(()=>{form.current?.scrollIntoView({block:'start',behavior:'auto'});form.current?.focus({preventScroll:true})},[operation,sourceCollection])
 useEffect(()=>{setConfirmed(false);setError('')},[items,collectionId,operation])
 async function submit(event) {
  event.preventDefault()
  if(lock.current||owner!==currentUser())return
  if(!items.length||!group){setError('Escolha os cartões e uma coleção disponível nesta conta.');return}
  if(removing&&!confirmed){setConfirmed(true);return}
  const ids=items.map(item=>item.id_flashcard),name=group.nome
  lock.current=true;onBusy(true);setError('')
  try {
   const result=await(removing?cards.removeMany(collectionId,ids,owner):cards.addMany(collectionId,ids,owner))
   if(!result?.salvo||result.confirmados!==ids.length)throw Error('unconfirmed')
   if(owner===currentUser())onSaved(removing?`Retirada de ${result.confirmados} ${result.confirmados===1?'cartão':'cartões'} da coleção “${name}” confirmada. Os cartões e seus históricos foram preservados.`:`${result.confirmados} ${result.confirmados===1?'cartão confirmado':'cartões confirmados'} na coleção “${name}”. Cartões que já estavam nela foram mantidos sem duplicar.`)
  } catch(failure) {
   if(owner===currentUser())setError(failure.response?.data?.message||'Não foi possível confirmar a operação. Sua seleção e a coleção foram preservadas; tente novamente.')
  } finally {lock.current=false;onBusy(false)}
 }
 return <form ref={form} tabIndex={-1} className="card-bulk-organizer" aria-label={removing?'Retirar vários cartões de uma coleção':'Adicionar vários cartões a uma coleção'} onSubmit={submit}>
  <h3>{removing?'Retirar cartões desta coleção':'Reunir cartões em uma coleção'}</h3>
  <p>{removing?'Selecione até 50 cartões desta coleção entre páginas e filtros. A retirada preserva os cartões, as outras coleções, as datas e o histórico de revisão.':'Selecione até 50 cartões entre páginas e filtros. A seleção permanece até você salvar ou limpar. Incluir um arquivado não o restaura nem altera suas datas.'}</p>
  {removing&&<p><strong>Coleção de origem: {group?.nome||'Coleção indisponível'}</strong></p>}
  <p role="status"><strong>{items.length} {items.length===1?'cartão selecionado':'cartões selecionados'}</strong> de 50</p>
  <div className="card-actions"><button type="button" disabled={busy||!pageReady} onClick={onSelectPage}>Selecionar cartões desta página</button><button type="button" disabled={busy||!items.length} onClick={onClear}>Limpar seleção</button><button type="button" disabled={busy} onClick={onCancel}>Encerrar seleção</button></div>
  {items.length>0&&<details className="card-bulk-preview" open={removing&&confirmed?true:undefined}><summary>Conferir os {items.length} cartões selecionados</summary><ul>{items.map(item=><li key={item.id_flashcard}>{item.frente}<small>{item.disciplina||'Sem matéria'}{Number(item.arquivado)?' · Arquivado':''}</small></li>)}</ul></details>}
  {!removing&&<><label htmlFor={`${uid}-target`}>Coleção de destino<select id={`${uid}-target`} value={target} disabled={busy} required onChange={event=>{setTarget(event.target.value);setError('')}}><option value="">Escolha uma coleção</option>{target&&!group&&<option value={target}>Coleção indisponível</option>}{collections.map(collection=><option key={collection.id} value={String(collection.id)}>{collection.nome}</option>)}</select></label>{!collections.length&&<p>Crie uma coleção acima para adicionar os cartões selecionados.</p>}</>}
  {removing&&confirmed&&<div className="card-removal-confirm" role="status"><p>Confirme a retirada de {items.length} {items.length===1?'cartão':'cartões'} apenas da coleção “{group?.nome}”. As perguntas continuam na sua biblioteca e nas outras coleções.</p><button type="button" disabled={busy} onClick={()=>setConfirmed(false)}>Voltar à seleção</button></div>}
  <button type="submit" disabled={busy||!items.length||!collectionId||!group}>{busy?'Confirmando operação…':removing?`${confirmed?'Confirmar':'Conferir'} retirada de ${items.length} ${items.length===1?'cartão':'cartões'}`:`Adicionar ${items.length} ${items.length===1?'cartão':'cartões'} à coleção`}</button>
  {busy&&<p role="status">Salvando a seleção na sua conta…</p>}{error&&<p role="alert">{error}</p>}
 </form>
}
