import { Link } from 'react-router-dom'
import ExamArena from '../components/ExamArena'
import Icon from '../components/Icons'
import './Provas.css'

export default function Provas() {
  return <main className="sd-page exam-studio-page"><header className="sd-page-heading student-page-heading"><div><span className="sd-eyebrow">PRÁTICA COM DIREÇÃO</span><h1>Uma prova. Muitas descobertas.</h1><p>Escolha uma coleção, ajuste o desafio e descubra o que merece mais atenção. Sua tentativa fica salva para continuar depois.</p></div><Link to="/aprendizagem" className="sd-button sd-button--secondary">Revisar antes de começar <Icon name="arrow" size={16} /></Link></header>
    <div className="sd-exam-intro"><article><span>01</span><p><strong>Escolha seu objetivo.</strong> Encontre uma coleção que combine com o que você está estudando.</p></article><article><span>02</span><p><strong>Ajuste seu ritmo.</strong> Defina matérias, quantidade de questões e dificuldade.</p></article><article><span>03</span><p><strong>Aprenda com a tentativa.</strong> Revise o raciocínio e acompanhe sua evolução.</p></article></div>
    <section className="sd-exam-arena"><div className="sd-section-heading"><Icon name="exam" /><div><h2>Seu próximo desafio</h2><p>Coleções autorais identificadas por origem, para você saber o que está praticando.</p></div></div><ExamArena /></section>
  </main>
}
