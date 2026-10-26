import AreaSignature from '../components/AreaSignature'
import DeskPin from '../components/DeskPin'
import HighlightReview from '../components/HighlightReview'
import memory from '../services/studyMemoryService'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import searchService from '../services/searchService'
import { currentUser } from '../utils/offlineStore'
import { resolveProtectedAsset } from '../services/fileService'
import './Search.css'
import {readRecentSearches,rememberSearch,clearRecentSearches,highlightParts} from '../utils/searchExperience'
function Highlight({text,query}){return highlightParts(text,query).map((part,index)=>part.match?<mark key={index}>{part.text}</mark>:part.text)}

const FILTERS = [['todos','Tudo'],['materias','Matérias'],['materiais','Materiais'],['anotacoes','Anotações'],['redacoes','Redações'],['destaques','Destaques'],['conversas','Conversas da Lumi'],['cartoes','Cartões de revisão']]
function HighlightDetails({id}) {
  const [data,setData]=useState(null),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0),[review,setReview]=useState(false),[guide,setGuide]=useState(false)
  useEffect(()=>{const controller=new window.AbortController(),owner=currentUser();setFailed(false);setData(null);memory.highlight(id,controller.signal).then(value=>{if(!controller.signal.aborted&&owner===currentUser()){if(!value?.id)throw Error('invalid');setData(value)}}).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setFailed(true)});return()=>controller.abort()},[id,attempt])
  if(failed)return <div role="alert"><p>Não foi possível abrir o destaque. Ele pode ter sido retirado ou seu acesso mudou.</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>Consultar destaque novamente</button></div>
  if(!data)return <p role="status">Abrindo seu destaque…</p>
  return <section className="search-highlight-detail" aria-label="Destaque completo"><h4>{data.secao}</h4><blockquote>{data.trecho}</blockquote>{data.nota&&<><strong>Minha anotação</strong><p>{data.nota}</p></>}<button type="button" onClick={()=>setReview(value=>!value)} aria-expanded={review}>{review?'Recolher pergunta de revisão':'Criar pergunta de revisão'}</button>{review&&<HighlightReview sources={[data]}/>}{/^[1-9]\d*$/.test(data.material_key)&&<><button type="button" onClick={()=>setGuide(value=>!value)} aria-expanded={guide}>{guide?'Recolher acesso ao guia':'Conferir acesso ao guia original'}</button>{guide&&<ContentDetails item={{id:Number(data.material_key)}} type="materiais"/>}</>}</section>
}
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
function Result({item,type,onSubject,query}) {
  const [expanded,setExpanded]=useState(false)
  const navigate=useNavigate(),[opening,setOpening]=useState(false),[openError,setOpenError]=useState('')
  const busy=useRef(false),request=useRef(null)
  useEffect(()=>()=>request.current?.abort(),[])
  async function open(){if(busy.current)return;busy.current=true;setOpening(true);setOpenError('');const owner=currentUser(),controller=new window.AbortController();request.current=controller;try{const data=await searchService.content(item.id,controller.signal,type==='anotacoes');if(!data?.id_conteudo)throw Error('invalid');if(!controller.signal.aborted&&owner===currentUser())navigate('/estudar',{state:{conteudo:data,ferramenta:type==='anotacoes'?'notes':'guide'}})}catch{if(!controller.signal.aborted)setOpenError('Não foi possível abrir este registro. Seu acesso pode ter mudado; tente novamente.')}finally{busy.current=false;setOpening(false)}}
  const id=`search-${type}-${item.id}`
  return <article className={`unified-search-card${expanded?' is-expanded':''}`}>
    <div><span className="search-result-meta">{item.disciplina || (type==='redacoes'?'Texto salvo na sua conta':type==='materias'?'Matéria do seu acervo':'Seu espaço de estudo')}</span><h3><Highlight text={item.titulo} query={query}/></h3>{item.trecho&&<p><Highlight text={item.trecho} query={query}/></p>}</div>
    {['materiais','anotacoes'].includes(type)&&<button type="button" disabled={opening} onClick={open}>{opening?'Conferindo acesso…':type==='anotacoes'?'Abrir anotação →':'Abrir material →'}</button>}
    {openError&&<p role="alert">{openError}</p>}
    {type==='materias'?<button type="button" onClick={()=>onSubject(item.titulo)}>Encontrar materiais <span aria-hidden="true">→</span></button>:type==='redacoes'?<Link to={`/redacoes?redacao=${encodeURIComponent(item.id)}`}>Abrir redação <span aria-hidden="true">→</span></Link>:type==='cartoes'?<Link to={`/ferramentas-estudo?aba=ferramentas&cartao=${encodeURIComponent(item.id)}`}>Abrir cartão →</Link>:type==='conversas'?<Link to={`/lumi?conversa=${encodeURIComponent(item.id)}`}>Conferir conversa e contexto →</Link>:<><button type="button" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(value=>!value)}>{expanded?'Recolher detalhes':type==='destaques'?'Abrir destaque':type==='anotacoes'?'Ver anotação':'Ver materiais'} <span aria-hidden="true">{expanded?'−':'+'}</span></button><div id={id} hidden={!expanded}>{expanded&&(type==='destaques'?<HighlightDetails id={item.id}/>:<ContentDetails item={item} type={type}/>)}</div></>}
    {['anotacoes','materiais','redacoes'].includes(type)&&<DeskPin type={{anotacoes:'anotacao',materiais:'material',redacoes:'redacao'}[type]} id={item.id}/>}
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
  const [recent,setRecent]=useState(readRecentSearches),[recentError,setRecentError]=useState('')
  useEffect(()=>{setRecent(readRecentSearches());setRecentError('')},[user?.id,user?.id_usuario])
  const inputRef=useRef(null)
  useEffect(()=>setInput(q),[q])
  useEffect(()=>{
    setData(null)
    if(!q.trim()){setStatus('idle');return}
    if(q.trim().length<2||q.length>100||!FILTERS.some(([key])=>key===type)||!Number.isSafeInteger(page)||page<1||page>100){setStatus('invalid');return}
    const controller=new window.AbortController(), owner=currentUser()
    setStatus('loading')
    searchService.search({q,tipo:type,pagina:page},controller.signal).then(value=>{
      if(!controller.signal.aborted&&owner===currentUser()){ if(!Array.isArray(value?.grupos)) throw new Error('Resposta inválida');setData(value);setStatus('ready');if(rememberSearch(q,type)){setRecent(readRecentSearches());setRecentError('')}else setRecentError('Não foi possível guardar esta busca neste aparelho.') }
    }).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setStatus('error')})
    return ()=>controller.abort()
  },[q,type,page,attempt,user?.id,user?.id_usuario])
  const change=(nextType,nextQuery=q,nextPage=1)=>setParams({q:nextQuery,tipo:nextType,...(nextPage>1?{pagina:String(nextPage)}:{})})
  function submit(event){event.preventDefault();if(input.trim().length<2){setValidation('Digite pelo menos 2 caracteres.');inputRef.current?.focus();return}setValidation('');change(type,input.trim());if(input.trim()===q)setAttempt(value=>value+1)}
  const groups=data?.grupos||[], total=groups.reduce((sum,group)=>sum+group.itens.length,0)
  return <main className="unified-search pj-page"><div className="pj-wrap">
