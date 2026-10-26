import {Link} from 'react-router-dom'

export default function PinnedCollections({collections,onReview,disabled}) {
 const pinned=collections.filter(collection=>Number(collection.fixada)).slice(0,3)
 if(!pinned.length)return null
 return <section className="today-pinned-collections" aria-label="Coleções prioritárias de Hoje"><h3>Objetivos que você escolheu manter por perto</h3><p>Até três coleções fixadas por você. Elas continuam aqui nos próximos acessos, até você desafixar.</p><div className="today-pinned-grid">{pinned.map(collection=><article key={collection.id}><span className="card-eyebrow">PRIORIDADE PESSOAL</span><h4>{collection.nome}</h4><p>{collection.objetivo}</p><p className="today-pinned-counts"><strong>{Number(collection.pendentes||0)}</strong> pendentes para hoje · <strong>{Number(collection.melhorar||0)}</strong> para melhorar</p><button type="button" disabled={disabled} onClick={()=>onReview(String(collection.id))}>Revisar {collection.nome}</button><Link to={`/ferramentas-estudo?aba=ferramentas&colecao=${encodeURIComponent(collection.id)}`}>Abrir coleção</Link></article>)}</div><p className="card-recall-hint">As duas contagens podem incluir o mesmo cartão. Fixar não muda as datas de revisão.</p></section>
}
