import AreaSignature from '../components/AreaSignature'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import service from '../services/personalStudyService'
import { currentUser } from '../utils/offlineStore'
import './PersonalStudy.css'
import './PersonalDesk.css'
const symbols = { anotacao: '✎', duvida: '?', material: '▤', redacao: '¶' }
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
  const limit = data?.limite ?? 6
  const full = Boolean(data && data.itens.length >= limit)
  return (
    <main className="personal-study personal-desk pj-page">
      <div className="pj-wrap">
        <AreaSignature area="desk" />
        <header className="personal-heading">
          <span className="pj-eyebrow">Seu espaço pessoal</span>
          <h1>Minha mesa.</h1>
          <p>O que importa para seus estudos, sempre por perto.</p>
        </header>
        <section className="desk-board" aria-labelledby="desk-title" aria-busy={busy || (!data && !error)}>
          <header>
            <h2 id="desk-title">Em cima da mesa</h2>
            {data && <div className="desk-capacity">
              <span aria-live="polite">{data.itens.length} de {limit} espaços</span>
              {data.itens.length > 0 && (full
                ? <button type="button" disabled aria-describedby="desk-full">Adicionar à mesa</button>
                : <Link className="desk-add" to="/busca">Adicionar à mesa</Link>)}
            </div>}
          </header>
          {full && <p id="desk-full">Todos os espaços estão ocupados. Retire um atalho para liberar espaço.</p>}
          {error && <div role="alert" className="personal-error"><p>{error}</p><button type="button" disabled={busy} onClick={() => setRevision(v => v + 1)}>Atualizar mesa</button></div>}
          {notice && <p role="status">{notice}</p>}
          {!data && !error && <p role="status">Preparando sua mesa…</p>}
          {data && !error && !data.itens.length && <div className="personal-empty">
            <span aria-hidden="true"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 5 5-4 2-3 5-2 1-4-4 1-2 5-3 2-4ZM10 14l-6 6" /></svg></span>
            <h3>Sua mesa está esperando o primeiro item.</h3>
            <p>Fixe uma anotação, um material ou uma dúvida para acessar rapidamente.</p>
            <Link className="desk-add" to="/busca">Adicionar à mesa</Link>
          </div>}
          {data?.itens.length > 0 && <ol className="desk-grid">
            {data.itens.map((item, index) => {
              const title = item.disponivel ? item.titulo : 'Item indisponível'
              const label = labels[item.tipo]
              return (
                <li key={item.id} className="desk-card">
                  <span className="personal-kicker"><span aria-hidden="true">{symbols[item.tipo]}</span> {label}</span>
                  <h3>{title}</h3>
                  {item.disponivel ? <>
                    {item.disciplina && <span className="desk-context">{item.disciplina}</span>}
                    {item.trecho && <p className="personal-excerpt">{item.trecho}</p>}
                    {item.tipo === 'duvida' && <p className="desk-context">{item.resolvido ? 'Resolvida por você' : 'Em investigação'}</p>}
                  </> : <p className="desk-context">O original foi removido ou seu acesso mudou. Você pode retirar o atalho.</p>}
                  <div className="desk-card-actions">
                    <button type="button" disabled={busy || !item.disponivel} onClick={() => open(item)}>Abrir {label.toLocaleLowerCase('pt-BR')}</button>
                    <details className="desk-item-options">
                      <summary aria-label={`Opções de ${title}`}>Opções</summary>
                      <div role="group" aria-label={`Organizar ${title}`}>
                        <button type="button" disabled={busy || index === 0} aria-label={`Mover ${title} para cima`} onClick={() => act(() => service.move(item.id, 'subir'), 'Ordem salva na sua conta.')}>Subir</button>
                        <button type="button" disabled={busy || index === data.itens.length - 1} aria-label={`Mover ${title} para baixo`} onClick={() => act(() => service.move(item.id, 'descer'), 'Ordem salva na sua conta.')}>Descer</button>
                        <button type="button" disabled={busy} aria-label={`Retirar ${title} da mesa`} onClick={() => act(() => service.remove(item.id), 'Atalho retirado. O original foi preservado.')}>Retirar</button>
                      </div>
                    </details>
                  </div>
                </li>
              )
            })}
          </ol>}
        </section>
        <nav className="desk-library" aria-labelledby="desk-library-title">
          <h2 id="desk-library-title">Explore seu acervo</h2>
          <div className="personal-links">
            <Link to="/busca?tipo=anotacoes">Anotações</Link>
            <Link to="/busca?tipo=materiais">Materiais</Link>
            <Link to="/aprendizagem" state={{ aba: 'diario', tipo: 'duvida' }}>Dúvidas</Link>
            <Link to="/busca?tipo=redacoes">Redações</Link>
            <Link to="/meu-entendimento">Meu entendimento</Link>
          </div>
        </nav>
      </div>
    </main>
  )
}
