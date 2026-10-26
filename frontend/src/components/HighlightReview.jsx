import {useId,useRef,useState} from 'react'
import {Link} from 'react-router-dom'
import memory,{newRecordKey} from '../services/studyMemoryService'
import {currentUser,scopedCacheKey} from '../utils/offlineStore'
import {readJournalDraft,keepJournalDraft,clearJournalDraft} from '../utils/journalDrafts'
import SaveFeedback from './SaveFeedback'
import './HighlightReview.css'

function ReviewCard({source}){
 const uid=useId(),owner=useRef(currentUser()).current,storageKey=useRef(scopedCacheKey(`highlight-review-draft:${source.id}`)).current,lock=useRef(false)
 const [draft,setDraft]=useState(()=>{const saved=readJournalDraft(storageKey);return saved&&typeof saved.pergunta==='string'&&typeof saved.resposta==='string'&&typeof saved.disciplina==='string'&&typeof saved.chave==='string'?saved:{chave:newRecordKey(),pergunta:`Como você explicaria, com suas palavras, a ideia deste trecho de “${source.titulo}”?`,resposta:source.trecho,disciplina:''}})
 const [status,setStatus]=useState('ready'),[error,setError]=useState(''),[conflict,setConflict]=useState(false),[savedId,setSavedId]=useState(null)
 function update(name,value){const next={...draft,[name]:value};setDraft(next);setError('');setStatus(keepJournalDraft(storageKey,next)?'local':'unsaved')}
 async function save(copy=false){
  if(lock.current||owner!==currentUser())return
  const data={...draft,idDestaque:source.id,...(copy?{chave:newRecordKey()}:{})};if(copy){setDraft(data);keepJournalDraft(storageKey,data)}
  lock.current=true;setStatus('saving');setError('');setConflict(false)
  try{const result=await memory.saveReview(data,owner);if(owner!==currentUser())return;if(!result?.salvo)throw Error('unconfirmed');clearJournalDraft(storageKey);setSavedId(result.id);setStatus('saved')}
  catch(failure){if(owner===currentUser()){keepJournalDraft(storageKey,data);setStatus('error');setConflict(failure.response?.status===409);setError(failure.response?.data?.message||'Não foi possível confirmar a pergunta. Seu rascunho continua aqui para tentar novamente.')}}finally{lock.current=false}
 }
 return <article className="highlight-review-card"><h3>{source.titulo}</h3><p className="highlight-review-source">Fonte: {source.secao}</p><blockquote>{source.trecho}</blockquote>{source.nota&&<details><summary>Consultar minha anotação</summary><p>{source.nota}</p></details>}
 {status==='saved'?<><SaveFeedback status="saved" message="Pergunta salva nos seus cartões de revisão."/><Link to={`/ferramentas-estudo?aba=ferramentas&cartao=${encodeURIComponent(savedId)}`}>Abrir meus cartões →</Link></>:<form onSubmit={event=>{event.preventDefault();save()}}><fieldset disabled={status==='saving'}><label htmlFor={`${uid}-question`}>Pergunta de revisão<textarea id={`${uid}-question`} required minLength={5} maxLength={1000} rows={3} value={draft.pergunta} onChange={event=>update('pergunta',event.target.value)}/></label><label htmlFor={`${uid}-answer`}>Resposta para conferir depois<textarea id={`${uid}-answer`} required minLength={3} maxLength={4000} rows={4} value={draft.resposta} onChange={event=>update('resposta',event.target.value)}/></label><label htmlFor={`${uid}-subject`}>Matéria (opcional)<input id={`${uid}-subject`} maxLength={100} value={draft.disciplina} onChange={event=>update('disciplina',event.target.value)}/></label><button type="submit">{status==='saving'?'Salvando pergunta…':'Salvar pergunta nos meus cartões'}</button></fieldset>{status!=='ready'&&<SaveFeedback status={status} message={error||undefined} onRetry={status==='error'&&!conflict?()=>save():undefined}/ >}{conflict&&<button type="button" onClick={()=>{if(window.confirm('Salvar como uma nova pergunta? Se o envio anterior foi recebido, os dois cartões ficarão na sua conta.'))save(true)}}>Salvar como nova pergunta</button>}</form>}
 </article>
}
export default function HighlightReview({sources,onClose}){
 return <section className="highlight-review" aria-label="Preparar perguntas dos destaques"><header><span>DO TRECHO À LEMBRANÇA</span><h2>O que você quer conseguir explicar?</h2><p>Este é um rascunho inicial, sem consulta à IA. Confira o trecho, ajuste a pergunta e escreva uma resposta útil para revisar. Cada cartão só será salvo quando você confirmar.</p></header>{sources.map(source=><ReviewCard key={source.id} source={source}/>)}{onClose&&<button type="button" onClick={onClose}>Fechar preparação das perguntas</button>}</section>
}
