import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './Landing.css'

const reveal = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: .48 } } }

const pillars = [
  { icon: '◎', label: 'Mapa de estudo', title: 'Você sempre sabe o próximo passo.', text: 'A rotina vira um plano praticável, com tempo, matéria e motivo para cada sessão.' },
  { icon: '↗', label: 'Evidências reais', title: 'Prática que melhora o plano.', text: 'Questões, provas, redações e atividades mostram o que já está firme e o que merece atenção.' },
  { icon: '✦', label: 'Apoio humano', title: 'Sua turma no mesmo compasso.', text: 'Professores publicam materiais, acompanham entregas e dão feedback no espaço certo.' }
]

function Brand() {
  return <Link to="/" className="landing-brand" aria-label="Página inicial PlanejAI"><Logo className="h-10 w-10" /><span>Planej<strong>AI</strong><small>aprenda com direção</small></span></Link>
}

function JourneyBoard() {
  return <section className="landing-board" aria-label="Exemplo de uma jornada de estudos">
    <header><div><span>JORNADA DE HOJE</span><strong>Quarta-feira, 03</strong></div><b>02/03</b></header>
    <div className="landing-board-focus"><span>EM FOCO</span><h2>Funções<br />exponenciais</h2><p>Matemática · 35 min</p><button type="button">Começar sessão <i>→</i></button><em>01</em></div>
    <div className="landing-board-next"><span>DEPOIS</span><strong>Revisão ativa</strong><small>8 cartões para consolidar</small><i>02</i></div>
    <footer><div><span>RITMO DA SEMANA</span><strong><i /> 4 dias de sequência</strong></div><div><b>68%</b><span>meta concluída</span></div></footer>
  </section>
}

export default function Landing() {
  return <div className="landing-shell">
    <nav className="landing-nav"><Brand /><div className="landing-nav-links"><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><Link to="/login">Entrar</Link><Link to="/register" className="landing-nav-cta">Criar meu plano <span>→</span></Link><ThemeToggle /></div></nav>

    <main id="conteudo-principal" tabIndex="-1">
      <section className="landing-hero">
        <motion.div initial="hidden" animate="visible" className="landing-hero-copy">
          <motion.p variants={reveal} className="landing-kicker"><i /> UM ESPAÇO PARA APRENDER COM CALMA</motion.p>
          <motion.h1 variants={reveal}>Sua rotina de estudos,<br /><em>com um norte.</em></motion.h1>
          <motion.p variants={reveal} className="landing-lead">PlanejAI organiza o que importa agora e transforma cada tentativa em um próximo passo mais inteligente.</motion.p>
          <motion.div variants={reveal} className="landing-actions"><Link to="/register">Começar minha jornada <span>→</span></Link><a href="#como-funciona">Ver como funciona <i>↓</i></a></motion.div>
          <motion.div variants={reveal} className="landing-hero-note"><span>✦</span><p><b>Seu caminho é seu.</b> Uma plataforma para alunos, docentes e turmas aprenderem juntos.</p></motion.div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: .96, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: .65, delay: .08 }} className="landing-board-wrap"><JourneyBoard /><div className="landing-orbit landing-orbit-one" /><div className="landing-orbit landing-orbit-two" /></motion.div>
      </section>

      <section className="landing-signal" aria-label="Áreas da plataforma"><span>PLANEJAR</span><i>✦</i><span>ESTUDAR</span><i>✦</i><span>PRATICAR</span><i>✦</i><span>EVOLUIR</span></section>

      <section id="como-funciona" className="landing-way">
        <div className="landing-section-intro"><p>UMA JORNADA, NÃO UMA PILHA DE TAREFAS</p><h2>O estudo volta a fazer sentido quando tudo conversa.</h2><span>Do primeiro plano ao resultado da prova, cada parte deixa uma pista útil para a próxima.</span></div>
        <div className="landing-path">{pillars.map((pillar, index) => <article key={pillar.label}><div><i>{pillar.icon}</i><span>0{index + 1}</span></div><small>{pillar.label}</small><h3>{pillar.title}</h3><p>{pillar.text}</p></article>)}</div>
      </section>

      <section id="recursos" className="landing-lab">
        <div className="landing-lab-copy"><p>LABORATÓRIO PLANEJAI</p><h2>Uma plataforma viva para quem aprende e para quem orienta.</h2><Link to="/register">Montar meu espaço <span>→</span></Link></div>
        <div className="landing-lab-grid">
          <article className="is-large"><span>01 · CRONOGRAMA</span><h3>Planos que cabem<br />na semana real.</h3><div className="landing-mini-calendar"><b>SEG</b><i /><b>QUA</b><i /><b>SEX</b><i /></div></article>
          <article><span>02 · PROVAS</span><h3>Simulados por objetivo e nível.</h3><strong>ITA <i>+</i> ENEM</strong></article>
          <article><span>03 · ATIVIDADES</span><h3>Feedback que chega onde ele ajuda.</h3><div className="landing-mini-feedback"><i>✓</i><b>Comentário do docente</b></div></article>
        </div>
      </section>

      <section className="landing-exams"><div className="landing-exams-score"><span>SEU RITMO</span><strong>84<small>%</small></strong><p>resultado de uma jornada que aprende com você</p></div><div><p>PROVAS SEM APOSTAR NO ESCURO</p><h2>Treine o que você quer conquistar.</h2><span>Escolha vestibular, dificuldade e quantidade. O sistema preserva suas tentativas e usa o resultado para recalibrar sua rota.</span><Link to="/register">Conhecer o laboratório <b>→</b></Link></div><ol><li><b>01</b><span>Escolha uma coleção</span></li><li><b>02</b><span>Faça no seu ritmo</span></li><li><b>03</b><span>Receba o próximo passo</span></li></ol></section>

      <section className="landing-final"><div><Logo className="h-12 w-12" /><p>PLANEJAI É O SEU ESPAÇO DE APRENDER</p><h2>Estude com presença.<br /><em>Avance com clareza.</em></h2></div><Link to="/register">Criar minha conta <span>→</span></Link></section>
    </main>

    <footer className="landing-footer"><Brand /><p>Planejamento inteligente para uma aprendizagem que continua.</p><div><Link to="/login">Entrar</Link><Link to="/register">Criar conta</Link></div><small>© {new Date().getFullYear()} PlanejAI</small></footer>
  </div>
}
