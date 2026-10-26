import { Link } from 'react-router-dom'
import GuidedStudy from '../components/GuidedStudy'
export default function ExamPreparation() {
  return <main className="guided-page pj-page"><div className="pj-wrap"><header className="guided-heading"><span className="pj-eyebrow">UMA LINHA ATÉ A SUA PROVA</span><h1>Preparar com direção.<br/><em>Chegar com mais clareza.</em></h1><p>Parta do que sabe, reserve espaço para tentar de novo e ajuste a preparação ao tempo que realmente tem.</p><Link to="/provas">Provas e simulados →</Link></header><GuidedStudy kind="prova"/></div></main>
}
