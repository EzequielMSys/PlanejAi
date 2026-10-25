import {useEffect,useRef,useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {downloadTextCopy} from '../utils/downloadTextCopy'
import './StudyReturn.css'
export default function SessionClosingSummary({closure,notesPending,notesReconfirmed,notes,onRetryNotes}) {
  const navigate=useNavigate(),heading=useRef(null)
  const [busy,setBusy]=useState(false)
  useEffect(()=>{heading.current?.focus({preventScroll:true});window.scrollTo({top:0,left:0,behavior:'instant'})},[])
  const summary=closure.sintese
  const openDoubt=id=>navigate('/aprendizagem',{state:{aba:'diario',tipo:'duvida',registro:id}})
  return <main className="pj-page session-closing"><div className="pj-wrap">
    <header><span className="pj-eyebrow">UM PASSO PRESERVADO</span><h1 tabIndex={-1} ref={heading}>Você pode fechar este capítulo.</h1><p>O fechamento foi confirmado na sua conta. Escolha com tranquilidade como continuar.</p></header>
    <section className="closing-subject pj-panel"><span>{summary.disciplina}</span><h2>{summary.titulo}</h2><p>{summary.minutos} min registrados · {({DIFICIL:'Ainda difícil',LEMBREI:'Entendi',DOMINEI:'Consigo explicar'})[summary.resultado]}</p></section>
    <div className="closing-grid"><section className="pj-panel"><span className="pj-eyebrow">O QUE FICOU REGISTRADO</span><h2>Suas ideias têm continuidade.</h2><ul><li>{summary.anotacoes?'Anotação confirmada no período desta sessão.':'Sem nova anotação confirmada no período desta sessão.'}</li><li>{summary.explicacoes?`${summary.explicacoes} ${summary.explicacoes===1?'versão de explicação preservada':'versões de explicações preservadas'} no período.`:'Nenhuma nova explicação registrada no período.'}</li></ul><p className="closing-caption">A síntese considera registros deste assunto salvos na conta durante o período de estudo, inclusive em outro aparelho.</p>
      {notesPending && <div role="alert" className="closing-note-warning"><h3>Suas anotações atuais estão só neste aparelho.</h3><p>O fechamento está confirmado, mas o envio dessas anotações ainda não foi confirmado.</p><button type="button" disabled={busy} onClick={async()=>{setBusy(true);try{await onRetryNotes()}finally{setBusy(false)}}}>{busy?'Conferindo envio…':'Tentar enviar anotações'}</button><button type="button" onClick={()=>downloadTextCopy(notes,'planejai-anotacoes.txt')}>Baixar cópia das anotações</button></div>}
      {notesReconfirmed && <p role="status">Anotações reenviadas e confirmadas na conta após o fechamento.</p>}
    </section><section className="pj-panel"><span className="pj-eyebrow">O QUE AINDA PODE CRESCER</span><h2>{summary.totalDuvidas?'Uma dúvida também é um próximo passo.':'Um espaço para a próxima descoberta.'}</h2>{summary.totalDuvidas?<><p>{summary.totalDuvidas} {summary.totalDuvidas===1?'dúvida continua aberta':'dúvidas continuam abertas'} neste assunto.</p><ul className="closing-doubts">{summary.duvidas.map(doubt=><li key={doubt.id}><button type="button" onClick={()=>openDoubt(doubt.id)}>{doubt.titulo} <span aria-hidden="true">↗</span></button></li>)}</ul>{summary.totalDuvidas>summary.duvidas.length && <p>As demais dúvidas ficam em Aprendizagem → Minhas palavras e dúvidas.</p>}</>:<p>Nenhuma dúvida aberta foi encontrada para este assunto no momento do fechamento.</p>}</section></div>
    <section className="closing-next pj-panel"><span className="pj-eyebrow">DE VOCÊ, PARA O PRÓXIMO ESTUDO</span><h2>{closure.proximo_passo?'Um ponto de partida já escolhido.':'Seu próximo passo pode ser pequeno.'}</h2><p>{closure.proximo_passo || 'Na tela Hoje, você pode escolher uma explicação para refazer, uma dúvida para investigar ou uma revisão.'}</p>{closure.proximo_passo && <small>Este lembrete foi salvo na conta e aparecerá em Hoje até você marcá-lo como feito.</small>}</section>
    <nav className="closing-actions" aria-label="Continuar após a sessão"><button type="button" onClick={()=>navigate('/inicio')}>Voltar para Hoje <span aria-hidden="true">→</span></button><button type="button" onClick={()=>navigate('/cronograma')}>Ver meu cronograma</button></nav>
  </div></main>
}
