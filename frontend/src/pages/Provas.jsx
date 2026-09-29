import { useNavigate } from 'react-router-dom'
import ExamArena from '../components/ExamArena'
import './Provas.css'

export default function Provas() {
  const navigate = useNavigate()

  return <main className="exam-studio-page">
    <section className="exam-studio-hero">
      <div className="exam-studio-nav"><span>PLANEJAI / LABORATÓRIO</span><button type="button" onClick={() => navigate('/planejamento-inteligente')}>Ver estratégia <i>→</i></button></div>
      <div className="exam-studio-heading"><div><p><i /> MODO PROVA, COM CONTEXTO</p><h1>Não é só acertar.<br /><em>É entender sua rota.</em></h1><span>Escolha uma coleção, ajuste o desafio e acompanhe uma tentativa que continua salva na sua conta.</span></div><aside><small>DESAFIO ATIVO</small><b>AVANÇADO</b><p>Problemas de múltiplas etapas e alternativas de raciocínio.</p><div><i /> progresso sincronizado</div></aside></div>
      <div className="exam-studio-steps"><article><b>01</b><span>Escolha a prova que faz sentido para o seu objetivo.</span></article><article><b>02</b><span>Defina quantidade e intensidade para o treino de hoje.</span></article><article><b>03</b><span>Retome, corrija e transforme o resultado em direção.</span></article></div>
    </section>
    <section className="exam-studio-arena"><header><div><span>COLEÇÕES DISPONÍVEIS</span><h2>Monte uma prova que te puxe para frente.</h2></div><p>As coleções são autorais, inspiradas no perfil de cada instituição e identificadas com transparência.</p></header><ExamArena /></section>
  </main>
}
