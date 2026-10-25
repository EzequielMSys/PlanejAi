import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import service from '../services/personalStudyService'
import { currentUser } from '../utils/offlineStore'
import './PersonalStudy.css'
const labels={anotacao:'Anotação',duvida:'Dúvida',material:'Material',redacao:'Redação'}
export default function PersonalDesk(){
  const navigate=useNavigate(),[data,setData]=useState(null),[error,setError]=useState(''),[revision,setRevision]=useState(0),[busy,setBusy]=useState(false),[notice,setNotice]=useState('')
  const lock=useRef(false),owner=currentUser()
  useEffect(()=>{
    const abort=new window.AbortController();setError('')
    service.desk(abort.signal).then(value=>{if(!abort.signal.aborted&&owner===currentUser()){if(!Array.isArray(value.itens))throw Error('invalid');setData(value)}}).catch(()=>{if(!abort.signal.aborted&&owner===currentUser())setError('Sua mesa não pôde ser consultada. Tente novamente quando a conexão voltar.')})
    return()=>abort.abort()
  },[revision,owner])
  async function act(operation,message){
    if(lock.current)return
    lock.current=true;setBusy(true);setError('');setNotice('')
    try{await operation();if(owner===currentUser()){setRevision(v=>v+1);setNotice(message)}}
    catch(error){if(owner===currentUser())setError(error.response?.data?.message||'A alteração não foi confirmada. Atualize a mesa antes de tentar novamente.')}
    finally{lock.current=false;setBusy(false)}
  }
  async function open(item){
    await act(async()=>{
      const result=await service.open(item.id)
      if(owner!==currentUser())return
      if(result.tipo==='redacao')navigate(`/redacoes?redacao=${result.id_origem}`)
      else if(result.tipo==='duvida')navigate('/aprendizagem',{state:{aba:'diario',registro:result.id_origem,tipo:'duvida'}})
      else navigate('/estudar',{state:{conteudo:result.item,ferramenta:result.tipo==='anotacao'?'notes':'guide'}})
    },'')
  }
  return <main className="personal-study pj-page"><div className="pj-wrap">
    <header className="personal-heading"><span className="pj-eyebrow">O QUE ESTÁ EM USO, AO SEU ALCANCE</span><h1>Minha mesa de estudo.</h1><p>Um espaço pequeno, organizado por você. Deixe por perto o que quer explorar nesta semana.</p><div className="personal-links"><Link to="/busca">Encontrar algo para fixar →</Link><Link to="/aprendizagem" state={{aba:'diario',tipo:'duvida'}}>Escolher uma dúvida →</Link></div></header>
    <section className="desk-board" aria-labelledby="desk-title" aria-busy={busy}><header><h2 id="desk-title">Em cima da mesa</h2><span>{data?`${data.itens.length} de 6 espaços`:'Seis espaços para o essencial'}</span></header>
      {error&&<div role="alert" className="personal-error"><p>{error}</p><button type="button" disabled={busy} onClick={()=>setRevision(v=>v+1)}>Atualizar mesa</button></div>}
      {notice&&<p role="status">{notice}</p>}
      {!data&&!error&&<p role="status">Preparando sua mesa…</p>}
      {data&&!data.itens.length&&<div className="personal-empty"><span aria-hidden="true">＋</span><h3>Qual ideia merece ficar por perto?</h3><p>Na busca, fixe uma anotação salva, um material ou uma redação. No diário, fixe uma dúvida. Eles aparecem aqui, na ordem que você escolher.</p><Link to="/busca">Explorar meu acervo →</Link></div>}
      {data&&<ol className="desk-grid">{data.itens.map((item,index)=><li key={item.id} className={`desk-card desk-${item.tipo}`}><span className="personal-kicker">{String(index+1).padStart(2,'0')} / {labels[item.tipo]}</span><h3>{item.titulo}</h3>{item.disciplina&&<span>{item.disciplina}</span>}{item.trecho&&<p className="personal-excerpt">{item.trecho}</p>}{!item.disponivel&&<p>O original foi removido ou seu acesso mudou. Este atalho pode ser retirado.</p>}{item.tipo==='duvida'&&item.disponivel&&<p>{item.resolvido?'Resolvida por você':'Em investigação'}</p>}<div className="desk-card-actions"><button type="button" disabled={busy||!item.disponivel} onClick={()=>open(item)}>Abrir {labels[item.tipo].toLocaleLowerCase('pt-BR')}</button><div role="group" aria-label={`Organizar ${item.titulo}`}><button type="button" disabled={busy||index===0} aria-label={`Mover ${item.titulo} para cima`} onClick={()=>act(()=>service.move(item.id,'subir'),'Ordem salva na sua conta.')}>↑</button><button type="button" disabled={busy||index===data.itens.length-1} aria-label={`Mover ${item.titulo} para baixo`} onClick={()=>act(()=>service.move(item.id,'descer'),'Ordem salva na sua conta.')}>↓</button><button type="button" disabled={busy} aria-label={`Retirar ${item.titulo} da mesa`} onClick={()=>act(()=>service.remove(item.id),'Atalho retirado. O original foi preservado.')}>Retirar</button></div></div></li>)}</ol>}
    </section><p className="personal-footnote">A mesa acompanha sua conta entre aparelhos. Retirar um atalho preserva o original; abrir um item confere seu acesso novamente.</p><Link to="/meu-entendimento">Ver o que mudou no meu entendimento →</Link>
  </div></main>
}
