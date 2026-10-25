import { useEffect, useState } from 'react'
import { listSupport, sendSupport, replySupport, exportAccountData, supportCapture } from '../services/operationsService'
import './SupportPanel.css'

const labels = { PROBLEMA: 'Problema no site', MELHORIA:'Sugestão de melhoria', DUVIDA: 'Dúvida', EXCLUSAO: 'Exclusão da conta', ABERTO: 'Aberto', EM_ATENDIMENTO: 'Em atendimento', RESOLVIDO: 'Resolvido' }
const errorMessage = error => error.response?.data?.message || error.response?.data?.error || error.message || 'Não foi possível concluir. Tente novamente.'

export default function SupportPanel({ owner = false }) {
  const [requests, setRequests] = useState([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('PROBLEMA')
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const [notice, setNotice] = useState('')
  async function load() {
    setLoading(true); setError('')
    try { const data = await listSupport(owner); if (!Array.isArray(data)) throw new Error('Resposta de atendimento inválida. Tente novamente.'); setRequests(data) } catch (failure) { setError(errorMessage(failure)) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [owner])
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      const result = await sendSupport({ categoria: category, mensagem: message, confirmacao: confirmation ? 'SOLICITAR EXCLUSAO' : '' })
      setMessage(''); setConfirmation(false); setNotice(`Pedido #${result.id} recebido. Acompanhe a resposta aqui.`); await load()
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  async function download() {
    setBusy(true); setError('')
    try {
      const data = await exportAccountData()
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a'); link.href = url; link.download = 'meus-dados-planejai.json'; link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (failure) { setError(errorMessage(failure)) } finally { setBusy(false) }
  }
  return <section className="support-panel" aria-label={owner ? 'Central de atendimento' : 'Ajuda e seus dados'}>
    <h2>{owner ? 'Central de atendimento' : 'Ajuda e seus dados'}</h2>
    <p>{owner ? 'Responda aos pedidos dentro da plataforma. Confirme a execução da exclusão antes de encerrar um pedido desse tipo.' : 'Converse com a equipe do PlanejAI e acompanhe seus pedidos neste espaço. Não envie senhas, chaves ou dados sensíveis.'}</p>
    {!owner && <><button type="button" disabled={busy} onClick={download}>Baixar meus dados</button><form onSubmit={submit}><fieldset disabled={busy}><label>Assunto<select value={category} onChange={event => { setCategory(event.target.value); setConfirmation(false) }}><option value="PROBLEMA">Problema no site</option><option value="DUVIDA">Dúvida</option><option value="EXCLUSAO">Solicitar exclusão da conta</option></select></label><label>Mensagem<textarea required minLength={10} maxLength={2000} rows={4} value={message} onChange={event => setMessage(event.target.value)} /></label>{category === 'EXCLUSAO' && <label className="support-confirm"><input type="checkbox" required checked={confirmation} onChange={event => setConfirmation(event.target.checked)} /><span>Solicito a exclusão da minha conta e dos meus dados. Este pedido será analisado pela equipe; a conta permanece ativa até a conclusão. Posso baixar meus dados antes de solicitar.</span></label>}<button disabled={busy}>{busy ? 'Enviando…' : 'Enviar pedido'}</button></fieldset></form></>}
    {notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    <div className="support-heading"><h3>{owner ? 'Últimos 100 pedidos' : 'Meus pedidos'}</h3><button type="button" disabled={loading || busy} onClick={load}>{loading ? 'Consultando…' : 'Atualizar pedidos'}</button></div>
    {!loading && !error && requests.length === 0 && <p>Nenhum pedido por aqui.</p>}
    {requests.map(request => <article key={request.id}><h4>#{request.id} · {labels[request.categoria]}</h4><small>{labels[request.status]} · {new Date(request.criado_em).toLocaleDateString('pt-BR')}</small>{owner && <p>{request.nome} · {request.email}</p>}<p className="support-message">{request.mensagem}</p>{request.pagina&&<p>Página: <strong>{request.pagina}</strong></p>}{request.detalhes&&<p className="support-message">{request.detalhes}</p>}{!!Number(request.tem_captura)&&<Capture id={request.id}/>}{request.resposta && <p className="support-message"><strong>Resposta da equipe: </strong>{request.resposta}</p>}{owner && <Reply request={request} onDone={load} onError={setError} />}</article>)}
  </section>
}

function Reply({ request, onDone, onError }) {
  const [response, setResponse] = useState(request.resposta || '')
  const [status, setStatus] = useState(request.status)
  const [busy, setBusy] = useState(false)
  async function submit(event) {
    event.preventDefault(); setBusy(true)
    try { await replySupport(request.id, { resposta: response, status }); await onDone() } catch (error) { onError(errorMessage(error)) } finally { setBusy(false) }
  }
  return <form onSubmit={submit}><fieldset disabled={busy}><label>Resposta ao pedido #{request.id}<textarea rows={3} required minLength={10} maxLength={2000} value={response} onChange={event => setResponse(event.target.value)} /></label><label>Estado<select value={status} onChange={event => setStatus(event.target.value)}>{['ABERTO', 'EM_ATENDIMENTO', 'RESOLVIDO'].map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label><button>{busy ? 'Salvando…' : 'Salvar atendimento'}</button></fieldset></form>
}

function Capture({id}){
 const [url,setUrl]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>()=>{if(url)URL.revokeObjectURL(url)},[url])
 async function open(){setBusy(true);setError('');try{const data=await supportCapture(id);setUrl(URL.createObjectURL(data))}catch{setError('Não foi possível abrir a captura. Confira sua conexão e tente novamente.')}finally{setBusy(false)}}
 return <div className="support-capture">{url?<img src={url} alt={`Captura anexada ao pedido ${id}`}/>:<button type="button" disabled={busy} onClick={open}>{busy?'Consultando captura…':'Ver captura anexada'}</button>}{error&&<p role="alert">{error}</p>}</div>
}