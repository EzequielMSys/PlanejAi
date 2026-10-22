import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import ChatInterface from '../components/ChatInterface'
import TutorLumi from '../components/TutorLumi'
import './Chat.css'

export default function Chat() {
  const navigate = useNavigate()
  const location = useLocation()
  const [humorLumi, setHumorLumi] = useState('neutro')
  const estados = { neutro: 'Pronta para conversar', feliz: 'Feliz com a conversa', pensando: 'Pensando com você', surpreso: 'Surpresa com a pergunta', sonolento: 'Em uma pausa tranquila', raiva: 'Descontente com o tom da conversa' }

  return (
    <main className="lumi-page">
      <header className="lumi-page-heading">
        <button type="button" onClick={() => navigate(-1)} aria-label="Voltar à página anterior" className="lumi-back">← Voltar</button>
        <div className="lumi-page-heading-row"><div><span className="lumi-page-kicker">SEU ESPAÇO DE ESTUDOS</span><h1>Converse com a Lumi.</h1></div><p>Retome uma lição, teste uma ideia ou peça outra explicação. A conversa acompanha o seu ritmo.</p></div>
      </header>

      <div className="lumi-page-grid">
        <aside className="lumi-intro" aria-label="Sobre a Lumi">
          <div className="lumi-portrait"><TutorLumi tamanho={150} humor={humorLumi} rotulo={`Lumi, gata tutora de estudos: ${estados[humorLumi]}`} /></div>
          <span className="lumi-intro-label">COMPANHEIRA DE ESTUDOS</span>
          <h2>Vamos pensar juntas?</h2>
          <span className="lumi-mood" aria-live="polite">{estados[humorLumi]}</span>
          <p>Explique onde travou ou o que já tentou. Posso propor um exercício, revisar uma redação e ajudar a retomar seu plano.</p>
          <div className="lumi-intro-note"><strong>Uma conversa com contexto</strong><span>Quando disponíveis, suas matérias, lições e redações ajudam a tornar a resposta mais útil.</span></div>
        </aside>

        <section className="lumi-chat-card" aria-label="Conversa com a Lumi">
          <div className="lumi-chat-heading"><span className="lumi-chat-status" aria-hidden="true" /><div><strong>Sua conversa</strong><small>Um passo de cada vez</small></div><span className="lumi-chat-heading-tip">Lumi está aqui para estudar com você</span></div>
          <ChatInterface className="lumi-chat-body" onEstadoChange={setHumorLumi} redacaoSelecionada={location.state?.redacaoSelecionada} perguntaInicial={location.state?.perguntaInicial} />
        </section>
      </div>
    </main>
  )
}
