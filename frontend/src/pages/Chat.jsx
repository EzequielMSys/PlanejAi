import {useEffect,useRef} from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fraseConviteLumi } from '../utils/pronounCopy'
import ChatInterface from '../components/ChatInterface'
import './Chat.css'

export default function Chat() {
  const cardRef=useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const conversation = params.get('conversa')
  const { user } = useAuth()

  useEffect(()=>{
    let active=true
    const fit=()=>{const card=cardRef.current;if(!active||!card)return;const height=window.visualViewport?.height||window.innerHeight;card.style.setProperty('--lumi-card-height',`${Math.max(360,height-Math.max(16,card.getBoundingClientRect().top)-88)}px`)}
    fit();const frame=window.requestAnimationFrame(fit);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);document.fonts?.ready.then(fit)
    return()=>{active=false;window.cancelAnimationFrame(frame);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit)}
  },[])

  return (
    <main className="lumi-page">
      <header className="lumi-page-heading">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar à página anterior" className="lumi-back">← Voltar</button>
        <div className="lumi-page-heading-row"><div><span className="lumi-page-kicker">SEU ESPAÇO DE ESTUDOS</span><h1>Converse com a Lumi.</h1></div><p>{fraseConviteLumi(user?.pronome)} Uma dúvida ou uma ideia já é um começo.</p></div>
      </header>

      <div className="lumi-page-grid">
        <section ref={cardRef} className="lumi-chat-card" aria-label="Conversa com a Lumi">
          <ChatInterface key={conversation||'fresh'} conversaSolicitada={/^[1-9]\d{0,14}$/.test(conversation||'')?conversation:undefined} className="lumi-chat-body" redacaoSelecionada={location.state?.redacaoSelecionada} perguntaInicial={location.state?.perguntaInicial} />
        </section>
      </div>
    </main>
  )
}
