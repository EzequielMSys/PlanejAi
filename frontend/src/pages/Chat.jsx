import {useEffect,useRef} from 'react'
import AreaSignature from '../components/AreaSignature'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatInterface from '../components/ChatInterface'
import TutorLumi from '../components/TutorLumi'
import { fraseConviteLumi } from '../utils/pronounCopy'
import './Chat.css'

export default function Chat() {
  const cardRef=useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const conversation = params.get('conversa')
  const { user } = useAuth()
  const convite = fraseConviteLumi(user?.pronome)

  useEffect(()=>{
    let active=true
    const fit=()=>{const card=cardRef.current;if(!active||!card)return;const height=window.visualViewport?.height||window.innerHeight;card.style.setProperty('--lumi-card-height',`${Math.max(360,height-Math.max(16,card.getBoundingClientRect().top)-16)}px`)}
    fit();const frame=window.requestAnimationFrame(fit);window.addEventListener('resize',fit);window.visualViewport?.addEventListener('resize',fit);document.fonts?.ready.then(fit)
    return()=>{active=false;window.cancelAnimationFrame(frame);window.removeEventListener('resize',fit);window.visualViewport?.removeEventListener('resize',fit)}
  },[])

  return (
    <main className="lumi-page">
      <AreaSignature area="lumi"/>
      <header className="lumi-page-heading">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar à página anterior" className="lumi-back">← Voltar</button>
        <div className="lumi-page-heading-row"><div><span className="lumi-page-kicker">SEU ESPAÇO DE ESTUDOS</span><h1>Converse com a Lumi.</h1></div><p>Uma dúvida, uma ideia ou só uma conversa.</p></div>
      </header>

      <div className="lumi-page-grid">
        <aside className="lumi-intro" aria-label="Sobre a Lumi">
          <div className="lumi-portrait"><TutorLumi tamanho={150} rotulo="Lumi, gata tutora de estudos" /></div>
          <span className="lumi-intro-label">APOIO PARA SEUS ESTUDOS</span>
          <h2>{convite}</h2>
          <p>Conte o que você tem em mente. A gente começa por aí.</p>
          <div className="lumi-intro-note"><strong>O contexto é sua escolha</strong><span>Adicione um trecho quando precisar de uma ajuda mais específica.</span></div>
        </aside>

        <section ref={cardRef} className="lumi-chat-card" aria-label="Conversa com a Lumi">
          <div className="lumi-chat-heading"><span className="lumi-chat-status" aria-hidden="true" /><div><strong>Sua conversa</strong><small>Um passo de cada vez</small></div><span className="lumi-chat-heading-tip">Lumi está aqui para estudar com você</span></div>
          <ChatInterface key={conversation||'fresh'} conversaSolicitada={/^[1-9]\d{0,14}$/.test(conversation||'')?conversation:undefined} className="lumi-chat-body" redacaoSelecionada={location.state?.redacaoSelecionada} perguntaInicial={location.state?.perguntaInicial} />
        </section>
      </div>
    </main>
  )
}
