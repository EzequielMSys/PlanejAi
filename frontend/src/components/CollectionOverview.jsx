import {useState} from 'react'

export function CollectionCounts({collection,onOpen}) {
 const total=Number(collection.total||0),active=Number(collection.ativos||0),due=Number(collection.pendentes||0),improve=Number(collection.melhorar||0),archived=Number(collection.arquivados||0)
 return <><dl className="collection-counts"><div><dt>Ativos</dt><dd>{active}</dd></div><div><dt>Pendentes para hoje</dt><dd>{due}</dd></div><div><dt>Para melhorar</dt><dd>{improve}</dd></div><div><dt>Arquivados</dt><dd>{archived}</dd></div></dl><p className="collection-counts-help">{total} {total===1?'cartão no total':'cartões no total'}. Um cartão pode estar pendente e marcado para melhorar. Arquivados ficam fora dessas duas contagens.</p>{onOpen&&<div className="card-actions"><button type="button" onClick={()=>onOpen(collection.id,'pendentes')}>Ver pendentes ({due})</button><button type="button" onClick={()=>onOpen(collection.id,'melhorar')}>Ver cartões para melhorar ({improve})</button></div>}</>
}
export default function CollectionOverview({collections,onOpen}) {
 const [expanded,setExpanded]=useState(false)
 if(!collections.length)return null
 return <section className="collection-overview" aria-label="Indicadores das minhas coleções"><header><h3>Seus objetivos, próximos passos</h3><p>Veja o que pede atenção em cada coleção. As contagens consideram todos os cartões dela, independentemente dos filtros da biblioteca.</p></header><div className="collection-overview-grid">{(expanded?collections:collections.slice(0,6)).map(collection=><article key={collection.id} className="collection-overview-card"><h4>{collection.nome}</h4><p>{collection.objetivo}</p><CollectionCounts collection={collection} onOpen={onOpen}/><button type="button" onClick={()=>onOpen(collection.id,'todos')}>Abrir coleção {collection.nome}</button></article>)}</div>{collections.length>6&&<button type="button" aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}>{expanded?'Mostrar menos coleções':`Ver todas as ${collections.length} coleções`}</button>}</section>
}
