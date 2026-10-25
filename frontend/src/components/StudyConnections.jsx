import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { connectionsFor, TOPICS, SOURCES } from '../data/studyConnections'
import './StudyConnections.css'

function Connection({connection,number,total,onNext,onAddNote,noteDisabled}) {
  const [expanded,setExpanded] = useState(false)
  const id=useId()
  const from=TOPICS[connection.from],to=TOPICS[connection.to],source=SOURCES[connection.source]
  return <section className="study-connections pj-panel" aria-labelledby={`${id}-title`}>
    <header><div><span className="pj-eyebrow">CONECTAR OS ASSUNTOS</span><h2 id={`${id}-title`}>Uma ideia abre outra.</h2></div><span className="study-connection-index">{String(number).padStart(2,'0')}<span aria-hidden="true"> / </span><span className="sr-only"> de </span>{String(total).padStart(2,'0')}</span></header>
    <ol className="study-connection-path" aria-label="Relação entre os assuntos"><li><small>VOCÊ ESTÁ ESTUDANDO</small><strong>{from.title}</strong></li><li className="study-connection-arrow" aria-hidden="true"><svg viewBox="0 0 100 32"><path d="M4 16h24c12 0 12-10 24-10h38M82 0l8 6-8 6" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="4" cy="16" r="3" fill="currentColor"/></svg></li><li><small>{connection.relation}</small><strong>{to.title}</strong></li></ol>
    <p className="study-connection-why">{connection.why}</p>
    <div className="study-connection-actions"><button type="button" aria-expanded={expanded} aria-controls={`${id}-body`} onClick={()=>setExpanded(value=>!value)}>{expanded?'Recolher conexão':'Entender esta conexão'}<span aria-hidden="true">{expanded?' −':' +'}</span></button>{total>1 && <button type="button" onClick={()=>{setExpanded(false);onNext()}}>Ver outra conexão <span aria-hidden="true">→</span></button>}</div>
    <div id={`${id}-body`} hidden={!expanded}>{expanded && <>
      <div className="study-connection-example"><span className="pj-eyebrow">VEJA A PONTE</span><p>{connection.example}</p></div>
      <div className="study-connection-question"><h3>Agora, leve a ideia adiante.</h3><p>{connection.question}</p><details><summary>Conferir o raciocínio</summary><p>{connection.reasoning}</p></details></div>
      <div className="study-connection-actions">{onAddNote && <button type="button" disabled={noteDisabled} onClick={()=>onAddNote({...connection,fromTitle:from.title,toTitle:to.title})}>Registrar esta conexão nas anotações</button>}<Link to={`/busca?q=${encodeURIComponent(to.title)}&tipo=materiais`} target="_blank" rel="noopener noreferrer">Buscar este assunto no meu acervo <span aria-hidden="true">↗</span><span className="sr-only"> (abre em outra aba)</span></Link></div>
      <p className="study-connection-scope">A busca abre em outra aba e mostra somente materiais disponíveis para sua conta. Esta sessão continua aberta.</p>
      <footer><span>Curadoria PlanejAI · relação revisada</span><a href={source.url} target="_blank" rel="noopener noreferrer">Conferir referência: {source.name} <span aria-hidden="true">↗</span><span className="sr-only"> (abre em outra aba)</span></a></footer>
    </>}</div>
  </section>
}
export default function StudyConnections({content,onAddNote,noteDisabled}) {
  const connections=connectionsFor(content)
  const [index,setIndex]=useState(0)
  if(!connections.length)return null
  const active=index%connections.length
  return <Connection connection={connections[active]} number={active+1} total={connections.length} onNext={()=>setIndex(value=>value+1)} onAddNote={onAddNote} noteDisabled={noteDisabled}/>
}
