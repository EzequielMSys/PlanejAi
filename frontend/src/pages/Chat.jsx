import { Link, useLocation } from 'react-router-dom'
import ChatInterface from '../components/ChatInterface'
import LumiMark from '../components/LumiMark'
import Icon from '../components/Icons'
import '../components/Lumi.css'

export default function Chat() {
  const { state } = useLocation()
  return <div className="sd-page lumi-page"><header className="lumi-page-heading student-page-heading"><div><LumiMark size={46} /><div><span className="sd-eyebrow">INTELIGÊNCIA ARTIFICIAL DO PLANEJAI</span><h1>Uma dúvida. Novas possibilidades.</h1><p>Converse com a Lumi e encontre o seu jeito de entender.</p></div></div><Link to="/preferencias" className="sd-button sd-button--secondary"><Icon name="book" size={17} />Ajustar leitura</Link></header>
    <div className="lumi-workspace"><ChatInterface initialPrompt={state?.prompt || ''} initialDiscipline={state?.disciplina || ''} /><aside className="lumi-guide"><span className="sd-eyebrow">ESTUDAR COM A LUMI</span><h2>O raciocínio também é seu.</h2><ol><li><strong>Conte onde você está.</strong><p>Diga o assunto e o que ainda não fez sentido.</p></li><li><strong>Peça um exemplo.</strong><p>Uma comparação pode abrir um novo caminho.</p></li><li><strong>Tente explicar de volta.</strong><p>Use suas palavras para perceber o que entendeu.</p></li></ol><div><Icon name="spark" /><p>Experimente perguntar:<br /><strong>“Pode explicar de outro jeito?”</strong></p></div><Link to="/aprendizagem">Levar o que aprendi para a prática <Icon name="arrow" size={16} /></Link></aside></div>
  </div>
}
