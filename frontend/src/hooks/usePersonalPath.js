import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import service from '../services/guidedStudyService'
import { currentUser } from '../utils/offlineStore'
export const pathError=e=>e.response?.data?.message||'Não foi possível confirmar. Seu rascunho permanece neste aparelho.'
export default function usePersonalPath(kind,param) {
  const owner=currentUser(),[params,setParams]=useSearchParams(),id=params.get(param)
  const [items,setItems]=useState(null),[data,setData]=useState(null),[error,setError]=useState(''),[status,setStatus]=useState(''),[busy,setBusy]=useState(false),[retry,setRetry]=useState(0)
  useEffect(()=>{const abort=new window.AbortController();setData(null);setItems(null);setError('');Promise.all([service.list(kind,abort.signal),id?service.detail(id,abort.signal):Promise.resolve(null)]).then(([list,record])=>{if(!abort.signal.aborted&&owner===currentUser()){if(!Array.isArray(list)||(record&&record.kind!==kind))throw Error('invalid');setItems(list);setData(record)}}).catch(e=>{if(!abort.signal.aborted&&owner===currentUser())setError(pathError(e))});return()=>abort.abort()},[kind,id,retry,owner])
  async function run(operation,creating=false){setBusy(true);setError('');setStatus('Salvando…');try{const result=await operation();if(owner!==currentUser())return false;if(result.deleted){setData(null);setParams({});setRetry(v=>v+1);setStatus('Registro excluído da sua conta')}else{setData(result);setStatus('Salvo na sua conta');if(creating)setParams({[param]:result.id})}return true}catch(e){if(owner===currentUser()){setError(pathError(e));setStatus('Não foi possível salvar')}return false}finally{if(owner===currentUser())setBusy(false)}}
  return {items,data,error,status,busy,id,retry:()=>setRetry(v=>v+1),save:body=>run(()=>service.create(kind,body),true),mutate:body=>run(()=>service.change(data.id,{...body,version:data.version})),select:value=>setParams(value?{[param]:value}:{})}
}
