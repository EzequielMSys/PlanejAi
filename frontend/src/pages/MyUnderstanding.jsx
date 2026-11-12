import GuidedStudy from '../components/GuidedStudy'
import AreaSignature from '../components/AreaSignature'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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
  const location = useLocation()
  const [mode, setMode] = useState(() => location.state?.tema ? 'explicar' : 'revisitar')
  const [recordQuery, setRecordQuery] = useState('')
  const [page,setPage]=useState(1),[data,setData]=useState(null),[error,setError]=useState(false),[retry,setRetry]=useState(0),[expanded,setExpanded]=useState(null)
  const owner=currentUser()
  useEffect(()=>{
    const abort=new window.AbortController();setData(null);setError(false);setExpanded(null)
    service.understanding(page,abort.signal).then(value=>{if(!abort.signal.aborted&&owner===currentUser()){if(!Array.isArray(value.itens))throw Error('invalid');setData(value)}}).catch(()=>{if(!abort.signal.aborted&&owner===currentUser())setError(true)})
    return()=>abort.abort()
  },[page,retry,owner])
  const normalized = value => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  const visibleRecords = data?.itens.filter(item => normalized(`${item.titulo} ${date(item.criado_em)}`).includes(normalized(recordQuery.trim())))
  return <main className="personal-study understanding-page pj-page"><div className="pj-wrap">
    <AreaSignature area="understanding"/>
    <header className="personal-heading">
      <Link to="/aprendizagem" className="understanding-back">← Praticar e revisar</Link>
      <h1>Meu entendimento.</h1>
      <p>Explore suas ideias, coloque seu conhecimento em prática e descubra como seu entendimento evolui.</p>
    </header>
    <section aria-labelledby="understanding-intents-title">
      <h2 id="understanding-intents-title">O que você gostaria de fazer?</h2>
      <div className="understanding-intents" role="group" aria-labelledby="understanding-intents-title">
        {[
          ['explicar', '✎', 'Explicar uma ideia', 'Escreva o que entendeu com suas palavras.'],
          ['aplicar', '◇', 'Resolver um desafio', 'Pratique com um exercício próprio ou com a Lumi.'],
          ['erro', '?', 'Investigar um erro', 'Examine uma tentativa e descubra onde ajustar.'],
          ['revisitar', '↔', 'Revisitar um registro', 'Releia tentativas e compare versões.'],
        ].map(([value, icon, label, description]) => <button type="button" key={value} aria-pressed={mode === value} onClick={() => setMode(value)}><span aria-hidden="true">{icon}</span><strong>{label}</strong><small>{description}</small></button>)}
      </div>
    </section>
    <details className="understanding-links">
      <summary>Recursos para continuar</summary>
      <nav className="personal-links" aria-label="Recursos de aprendizagem">
        <Link to="/cronograma">Cronograma</Link>
        <Link to="/aprendizagem" state={{aba:'revisoes'}}>Revisões</Link>
        <Link to="/aprendizagem" state={{aba:'diario'}}>Diário</Link>
        <Link to="/mesa">Minha mesa</Link>
        <Link to="/laboratorio">Laboratório</Link>
        <Link to="/como-aprendo">Como eu aprendo</Link>
        <Link to="/portfolio-investigacao">Portfólio de investigação</Link>
        <Link to="/projetos-investigacao">Projetos de investigação</Link>
        <button type="button" onClick={() => setMode('classic')}>Outras formas de tentativa</button>
      </nav>
    </details>
    <aside className="understanding-intro"><h2>O que ficou diferente?</h2><p>Abra um registro para comparar duas versões ou reler o que fez a diferença. São evidências do seu percurso, não uma avaliação automática de acerto.</p></aside>
    <GuidedStudy kind="evidencia" mode={mode}/>
    <section aria-labelledby="understanding-records"><h2 id="understanding-records">Meus registros</h2>{error&&<div role="alert" className="personal-error"><p>Não foi possível consultar seu percurso. Seus registros continuam na conta.</p><button type="button" onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></div>}{!data&&!error&&<p role="status">Reunindo seus registros…</p>}
      {data&&!data.itens.length&&<div className="personal-empty"><h2>{page===1?'Seu próximo entendimento começa com um registro.':'Você chegou ao início do percurso.'}</h2><p>Ao escrever uma nova versão de uma explicação, salvar um exemplo no caminho de uma dúvida ou registrar uma resolução, esse passo aparece aqui.</p><Link to="/aprendizagem" state={{aba:'diario'}}>Começar pelo que estou aprendendo →</Link></div>}
      {data?.itens.length > 0 && <label className="understanding-filter">Filtrar registros desta página por assunto ou data<input type="search" value={recordQuery} onChange={event => setRecordQuery(event.target.value)}/></label>}
      {data?.itens.length > 0 && !visibleRecords.length && <p role="status">Nenhum registro desta página corresponde ao filtro.</p>}
      <div className="understanding-list">{visibleRecords?.map(item=><article key={item.passo} className="understanding-card"><div className="understanding-marker" aria-hidden="true">{item.tipo==='explicacao'?'↔':item.tipo==='exemplo'?'✎':'✓'}</div><div><span className="personal-kicker">{item.tipo==='explicacao'?`Outra forma de explicar · versão ${item.versao}`:item.tipo==='exemplo'?'Um exemplo meu':'Uma dúvida resolvida por mim'}</span><h2>{item.titulo}</h2><time>{date(item.criado_em)}</time><p className="personal-excerpt">{item.trecho}</p><button type="button" aria-expanded={expanded===item.passo} aria-controls={`evidence-${item.passo}`} onClick={()=>setExpanded(value=>value===item.passo?null:item.passo)}>{expanded===item.passo?'Recolher registro':item.tipo==='explicacao'?'Comparar as duas versões':'Ver o registro que deixei'}</button><div id={`evidence-${item.passo}`}>{expanded===item.passo&&<Evidence id={item.passo}/>}</div></div></article>)}</div>
      {data&&(page>1||data.mais)&&<nav className="personal-pagination" aria-label="Páginas do entendimento"><button type="button" disabled={page===1} onClick={()=>setPage(v=>v-1)}>Mais recentes</button><span>Página {page}</span><button type="button" disabled={!data.mais||page>=1000} onClick={()=>setPage(v=>v+1)}>Mais antigos</button></nav>}
    </section><p className="personal-footnote">Somente registros salvos na sua conta aparecem aqui. Resolver uma dúvida é uma decisão sua; você pode reabri-la no diário.</p></div></main>
}
