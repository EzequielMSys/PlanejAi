import {useEffect,useId,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import cards from '../services/flashcardService'
import {newRecordKey} from '../services/studyMemoryService'
import {currentUser} from '../utils/offlineStore'
import FlashcardFace,{cardDate} from './FlashcardFace'
import './FlashcardLibrary.css'
import PinnedCollections from './PinnedCollections'

export default function TodayQuickReview({collectionId=null,onReviewed}){
 const uid=useId()
 const [collections,setCollections]=useState([]),[selection,setSelection]=useState(''),[collectionsError,setCollectionsError]=useState(false)
 const selected=collectionId===null?selection:String(collectionId)
 const owner=useRef(currentUser()).current,lock=useRef(false),retry=useRef(null),prompt=useRef(null),queue=useRef(null),focusQueue=useRef(false)
 const [minutes,setMinutes]=useState(5),[attempt,setAttempt]=useState(0),[data,setData]=useState(null),[status,setStatus]=useState('loading'),[started,setStarted]=useState(false),[index,setIndex]=useState(0),[revealed,setRevealed]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[completed,setCompleted]=useState(0),[skipped,setSkipped]=useState(0),[notice,setNotice]=useState('')
 useEffect(()=>{const controller=new window.AbortController();setStatus('loading');cards.short(minutes,controller.signal,selected).then(value=>{if(!controller.signal.aborted&&owner===currentUser()){if(!Array.isArray(value?.itens)||!Number.isInteger(value.totalPendentes))throw Error('invalid');setData(value);setStatus('ready')}}).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setStatus('error')});return()=>controller.abort()},[minutes,attempt,owner,selected])
 useEffect(()=>{if(collectionId!==null)return;const controller=new window.AbortController();setCollectionsError(false);cards.collections(controller.signal).then(value=>{if(!controller.signal.aborted&&owner===currentUser()){if(!Array.isArray(value))throw Error('invalid');setCollections(value)}}).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setCollectionsError(true)});return()=>controller.abort()},[collectionId,owner,attempt])
 useEffect(()=>{if(started){prompt.current?.scrollIntoView({block:'center',behavior:'auto'});prompt.current?.focus({preventScroll:true})}},[started,index])
 useEffect(()=>{if(status==='ready'&&focusQueue.current){focusQueue.current=false;queue.current?.scrollIntoView({block:'center',behavior:'auto'});queue.current?.focus({preventScroll:true})}},[status])
 function choosePriority(value){focusQueue.current=true;setStatus('loading');setSelection(value);setAttempt(n=>n+1);setNotice('')}
 const card=data?.itens[index],finished=started&&!card
 function start(){if(status!=='ready'||!data?.itens.length)return;setIndex(0);setCompleted(0);setSkipped(0);setRevealed(false);setError('');setNotice('');retry.current=null;setStarted(true)}
 function advance(){setIndex(n=>n+1);setRevealed(false);setError('');retry.current=null}
 async function grade(resultado){
  if(lock.current||!card||owner!==currentUser())return
  if(retry.current&&retry.current.resultado!==resultado){setError('Tente a mesma avaliação novamente para confirmar o envio anterior.');return}
  lock.current=true;setBusy(true);setError('');const body=retry.current||{versao:card.versao,resultado,chave:newRecordKey()};retry.current=body
  try{const result=await cards.review(card.id_flashcard,body,owner);if(owner!==currentUser())return;if(!result?.salvo)throw Error('unconfirmed');setCompleted(n=>n+1);setNotice(`Revisão confirmada. Próxima revisão desse cartão em ${cardDate(result.proximaRevisao)}.`);advance();onReviewed?.()}
  catch(failure){if(owner===currentUser())setError(failure.response?.data?.message||'Sua avaliação não foi confirmada. O cartão continua aberto; tente a mesma opção novamente.')}
  finally{lock.current=false;setBusy(false)}
 }
 function stop(){if(busy)return;setStarted(false);setNotice(`${completed} ${completed===1?'cartão revisado':'cartões revisados'} nesta rodada. O que ficou aberto continua na fila.`);retry.current=null;setError('');setAttempt(n=>n+1)}
 return <section className="today-quick-review" aria-label={collectionId===null?'Revisão curta com cartões':'Revisão curta da coleção'}><header><span className="card-eyebrow">UMA LEMBRANÇA, UM PRÓXIMO PASSO</span><h2>{collectionId===null?'Uma revisão que cabe agora.':'Uma rodada para este objetivo.'}</h2><p>Escolha seu tempo. A fila prioriza cartões vencidos, começando pela revisão mais antiga. O tempo é uma estimativa; você pode encerrar quando precisar.</p></header>
 {!started&&collectionId===null&&!collectionsError&&<PinnedCollections collections={collections} onReview={choosePriority} onReordered={()=>setAttempt(n=>n+1)} disabled={status==='loading'}/>}
 {!started&&collectionId===null&&<div className="quick-review-collection"><label htmlFor={`${uid}-quick-collection`}>Coleção da revisão<select id={`${uid}-quick-collection`} value={selection} onChange={event=>{setStatus('loading');setSelection(event.target.value);setNotice('')}}><option value="">Todas as coleções e cartões avulsos</option>{collections.map(item=><option key={item.id} value={String(item.id)}>{item.nome}</option>)}</select></label>{collectionsError&&<p role="alert">Não foi possível atualizar as coleções. <button type="button" onClick={()=>setAttempt(n=>n+1)}>Consultar coleções novamente</button></p>}</div>}
 {!started&&<div className="quick-review-time" role="group" aria-label="Tempo disponível para cartões">{[3,5,10].map(value=><button type="button" key={value} aria-pressed={minutes===value} onClick={()=>setMinutes(value)}>{value} minutos</button>)}</div>}
 {data?.colecao&&(started||status==='ready')&&<div className="quick-review-objective"><strong>{data.colecao.nome}</strong><p>{data.colecao.objetivo}</p><small>Somente os cartões desta coleção que estão pendentes para hoje.</small></div>}
 <p role="status" className="card-library-notice">{notice}</p>
 {!started&&status==='loading'&&<p role="status">Conferindo seus cartões pendentes…</p>}{!started&&status==='error'&&<div role="alert"><p>Não foi possível consultar a fila de cartões. Seus estudos continuam salvos.{selected&&' A coleção pode ter sido removida; consulte novamente ou escolha outra coleção.'}</p><button type="button" onClick={()=>setAttempt(n=>n+1)}>Consultar revisão curta novamente</button></div>}
 {!started&&status==='ready'&&(data.itens.length?<div ref={queue} tabIndex={-1} className="quick-review-ready"><p><strong>{data.itens.length} {data.itens.length===1?'cartão escolhido':'cartões escolhidos'}</strong> entre {data.totalPendentes} {data.totalPendentes===1?'pendente':'pendentes'} para hoje · cerca de {data.minutosEstimados} min.</p><p>Matérias desta rodada: {[...new Set(data.itens.map(item=>item.disciplina||'Sem matéria'))].join(', ')}.</p><button type="button" onClick={start}>Começar revisão curta →</button></div>:<div ref={queue} tabIndex={-1} className="quick-review-empty"><p>{selected?'Esta coleção não tem cartões pendentes para hoje.':'Não há cartões pendentes para hoje.'} Cartões arquivados e revisões futuras ficam fora desta rodada.</p><Link to="/ferramentas-estudo?aba=ferramentas">Organizar meus cartões →</Link></div>)}
 {started&&!finished&&<div ref={prompt} tabIndex={-1} className="quick-review-prompt"><p className="quick-review-step">Cartão {index+1} de {data.itens.length} · {completed} {completed===1?'revisado':'revisados'} nesta rodada</p><FlashcardFace key={`${card.id_flashcard}:${card.versao}`} card={card} revealed={revealed} onReveal={()=>setRevealed(value=>!value)} onResult={grade} busy={busy} error={error}/><div className="card-actions"><button type="button" disabled={busy} onClick={()=>{setSkipped(n=>n+1);advance()}}>Deixar este para depois</button><button type="button" disabled={busy} onClick={stop}>Encerrar por agora</button></div><p className="card-recall-hint">Deixar para depois não altera a data nem registra uma resposta.</p></div>}
 {finished&&<div className="quick-review-finished"><h3>Sua rodada terminou.</h3><p>{completed} {completed===1?'cartão revisado e salvo':'cartões revisados e salvos'}. {skipped>0?`${skipped} ${skipped===1?'ficou':'ficaram'} para depois, sem alterar a data.`:'Nenhum cartão deixado para depois.'}</p><button type="button" onClick={stop}>Concluir rodada</button><Link to="/ferramentas-estudo?aba=ferramentas">Ver meus cartões →</Link></div>}
 </section>
}
