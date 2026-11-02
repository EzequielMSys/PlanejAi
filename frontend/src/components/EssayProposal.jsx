import { useEffect, useId, useState } from 'react'
import { ESSAY_PROPOSALS, PROPOSAL_LEVELS, proposalForTopic } from '../utils/essayProposals.mjs'
import './EssayGuide.css'
import './EssayProposalCatalog.css'

export default function EssayProposal({topic,onUse,onGuide,detailsRef,busy=false}) {
 const applied=proposalForTopic(topic)
 const [level,setLevel]=useState(()=>applied?.level || 'guiado')
 const [selectedId,setSelectedId]=useState(()=>applied?.id || ESSAY_PROPOSALS[0].id)
 const [pending,setPending]=useState(null)
 const uid=useId()
 const selected=ESSAY_PROPOSALS.find(item=>item.id===selectedId) || ESSAY_PROPOSALS[0]
 const options=ESSAY_PROPOSALS.filter(item=>item.level===level)
 const path=PROPOSAL_LEVELS.find(item=>item.id===level)
 useEffect(()=>{
   const restored=proposalForTopic(topic)
   if(restored){setLevel(restored.level);setSelectedId(restored.id)}
   setPending(null)
 },[topic])
 function chooseLevel(id){setLevel(id);setSelectedId(ESSAY_PROPOSALS.find(item=>item.level===id).id);setPending(null)}
 function apply(proposal){if(busy)return;onUse(proposal.title);setPending(null)}
 function useTheme(){if(busy)return;if(topic.trim()&&topic!==selected.title){setPending({proposal:selected,fromTopic:topic});return}apply(selected)}
 return <details ref={detailsRef} className="essay-proposal" open={!topic.trim()||undefined}>
 <summary><span>01 / Proposta de escrita</span><small>{topic.trim()?'Consultar propostas de treino':'Escolha um tema ou use o seu'}</small></summary>
 <div>
  <div className="proposal-catalog-heading"><div><span>CADERNO DE PROPOSTAS</span><h3>Qual caminho você quer experimentar?</h3></div><small>6 temas · escolha livre</small></div>
  <div className="proposal-levels" role="group" aria-label="Percurso de escrita">{PROPOSAL_LEVELS.map(item=><button type="button" key={item.id} aria-pressed={level===item.id} onClick={()=>chooseLevel(item.id)} disabled={busy}>{item.label}</button>)}</div>
  <p className="proposal-level-description">{path.description} Todos podem escolher qualquer percurso.</p>
  <ul className="proposal-options" aria-label={'Temas do percurso '+path.label}>{options.map(item=><li key={item.id}><button type="button" aria-pressed={selected.id===item.id} aria-controls={uid+'-preview'} disabled={busy} onClick={()=>{setSelectedId(item.id);setPending(null)}}><strong>{item.title}</strong><small>{item.focus}</small><span aria-hidden="true">{selected.id===item.id?'Em prévia':'Conhecer proposta →'}</span></button></li>)}</ul>
  <section className="proposal-preview" id={uid+'-preview'} aria-labelledby={uid+'-title'}>
   <p className="proposal-preview-status" role="status">{topic===selected.title?'Em uso no seu rascunho.':'Prévia: seu tema e seu texto só mudam ao escolher Usar esta proposta.'}</p>
   <h3 id={uid+'-title'}>{selected.title}</h3><p>{selected.question}</p>
   <div className="essay-proposal-actions"><button type="button" disabled={busy} onClick={useTheme}>Usar esta proposta</button><button type="button" onClick={()=>onGuide?.()}>Ver como construir o texto</button></div>
  {pending&&<section className="essay-proposal-confirm" aria-label="Confirmar troca do tema"><p>Trocar o tema atual por <strong>{pending.proposal.title}</strong>? Seu texto será mantido.</p><button type="button" disabled={busy} onClick={()=>{if(pending.fromTopic===topic)apply(pending.proposal)}}>Trocar apenas o tema</button><button type="button" onClick={()=>setPending(null)}>Manter meu tema</button></section>}

   <details key={selected.id+'-support'}><summary>Ler a proposta e os textos de apoio</summary><p>Defenda seu ponto de vista em um texto dissertativo-argumentativo e proponha uma intervenção para o problema, respeitando os direitos humanos.</p>{selected.support.map((item,index)=><article key={item.title}><strong>{index+1}. {item.title}</strong><small className="proposal-text-origin">{item.kind}</small><p>{item.text}</p></article>)}<small>Proposta original de treino. As sínteses e situações didáticas não são questões oficiais nem trechos literais das fontes.</small></details>
   <details key={selected.id+'-roadmap'}><summary>Roteiro para este tema</summary><dl className="proposal-roadmap">{selected.roadmap.map(([label,text])=><div key={label}><dt>{label}</dt><dd>{text}</dd></div>)}</dl><p className="proposal-caution"><strong>Ponto de atenção</strong>{selected.caution}</p></details>
   <details key={selected.id+'-source'}><summary>Consultar fonte e limites</summary><div className="proposal-source"><strong>{selected.source.institution}</strong><a href={selected.source.url} target="_blank" rel="noreferrer">{selected.source.title} ↗</a><small>{selected.source.period} · consultada em {selected.source.checkedAt.split('-').reverse().join('/')}</small><p>{selected.source.limit}</p></div></details>
   <small className="proposal-guide-note">O guia geral usa um exemplo sobre leitura. O roteiro acima acompanha o tema desta prévia.</small>
  </section>

 </div>
 </details>
}
