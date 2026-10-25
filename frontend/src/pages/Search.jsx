import AreaSignature from '../components/AreaSignature'
import DeskPin from '../components/DeskPin'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import searchService from '../services/searchService'
import { currentUser } from '../utils/offlineStore'
import { resolveProtectedAsset } from '../services/fileService'
import './Search.css'

const FILTERS = [['todos','Tudo'],['materias','Matérias'],['materiais','Materiais'],['anotacoes','Anotações'],['redacoes','Redações']]
function Resource({title,source}) {
  const [url,setUrl] = useState('')
  const [failed,setFailed] = useState(false)
  useEffect(() => {
    let active = true
    resolveProtectedAsset(source).then(value => {
      const parsed = new URL(value,window.location.origin)
      if (!['http:','https:'].includes(parsed.protocol)) throw new Error('Endereço inválido')
      if (active) setUrl(parsed.href)
    }).catch(() => { if(active) setFailed(true) })
    return () => { active=false }
  },[source])
  return url ? <a href={url} target="_blank" rel="noopener noreferrer">{title} <span aria-hidden="true">↗</span><span className="sr-only"> (abre em outra aba)</span></a> : <p role="status">{failed ? `Não foi possível autorizar: ${title}. Reabra os detalhes para tentar novamente.` : `Preparando ${title}…`}</p>
}
function ContentDetails({item,type}) {
  const [data,setData] = useState(null)
  const [failed,setFailed] = useState(false)
  const [attempt,setAttempt] = useState(0)
  useEffect(() => {
    const controller = new window.AbortController(), owner=currentUser()
    setFailed(false)
    searchService.content(item.id,controller.signal,type==='anotacoes').then(value => { if(!controller.signal.aborted && currentUser()===owner) setData(value) }).catch(() => { if(!controller.signal.aborted && currentUser()===owner) setFailed(true) })
    return () => controller.abort()
  },[item.id,type,attempt])
  if(failed) return <div role="alert"><p>Não foi possível abrir este item. Ele pode ter sido removido ou seu acesso pode ter mudado.</p><button type="button" onClick={() => setAttempt(value=>value+1)}>Tentar abrir novamente</button></div>
  if(!data) return <p role="status">Conferindo acesso ao conteúdo…</p>
  let extras=[]
  try { extras=Array.isArray(data.materiais)?data.materiais:JSON.parse(data.materiais||'[]') } catch { /* Catálogo legado sem recursos. */ }
  if(!Array.isArray(extras)) extras=[]
  return <div className="search-content-details">
    {type==='materiais' && <><p>Fontes deste conteúdo</p>{data.link && <Resource title="Fonte principal" source={data.link}/ >}{extras.filter(resource=>resource?.url).map((resource,index)=><Resource key={`${index}:${resource.url}`} title={resource.titulo||`Recurso ${index+1}`} source={resource.url}/>)}{!data.link&&!extras.length&&<p>Sem fonte anexada. O guia de estudo continua disponível.</p>}</>}
    <Link to="/estudar" state={{conteudo:data,ferramenta:type==='anotacoes'?'notes':'guide'}}> {type==='anotacoes'?'Abrir minhas anotações':'Abrir na sala de estudo'} <span aria-hidden="true">→</span></Link>
  </div>
}
function Result({item,type,onSubject}) {
  const [expanded,setExpanded]=useState(false)
  const id=`search-${type}-${item.id}`
  return <article className="unified-search-card">
    <div><span className="search-result-meta">{item.disciplina || (type==='redacoes'?'Texto salvo na sua conta':type==='materias'?'Matéria do seu acervo':'Seu espaço de estudo')}</span><h3>{item.titulo}</h3>{item.trecho&&<p>{item.trecho}</p>}</div>
    {type==='materias'?<button type="button" onClick={()=>onSubject(item.titulo)}>Encontrar materiais <span aria-hidden="true">→</span></button>:type==='redacoes'?<Link to={`/redacoes?redacao=${encodeURIComponent(item.id)}`}>Abrir redação <span aria-hidden="true">→</span></Link>:<><button type="button" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)}>{expanded?'Recolher detalhes':type==='anotacoes'?'Ver anotação':'Ver materiais'} <span aria-hidden="true">{expanded?'−':'+'}</span></button><div id={id} hidden={!expanded}>{expanded&&<ContentDetails item={item} type={type}/>}</div></>}
    {type!=='materias'&&<DeskPin type={{anotacoes:'anotacao',materiais:'material',redacoes:'redacao'}[type]} id={item.id}/>}
  </article>
}
export default function Search() {
  const {user}=useAuth()
  const [params,setParams]=useSearchParams()
  const q=params.get('q')||'', type=params.get('tipo')||'todos', page=Number(params.get('pagina')||1)
  const [input,setInput]=useState(q)
  const [data,setData]=useState(null)
  const [status,setStatus]=useState('idle')
  const [attempt,setAttempt]=useState(0)
  const [validation,setValidation]=useState('')
  const inputRef=useRef(null)
  useEffect(()=>setInput(q),[q])
  useEffect(()=>{
    setData(null)
    if(!q.trim()){setStatus('idle');return}
    if(q.trim().length<2||q.length>100||!FILTERS.some(([key])=>key===type)||!Number.isSafeInteger(page)||page<1||page>100){setStatus('invalid');return}
    const controller=new window.AbortController(), owner=currentUser()
    setStatus('loading')
    searchService.search({q,tipo:type,pagina:page},controller.signal).then(value=>{
      if(!controller.signal.aborted&&owner===currentUser()){ if(!Array.isArray(value?.grupos)) throw new Error('Resposta inválida');setData(value);setStatus('ready') }
    }).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setStatus('error')})
    return ()=>controller.abort()
  },[q,type,page,attempt,user?.id,user?.id_usuario])
  const change=(nextType,nextQuery=q,nextPage=1)=>setParams({q:nextQuery,tipo:nextType,...(nextPage>1?{pagina:String(nextPage)}:{})})
  function submit(event){event.preventDefault();if(input.trim().length<2){setValidation('Digite pelo menos 2 caracteres.');inputRef.current?.focus();return}setValidation('');change(type,input.trim());if(input.trim()===q)setAttempt(value=>value+1)}
  const groups=data?.grupos||[], total=groups.reduce((sum,group)=>sum+group.itens.length,0)
  return <main className="unified-search pj-page"><div className="pj-wrap">
