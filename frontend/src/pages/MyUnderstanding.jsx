import GuidedStudy from '../components/GuidedStudy'
import AreaSignature from '../components/AreaSignature'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import service from '../services/personalStudyService'
import { currentUser } from '../utils/offlineStore'
import './PersonalStudy.css'
const date=value=>new Date(value).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})
function Evidence({id}){
  const [data,setData]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0)
  useEffect(()=>{
    const abort=new window.AbortController(),owner=currentUser();setError(false)
    service.evidence(id,abort.signal).then(value=>{if(!abort.signal.aborted&&owner===currentUser())setData(value)}).catch(()=>{if(!abort.signal.aborted&&owner===currentUser())setError(true)})
    return()=>abort.abort()
  },[id,retry])
  if(error)return <p role="alert">Não foi possível abrir o registro. Ele pode ter sido excluído. <button type="button" onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></p>
  if(!data)return <p role="status">Consultando o registro original…</p>
  return <div className="understanding-evidence"><div className={data.anterior?'evidence-pair':''}>{data.anterior&&<article><h3>Como expliquei antes</h3><time>{date(data.anterior.criado_em)}</time><p>{data.anterior.texto}</p></article>}<article><h3>{data.tipo==='explicacao'?'Como expliquei nesta versão':data.tipo==='exemplo'?'Meu exemplo, nas minhas palavras':'O que registrei como resolução'}</h3><time>{date(data.criado_em)}</time><p>{data.texto}</p></article></div>{data.tipo==='resolucao'&&!data.resolvido&&<p>Esta dúvida foi reaberta depois desse registro.</p>}<Link to="/aprendizagem" state={{aba:'diario',registro:data.id_diario,tipo:data.registro_tipo}}>Abrir o histórico e continuar escrevendo →</Link></div>
}
export default function MyUnderstanding(){
  const [page,setPage]=useState(1),[data,setData]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[expanded,setExpanded]=useState(null)
  const owner=currentUser()
  useEffect(()=>{
    const abort=new window.AbortController();setData(null);setError(false);setExpanded(null)
    service.understanding(page,abort.signal).then(value=>{if(!abort.signal.aborted&&owner===currentUser()){if(!Array.isArray(value.itens))throw Error('invalid');setData(value)}}).catch(()=>{if(!abort.signal.aborted&&owner===currentUser())setError(true)})
    return()=>abort.abort()
  },[page,retry,owner])
  return <main className="personal-study pj-page"><div className="pj-wrap"><AreaSignature area="understanding"/><header className="personal-heading"><span className="pj-eyebrow">EVOLUÇÃO COM ALGO PARA REVER</span><h1>Meu entendimento.</h1><p>Seu percurso aparece nas palavras que você escreveu, nos exemplos que criou e nas dúvidas que conseguiu trabalhar.</p><div className="personal-links"><Link to="/aprendizagem" state={{aba:'diario'}}>Registrar com minhas palavras →</Link><Link to="/mesa">Ir para minha mesa →</Link><Link to="/laboratorio">Investigar problemas conectados →</Link><Link to="/como-aprendo">Como eu aprendo →</Link><Link to="/portfolio-investigacao">Meu portfólio de investigação →</Link><Link to="/projetos-investigacao">Meus projetos de investigação →</Link></div></header>
    <aside className="understanding-intro"><h2>O que ficou diferente?</h2><p>Abra um registro para comparar duas versões ou reler o que fez a diferença. São evidências do seu percurso, não uma avaliação automática de acerto.</p></aside>
    <GuidedStudy kind="evidencia"/>
    <section aria-label="Registros do meu entendimento">{error&&<div role="alert" className="personal-error"><p>Não foi possível consultar seu percurso. Seus registros continuam na conta.</p><button type="button" onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></div>}{!data&&!error&&<p role="status">Reunindo seus registros…</p>}
      {data&&!data.itens.length&&<div className="personal-empty"><h2>{page===1?'Seu próximo entendimento começa com um registro.':'Você chegou ao início do percurso.'}</h2><p>Ao escrever uma nova versão de uma explicação, salvar um exemplo no caminho de uma dúvida ou registrar uma resolução, esse passo aparece aqui.</p><Link to="/aprendizagem" state={{aba:'diario'}}>Começar pelo que estou aprendendo →</Link></div>}
      <div className="understanding-list">{data?.itens.map(item=><article key={item.passo} className="understanding-card"><div className="understanding-marker" aria-hidden="true">{item.tipo==='explicacao'?'↔':item.tipo==='exemplo'?'✎':'✓'}</div><div><span className="personal-kicker">{item.tipo==='explicacao'?`Outra forma de explicar · versão ${item.versao}`:item.tipo==='exemplo'?'Um exemplo meu':'Uma dúvida resolvida por mim'}</span><h2>{item.titulo}</h2><time>{date(item.criado_em)}</time><p className="personal-excerpt">{item.trecho}</p><button type="button" aria-expanded={expanded===item.passo} aria-controls={`evidence-${item.passo}`} onClick={()=>setExpanded(value=>value===item.passo?null:item.passo)}>{expanded===item.passo?'Recolher registro':item.tipo==='explicacao'?'Comparar as duas versões':'Ver o registro que deixei'}</button><div id={`evidence-${item.passo}`}>{expanded===item.passo&&<Evidence id={item.passo}/>}</div></div></article>)}</div>
      {data&&(page>1||data.mais)&&<nav className="personal-pagination" aria-label="Páginas do entendimento"><button type="button" disabled={page===1} onClick={()=>setPage(v=>v-1)}>Mais recentes</button><span>Página {page}</span><button type="button" disabled={!data.mais||page>=1000} onClick={()=>setPage(v=>v+1)}>Mais antigos</button></nav>}
    </section><p className="personal-footnote">Somente registros salvos na sua conta aparecem aqui. Resolver uma dúvida é uma decisão sua; você pode reabri-la no diário.</p></div></main>
}
