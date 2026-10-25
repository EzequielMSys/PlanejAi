import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import service from '../services/personalStudyService'
import { currentUser } from '../utils/offlineStore'
import './DeskPin.css'
export default function DeskPin({type,id,disabled=false}) {
  const [status,setStatus]=useState(''),[error,setError]=useState('')
  const lock=useRef(false)
  async function pin(){
    if(lock.current)return
    const owner=currentUser();lock.current=true;setStatus('busy');setError('')
    try{const result=await service.pin(type,id);if(owner===currentUser()){if(!result.fixado)throw Error('unconfirmed');setStatus('saved')}}
    catch(error){if(owner===currentUser()){setStatus('');setError(error.response?.data?.message || 'Não foi possível confirmar. Tente fixar novamente.')}}
    finally{lock.current=false}
  }
  return <div className="desk-pin">{status==='saved'?<p role="status">Fixado. <Link to="/mesa">Ver minha mesa →</Link></p>:<button type="button" disabled={disabled||status==='busy'} onClick={pin}>{status==='busy'?'Fixando…':'Fixar na minha mesa'}</button>}{error&&<p role="alert">{error}</p>}</div>
}