<AreaSignature area="search"/>    <header className="unified-search-heading"><span className="pj-eyebrow">SEU ACERVO, MAIS PERTO</span><h1>Uma ideia. Muitos caminhos.</h1><p>Encontre matérias, materiais, anotações e redações no seu espaço.</p></header>
    <form className="unified-search-form" role="search" aria-label="Buscar no acervo" onSubmit={submit}><label htmlFor="unified-query">O que você quer encontrar?</label><div><input id="unified-query" ref={inputRef} type="search" maxLength={100} value={input} onChange={event=>{setInput(event.target.value);setValidation('')}} placeholder="Um assunto, um título ou um trecho…" aria-invalid={Boolean(validation)} aria-describedby={validation?'unified-query-error':'unified-search-scope'}/><button type="submit">Buscar</button></div>{validation&&<p id="unified-query-error" role="alert">{validation}</p>}</form>
    <p id="unified-search-scope" className="unified-search-scope">Anotações e redações são pessoais. A busca considera itens salvos na conta; rascunhos apenas neste aparelho ficam fora dos resultados.</p>
    <div className="unified-search-filters" role="group" aria-label="Tipo de resultado">{FILTERS.map(([key,label])=><button type="button" key={key} aria-pressed={type===key} onClick={()=>{setValidation('');change(key)}}>{label}</button>)}</div>
    <section aria-label="Resultados da busca" aria-busy={status==='loading'}>
      <p className="unified-search-status" role="status">{status==='loading'?'Procurando no seu acervo…':status==='ready'?`${total} ${total===1?'resultado exibido':'resultados exibidos'} para “${data.query}”${page>1?` · página ${page}`:''}.`:''}</p>
      {status==='idle'&&<div className="unified-search-empty"><h2>O que ficou na sua cabeça?</h2><p>Use o nome de uma matéria ou um trecho que lembra de ter escrito. Depois, escolha o tipo de resultado.</p></div>}
      {status==='invalid'&&<div className="unified-search-empty" role="alert"><h2>Vamos ajustar a busca.</h2><p>Use de 2 a 100 caracteres e escolha um dos filtros acima.</p><button type="button" onClick={()=>{setParams({});setValidation('');inputRef.current?.focus()}}>Começar outra busca</button></div>}
      {status==='error'&&<div className="unified-search-empty" role="alert"><h2>Não conseguimos consultar seu acervo.</h2><p>Sua busca continua preenchida. Tente novamente quando a conexão voltar.</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></div>}
      {status==='ready'&&!total&&<div className="unified-search-empty"><h2>Nenhum resultado nesta busca.</h2><p>Tente uma palavra mais curta ou outro filtro. Só aparecem itens disponíveis para sua conta.</p></div>}
      {status==='ready'&&groups.filter(group=>group.itens.length).map(group=><section className="unified-search-group" key={`${q}:${type}:${page}:${group.tipo}`} aria-labelledby={`search-group-${group.tipo}`}><header><h2 id={`search-group-${group.tipo}`}>{group.nome}</h2>{type==='todos'&&group.mais&&<button type="button" onClick={()=>change(group.tipo)}>Ver só {group.nome.toLocaleLowerCase('pt-BR')} →</button>}</header><div className="unified-search-grid">{group.itens.map(item=><Result key={item.id} type={group.tipo} item={item} onSubject={subject=>change('materiais',subject)}/>)}</div>{group.mais&&type==='todos'&&<p className="unified-search-limit">Primeiros {data.limite} resultados deste tipo. Filtre para continuar ou detalhe a busca.</p>}</section>)}
      {status==='ready'&&type!=='todos'&&(page>1||groups[0]?.mais)&&<nav className="unified-search-pagination" aria-label="Páginas dos resultados"><button type="button" disabled={page<=1} onClick={()=>change(type,q,page-1)}>← Anteriores</button><span>Página {page}</span><button type="button" disabled={!groups[0]?.mais||page>=100} onClick={()=>change(type,q,page+1)}>Próximos →</button></nav>}
    </section>
  </div></main>
}
