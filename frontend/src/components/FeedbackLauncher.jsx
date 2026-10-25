import {useRef,useState} from 'react'
import {useLocation} from 'react-router-dom'
import {sendSupport} from '../services/operationsService'
import {currentUser} from '../utils/offlineStore'
import useDialogFocus from '../hooks/useDialogFocus'
import './FeedbackLauncher.css'

const MAX_IMAGE=700*1024
export default function FeedbackLauncher(){
  const location=useLocation(),panel=useRef(null),sending=useRef(false),reading=useRef(0)
  const [kind,setKind]=useState(null),[page,setPage]=useState(''),[message,setMessage]=useState(''),[details,setDetails]=useState(''),[image,setImage]=useState(null),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[imageBusy,setImageBusy]=useState(false)
  const owner=useRef(null)
  function close(){if(sending.current)return;if((message||details||image)&&!window.confirm('Fechar e descartar este feedback que ainda não foi enviado?'))return;reading.current++;setKind(null);setMessage('');setDetails('');setImage(null);setPreview(false);setError('');setImageBusy(false)}
  useDialogFocus(panel,Boolean(kind),close,busy)
  function open(value){owner.current=currentUser();setKind(value);setPage(location.pathname);setNotice('');setError('')}
  async function attach(event){
    const file=event.target.files?.[0];event.target.value='';if(!file)return
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>MAX_IMAGE){setError('Escolha uma captura PNG, JPG ou WEBP de até 700 KB. Você também pode enviar sem captura.');return}
    const request=++reading.current;setImageBusy(true);setError('')
    try{const data=await new Promise((resolve,reject)=>{const reader=new window.FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});if(request===reading.current && owner.current===currentUser())setImage({name:file.name,mime:file.type,base64:String(data).split(',')[1]})}
    catch{if(request===reading.current)setError('Não foi possível abrir a captura. O texto continua disponível.')}
    finally{if(request===reading.current)setImageBusy(false)}
  }
  function review(event){event.preventDefault();if(message.trim().length<10){setError('Descreva sua ideia ou o problema com pelo menos 10 caracteres.');return}setError('');setPreview(true)}
  async function send(){
    if(sending.current || imageBusy || owner.current!==currentUser())return
    sending.current=true;setBusy(true);setError('')
    try{const result=await sendSupport({categoria:kind,pagina:page,mensagem:message.trim(),detalhes:details.trim(),...(image?{captura:{mime:image.mime,base64:image.base64}}:{})},owner.current);if(owner.current!==currentUser())return;if(!result?.id)throw Error('Sem confirmação');setNotice(`Feedback #${result.id} recebido. Acompanhe a resposta em Meu espaço → Meus pedidos.`);setKind(null);setMessage('');setDetails('');setImage(null);setPreview(false)}
    catch(failure){if(owner.current===currentUser())setError(failure.response?.data?.message||'Não foi possível confirmar o envio. Seu texto e a captura continuam aqui para tentar novamente.')}
    finally{sending.current=false;setBusy(false)}
  }
  return <>
    <aside className="feedback-entry" aria-label="Sua opinião sobre o PlanejAI"><span>Ajude a melhorar seu espaço.</span><div><button type="button" onClick={()=>open('PROBLEMA')}>Relatar um problema</button><button type="button" onClick={()=>open('MELHORIA')}>Sugerir melhoria</button></div>{notice&&<p role="status">{notice}</p>}</aside>
    {kind&&<div className="feedback-backdrop"><section ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="feedback-title" className="feedback-dialog"><header role="none"><div><span>CONVERSAR COM A EQUIPE</span><h2 id="feedback-title">{preview?'Confira antes de enviar':kind==='PROBLEMA'?'Relatar um problema':'Sugerir melhoria'}</h2></div><button type="button" onClick={close} disabled={busy} aria-label="Fechar feedback">×</button></header>
      <p>O pedido será vinculado à sua conta e ficará disponível para você e para o responsável pelo atendimento. Não inclua senhas ou chaves.</p>
      {preview?<div className="feedback-preview"><dl><dt>Assunto</dt><dd>{kind==='PROBLEMA'?'Problema no site':'Sugestão de melhoria'}</dd><dt>Página</dt><dd>{page}</dd><dt>Mensagem</dt><dd>{message.trim()}</dd><dt>Informações adicionais</dt><dd>{details.trim()||'Nenhuma'}</dd><dt>Captura</dt><dd>{image?image.name:'Nenhuma'}</dd></dl>{image&&<img src={`data:${image.mime};base64,${image.base64}`} alt="Captura escolhida para enviar à equipe"/>}<p>Somente os campos apresentados e a identificação da sua conta serão enviados. A captura é opcional.</p><footer><button type="button" disabled={busy} onClick={()=>{setPreview(false);setError('')}}>Voltar e editar</button><button type="button" disabled={busy} onClick={send}>{busy?'Enviando…':'Confirmar envio do feedback'}</button></footer></div>:<form onSubmit={review}><fieldset disabled={busy}><label>Página do PlanejAI<input readOnly value={page}/></label><label>{kind==='PROBLEMA'?'O que aconteceu?':'O que você gostaria de melhorar?'}<textarea required minLength={10} maxLength={2000} rows={4} value={message} onChange={event=>setMessage(event.target.value)}/></label><label>Informações adicionais <small>(opcional)</small><textarea maxLength={1000} rows={2} placeholder="Passos para reproduzir ou um exemplo da sua sugestão." value={details} onChange={event=>setDetails(event.target.value)}/></label><label>Captura de tela <small>(opcional · PNG, JPG ou WEBP até 700 KB)</small><input type="file" accept="image/png,image/jpeg,image/webp" onChange={attach} disabled={imageBusy}/></label>{imageBusy&&<p role="status">Preparando prévia da captura…</p>}{image&&<div className="feedback-image"><img src={`data:${image.mime};base64,${image.base64}`} alt="Prévia local da captura, ainda não enviada"/><button type="button" onClick={()=>{reading.current++;setImage(null)}}>Retirar captura</button></div>}<p>Confira se a captura contém informações que você prefere não compartilhar. Nenhuma captura é feita automaticamente.</p><button type="submit" disabled={imageBusy}>Revisar o que será enviado</button></fieldset></form>}{error&&<p role="alert" className="feedback-error">{error}</p>}
    </section></div>}
  </>
}
