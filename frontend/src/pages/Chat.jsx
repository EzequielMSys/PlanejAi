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
        <div className="lumi-page-kicker">PLANEJAI / UM ESPAÇO PARA PERGUNTAR</div>
        <h1>Aprender fica mais leve<br />quando a conversa continua.</h1>
        <p>Uma dúvida simples, uma ideia difícil ou um plano para hoje: a Lumi acompanha o seu raciocínio e adapta a explicação ao seu estudo.</p>
      </header>

      <div className="lumi-page-grid">
        <aside className="lumi-intro" aria-label="Sobre a Lumi">
          <div className="lumi-portrait"><TutorLumi tamanho={150} humor={humorLumi} rotulo={`Lumi, gata tutora de estudos: ${estados[humorLumi]}`} /></div>
          <span className="lumi-intro-label">SUA COMPANHEIRA DE ESTUDOS</span>
          <h2>Oi, sou a Lumi.</h2>
          <span className="lumi-mood" aria-live="polite">{estados[humorLumi]}</span>
          <p>Posso explicar de outro jeito, propor um exercício e ajudar você a retomar uma lição. Diga o que já tentou; assim seguimos do ponto certo.</p>
          <div className="lumi-intro-note"><strong>Uma conversa sua</strong><span>Quando houver dados na sua conta, uso matérias, andamento do cronograma, revisões e redações para dar contexto à resposta.</span></div>
        </aside>

        <section className="lumi-chat-card" aria-label="Conversa com a Lumi">
          <div className="lumi-chat-heading"><span className="lumi-chat-status" aria-hidden="true" /><div><strong>Conversa com a Lumi</strong><small>Pergunte no seu ritmo</small></div></div>
          <ChatInterface className="lumi-chat-body" onEstadoChange={setHumorLumi} redacaoSelecionada={location.state?.redacaoSelecionada} perguntaInicial={location.state?.perguntaInicial} />
        </section>
      </div>
    </main>
  )
}
