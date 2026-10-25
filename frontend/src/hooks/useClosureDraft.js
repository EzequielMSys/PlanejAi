import {useEffect,useRef,useState} from 'react'
import {scopedCacheKey} from '../utils/offlineStore'
const memory=new Map()
const requestKey=()=>window.crypto.randomUUID?.().replaceAll('-','') || Array.from(window.crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('')
function load(key) {
  if(memory.has(key))return memory.get(key)
  try{const value=JSON.parse(localStorage.getItem(key));if(value && typeof value.reminder==='string')return value}catch{/* Keep an editable draft if storage is unavailable. */}
  return {reminder:'',attempt:null}
}
export default function useClosureDraft(content,startedAt) {
  const key=scopedCacheKey(`study-close:${content?.id ? `item-${content.id}` : `content-${content?.id_conteudo || 'none'}`}`)
  const previous=useRef(key)
  const [draft,setDraft]=useState(()=>load(key))
  const [localSaved,setLocalSaved]=useState(true)
  useEffect(()=>{if(previous.current!==key){previous.current=key;setDraft(load(key));setLocalSaved(true)}},[key])
  useEffect(()=>{
    const warn=event=>{if(!localSaved && (draft.reminder||draft.attempt)){event.preventDefault();event.returnValue=''}}
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn)
  },[localSaved,draft])
  function persist(value) {
    memory.set(key,value);setDraft(value)
    try{localStorage.setItem(key,JSON.stringify(value));setLocalSaved(true)}catch{setLocalSaved(false)}
  }
  function prepare(resultado) {
    if(draft.attempt)return draft.attempt
    const attempt={chave:requestKey(),idItem:content?.id || null,idConteudo:content?.id_conteudo || null,inicio:new Date(startedAt.current).toISOString(),resultado,proximoPasso:draft.reminder}
    persist({...draft,attempt});return attempt
  }
  function clear() {
    memory.delete(key);setDraft({reminder:'',attempt:null});setLocalSaved(true)
    try{localStorage.removeItem(key)}catch{/* The server has already confirmed the immutable closing. */}
  }
  return {reminder:draft.reminder,attempt:draft.attempt,localSaved,change:value=>{if(!draft.attempt)persist({...draft,reminder:value})},prepare,clear}
}