<AreaSignature area="search"/>    <header className="unified-search-heading"><span className="pj-eyebrow">SEU ACERVO, MAIS PERTO</span><h1>Uma ideia. Muitos caminhos.</h1><p>Encontre matérias, materiais, anotações, redações, destaques, conversas da Lumi e cartões.</p></header>
    <form className="unified-search-form" role="search" aria-label="Buscar no acervo" onSubmit={submit}><label htmlFor="unified-query">O que você quer encontrar?</label><div><input id="unified-query" ref={inputRef} type="search" maxLength={100} value={input} onChange={event=>{setInput(event.target.value);setValidation('')}} placeholder="Um assunto, um título ou um trecho…" aria-invalid={Boolean(validation)} aria-describedby={validation?'unified-query-error':'unified-search-scope'}/><button type="submit">Buscar</button></div>{validation&&<p id="unified-query-error" role="alert">{validation}</p>}</form>
    <p id="unified-search-scope" className="unified-search-scope">Anotações, redações, destaques, conversas e cartões são pessoais. Só aparecem registros salvos na conta. Destaques retirados, conversas e cartões arquivados e rascunhos apenas neste aparelho ficam fora dos resultados.</p>
    <div className="unified-search-filters" role="group" aria-label="Tipo de resultado">{FILTERS.map(([key,label])=><button type="button" key={key} aria-pressed={type===key} onClick={()=>{setValidation('');change(key)}}>{label}</button>)}</div>
    <p className="search-filter-summary">Filtro atual: <strong>{FILTERS.find(([key])=>key===type)?.[1] || 'Inválido'}</strong>. Trocar o filtro mantém a expressão pesquisada.</p>
    {!!recent.length&&<section className="search-recent" aria-label="Buscas recentes desta conta"><header><h2>Buscas recentes neste aparelho</h2><button type="button" onClick={()=>{if(clearRecentSearches())setRecent([]);else setRecentError('Não foi possível limpar as buscas deste aparelho.')}}>Limpar buscas recentes</button></header><div>{recent.map(item=><button type="button" key={`${item.type}:${item.q}`} onClick={()=>{setInput(item.q);change(item.type,item.q);if(item.q===q&&item.type===type)setAttempt(value=>value+1)}}>{item.q} <small>{FILTERS.find(([key])=>key===item.type)?.[1]}</small></button>)}</div></section>}
    {recentError&&<p role="status">{recentError}</p>}
    <section aria-label="Resultados da busca" aria-busy={status==='loading'}>
      <p className="unified-search-status" role="status">{status==='loading'?'Procurando no seu acervo…':status==='ready'?`${total} ${total===1?'resultado exibido':'resultados exibidos'} para “${data.query}”${page>1?` · página ${page}`:''}.`:''}</p>
      {status==='idle'&&<div className="unified-search-empty"><h2>O que ficou na sua cabeça?</h2><p>Use o nome de uma matéria ou um trecho que lembra de ter escrito. Depois, escolha o tipo de resultado.</p></div>}
      {status==='invalid'&&<div className="unified-search-empty" role="alert"><h2>Vamos ajustar a busca.</h2><p>Use de 2 a 100 caracteres e escolha um dos filtros acima.</p><button type="button" onClick={()=>{setParams({});setValidation('');inputRef.current?.focus()}}>Começar outra busca</button></div>}
      {status==='error'&&<div className="unified-search-empty" role="alert"><h2>Não conseguimos consultar seu acervo.</h2><p>Sua busca continua preenchida. Tente novamente quando a conexão voltar.</p><button type="button" onClick={()=>setAttempt(value=>value+1)}>Tentar novamente</button></div>}
      {status==='ready'&&!total&&<div className="unified-search-empty"><h2>Nenhum resultado nesta busca.</h2><p>Tente uma palavra mais curta ou outro filtro. Só aparecem itens disponíveis para sua conta.</p></div>}
      {status==='ready'&&groups.filter(group=>group.itens.length).map(group=><section className="unified-search-group" key={`${q}:${type}:${page}:${group.tipo}`} aria-labelledby={`search-group-${group.tipo}`}><header><h2 id={`search-group-${group.tipo}`}>{group.nome}</h2>{type==='todos'&&group.mais&&<button type="button" onClick={()=>change(group.tipo)}>Ver só {group.nome.toLocaleLowerCase('pt-BR')} →</button>}</header><div className="unified-search-grid">{group.itens.map(item=><Result key={item.id} type={group.tipo} item={item} query={q} onSubject={subject=>change('materiais',subject)}/>)}</div>{group.mais&&type==='todos'&&<p className="unified-search-limit">Primeiros {data.limite} resultados deste tipo. Filtre para continuar ou detalhe a busca.</p>}</section>)}
      {status==='ready'&&type!=='todos'&&(page>1||groups[0]?.mais)&&<nav className="unified-search-pagination" aria-label="Páginas dos resultados"><button type="button" disabled={page<=1} onClick={()=>change(type,q,page-1)}>← Anteriores</button><span>Página {page}</span><button type="button" disabled={!groups[0]?.mais||page>=100} onClick={()=>change(type,q,page+1)}>Próximos →</button></nav>}
    </section>
  </div></main>
}
