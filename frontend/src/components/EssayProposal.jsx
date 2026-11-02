import { useState } from 'react'
import { ESSAY_THEME } from '../utils/essayGuideContent'
import './EssayGuide.css'
export default function EssayProposal({topic,onUse,onGuide,detailsRef}){
 const [confirm,setConfirm]=useState(false)
 function useTheme(){if(topic.trim()&&topic!==ESSAY_THEME){setConfirm(true);return}onUse(ESSAY_THEME)}
 return <details ref={detailsRef} className="essay-proposal" open={!topic.trim()||undefined}><summary><span>01 / Proposta de escrita</span><small>{topic.trim()?'Consultar proposta de treino':'Comece por um tema ou use o seu'}</small></summary><div>
 <h3>{ESSAY_THEME}</h3><p>Escreva um texto dissertativo-argumentativo: defenda seu ponto de vista e proponha uma intervenção para o problema, respeitando os direitos humanos.</p>
 <details><summary>Ler os textos de apoio</summary><article><strong>1. Acesso além da estante</strong><p>Imagine uma escola cuja biblioteca só abre durante as aulas. O acervo existe, mas nem todos conseguem usá-lo no tempo livre. Que mudanças poderiam aproximar os estudantes dos livros?</p></article><article><strong>2. Escolher e conversar</strong><p>Em um grupo de leitura, os participantes sugerem obras e discutem interpretações. Além de disponibilizar livros, criar espaço para escolhas e trocas pode fazer parte do incentivo à leitura.</p></article><small>Textos didáticos originais do PlanejAI. A primeira situação é hipotética. Esta é uma proposta de treino, não uma questão oficial.</small></details>
 <div className="essay-proposal-actions"><button type="button" onClick={useTheme}>Usar esta proposta</button><button type="button" onClick={onGuide}>Ver como construir o texto</button></div>
 {confirm&&<section className="essay-proposal-confirm" aria-label="Confirmar troca do tema"><p>Trocar o tema atual por esta proposta? Seu texto será mantido.</p><button type="button" onClick={()=>{onUse(ESSAY_THEME);setConfirm(false)}}>Trocar apenas o tema</button><button type="button" onClick={()=>setConfirm(false)}>Manter meu tema</button></section>}
 </div></details>
}
