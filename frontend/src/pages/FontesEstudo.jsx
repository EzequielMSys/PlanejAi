import { useState } from 'react'
import { Link } from 'react-router-dom'
import { checkedOn, normalizeStudyText, sourceCategories, studySources } from '../data/studySources'
import './FontesEstudo.css'

export default function FontesEstudo() {
  const [category, setCategory] = useState('Todas')
  const [search, setSearch] = useState('')
  const [openOnly, setOpenOnly] = useState(false)
  const results = studySources.filter(source => (category === 'Todas' || category === source.category) && (!openOnly || /aberto|aberta|Gratuito/.test(source.access)) && normalizeStudyText(`${source.name} ${source.description} ${source.category}`).includes(normalizeStudyText(search.trim())))
  return <div className="sources-page">
    <Link to="/aprendizagem" className="sources-back">← Praticar e revisar</Link>
    <header className="sources-hero"><span>PLANEJAI / FONTES PARA ESTUDAR</span><h1>Uma boa pergunta<br /><em>merece uma boa fonte.</em></h1><p>Encontre uma explicação, confira uma prova original ou escolha onde praticar sua escrita. Cada fonte tem um papel.</p><small>Curadoria conferida em {checkedOn.split('-').reverse().join('/')}. O acesso e os planos podem mudar.</small></header>
    <section className="sources-start" aria-label="Como usar os materiais"><article><b>01 · Entenda</b><p>Leia a explicação e anote o que ainda não ficou claro.</p></article><article><b>02 · Tente</b><p>Resolva uma questão sem consultar a resposta.</p></article><article><b>03 · Confira</b><p>Compare sua tentativa com o comentário e leve sua dúvida à Lumi.</p></article></section>
    <section aria-label="Encontrar fontes" className="sources-catalog"><div className="sources-controls"><label>Buscar fonte ou assunto<input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ex.: redação, provas, SAT" /></label><label>Tipo de material<select value={category} onChange={event => setCategory(event.target.value)}>{sourceCategories.map(item => <option key={item}>{item}</option>)}</select></label><label className="sources-check"><input type="checkbox" checked={openOnly} onChange={event => setOpenOnly(event.target.checked)} /> Priorizar acesso aberto ou gratuito</label></div><p className="sources-count" role="status">{results.length} fontes encontradas. Os links abrem em outra aba.</p><div className="sources-grid">{results.map(source => <article key={source.url}><div className="sources-card-top"><span>{source.category}</span>{source.official && <b>Fonte oficial</b>}</div><h2>{source.name}</h2><p>{source.description}</p><small>{source.access}</small><a href={source.url} target="_blank" rel="noopener noreferrer">Visitar {source.name} <span aria-hidden="true">↗</span></a></article>)}</div>{!results.length && <p className="sources-empty">Nenhuma fonte neste filtro. Tente outra busca ou escolha “Todas”.</p>}</section>
    <footer className="sources-footer"><p>Os materiais externos pertencem aos seus autores. O PlanejAI indica caminhos de estudo; não importa questões nem envia seus dados para esses sites automaticamente.</p><Link to="/lumi">Levar uma dúvida à Lumi →</Link></footer>
  </div>
}
