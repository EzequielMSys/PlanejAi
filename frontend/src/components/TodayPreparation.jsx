import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import service from '../services/guidedStudyService'
import { currentUser } from '../utils/offlineStore'
import './GuidedStudy.css'
const date=value=>new Date(value.slice(0,10)+'T12:00:00').toLocaleDateString('pt-BR')
const kinds={estudo:'Entender',pratica:'Praticar',revisao:'Recuperar sem consultar',final:'Revisão final'}
function TodayPreparationContent() {
  const [data,setData] = useState(null), [error,setError] = useState(false), [retry,setRetry] = useState(0)
  useEffect(() => { const abort = new window.AbortController(), owner=currentUser(); service.today(abort.signal).then(v => {if (!abort.signal.aborted && owner===currentUser()) {setData(v);setError(false)}}).catch(() => {if(!abort.signal.aborted)setError(true)}); return () => abort.abort() },[retry])
  if(error) return <aside className="guided-today"><p>Não foi possível consultar suas preparações e retomadas.</p><button onClick={()=>setRetry(v=>v+1)}>Tentar novamente</button></aside>
  if(!data?.preparation && data?.recovery) { const r=data.recovery;return <aside className="guided-today"><span className="pj-eyebrow">DEPOIS DA PROVA · UMA NOVA DIREÇÃO</span><h2>{r.task.title}</h2><p>{r.task.minutes} minutos · {r.title}. {r.task.reason}</p><Link to={`/preparacao-provas?plano=${r.id}`}>Continuar a recuperação que escolhi →</Link></aside> }
  if(!data?.preparation && data?.postExam) return <aside className="guided-today"><span className="pj-eyebrow">O QUE A PROVA MOSTROU?</span><h2>Refletir sobre {data.postExam.title}</h2><p>Cerca de 8 minutos para registrar o que funcionou, onde travou e escolher o que vale retomar. A nota é opcional.</p><Link to={`/preparacao-provas?plano=${data.postExam.id}`}>Abrir o fechamento da preparação →</Link></aside>
  if(!data?.preparation && !data?.evidence && data?.project) return <aside className="guided-today"><span className="pj-eyebrow">MEU PROJETO · PRÓXIMO PASSO ESCOLHIDO</span><h2>{data.project.next.title}</h2><p>{data.project.next.minutes} minutos · {data.project.title}. {data.project.next.reason}</p><Link to={`/projetos-investigacao?projeto=${data.project.id}`}>Continuar minha investigação →</Link></aside>
  if(!data?.preparation && !data?.evidence && data?.laboratory) return <aside className="guided-today"><span className="pj-eyebrow">A MESMA IDEIA, OUTRO CONTEXTO</span><h2>{data.laboratory.title}</h2><p>Cerca de 15 minutos. Já se passaram alguns dias: tente aplicar a ideia em uma situação diferente antes de reler seu raciocínio.</p><Link to={`/laboratorio?investigacao=${data.laboratory.id}`}>Retomar minha investigação →</Link></aside>
  if(!data?.preparation && !data?.evidence) return null
  const p=data.preparation, e=data.evidence
  return <aside className="guided-today"><span className="pj-eyebrow">{p ? 'SUA PRÓXIMA PROVA' : 'RECUPERAR E APLICAR'}</span><h2>{p ? `${kinds[p.task.kind]}: ${p.topic}` : `Tentar novamente: ${e.title}`}</h2><p>{p ? `${p.task.minutes} minutos · ${p.title}, em ${date(p.date)}. ${p.overdue ? 'Este passo ficou pendente; reorganize o plano se seu tempo mudou.' : 'Este passo respeita sua disponibilidade e o diagnóstico que você informou.'}` : 'Cerca de 10 minutos. Já se passaram alguns dias: tente responder antes de reler sua versão anterior.'}</p><Link to={p ? `/preparacao-provas?plano=${p.id}` : `/meu-entendimento?ciclo=${e.id}`}>{p ? 'Continuar minha preparação' : 'Fazer uma nova tentativa'} →</Link></aside>
}

export default function TodayPreparation() { return <TodayPreparationContent key={currentUser()}/> }
