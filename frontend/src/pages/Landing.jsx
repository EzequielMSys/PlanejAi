import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'

const reveal = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: .55 } } }

const recursos = [
  { tag: '01', titulo: 'Plano que se adapta', texto: 'Seu cronograma considera rotina, domínio e atrasos. Mudou o dia? O plano se reorganiza sem apagar seu progresso.', cor: 'blue' },
  { tag: '02', titulo: 'Aprender fazendo', texto: 'Atividades, simulados, redações e revisões deixam de ser ferramentas separadas e alimentam o mesmo mapa de aprendizagem.', cor: 'cyan' },
  { tag: '03', titulo: 'Professor mais próximo', texto: 'Docentes publicam desafios, materiais e feedback. O aluno entende o próximo passo sem depender de planilhas ou grupos dispersos.', cor: 'lime' }
]

function Brand() {
  return <Link to="/" className="home-brand"><Logo className="h-10 w-10" /><span>Planej<strong>AI</strong></span></Link>
}

function ProductPreview() {
  return (
    <div className="home-product">
      <div className="home-product-bar"><span><i /><i /><i /></span><small>HOJE · 3 MISSÕES</small><b>72%</b></div>
      <div className="home-product-grid">
        <aside><Logo className="h-8 w-8" />{['Visão geral', 'Meu plano', 'Atividades', 'Simulados'].map((item, index) => <span key={item} data-active={index === 1}>{item}</span>)}</aside>
        <main>
          <header><div><small>QUARTA-FEIRA</small><h3>Seu ritmo de hoje</h3></div><em>1h 45min</em></header>
          <div className="home-progress"><span style={{ width: '72%' }} /></div>
          <div className="home-missions">
            <article className="is-done"><i>✓</i><div><b>Funções exponenciais</b><small>Matemática · 35 min</small></div><span>Concluído</span></article>
            <article className="is-next"><i>02</i><div><b>Cinemática vetorial</b><small>Física · vídeo + prática</small></div><span>Começar →</span></article>
            <article><i>03</i><div><b>Revisão inteligente</b><small>8 cartões vencendo hoje</small></div><span>20 min</span></article>
          </div>
        </main>
      </div>
      <div className="home-float-card"><span>↑ 18%</span><b>Evolução semanal</b><small>Você encontrou um ritmo consistente.</small></div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="home-page">
      <nav className="home-nav"><Brand /><div><a href="#como-funciona">Como funciona</a><a href="#recursos">Recursos</a><Link to="/login">Entrar</Link><Link to="/register" className="home-nav-cta">Criar meu plano</Link><ThemeToggle /></div></nav>

      <section id="conteudo-principal" tabIndex="-1" className="home-hero">
        <div className="home-hero-copy">
          <motion.p variants={reveal} initial="hidden" animate="visible" className="home-eyebrow"><span>●</span> UMA PLATAFORMA. TODO O SEU APRENDIZADO.</motion.p>
          <motion.h1 variants={reveal} initial="hidden" animate="visible">Estudar deixa de ser uma dúvida. <em>Vira direção.</em></motion.h1>
          <motion.p variants={reveal} initial="hidden" animate="visible" className="home-lead">O PlanejAI conecta sua rotina, seus professores e seus resultados para dizer o que estudar agora — e mostrar por que esse é o próximo passo.</motion.p>
          <motion.div variants={reveal} initial="hidden" animate="visible" className="home-actions"><Link to="/register">Montar meu plano <span>→</span></Link><a href="#como-funciona">Conhecer a plataforma</a></motion.div>
          <motion.div variants={reveal} initial="hidden" animate="visible" className="home-trust"><div><strong>100+</strong><span>questões no motor adaptativo</span></div><div><strong>4</strong><span>áreas conectadas</span></div><div><strong>1</strong><span>jornada contínua</span></div></motion.div>
        </div>
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .7, delay: .15 }}><ProductPreview /></motion.div>
      </section>

      <section className="home-proof"><span>PLANEJAMENTO</span><i /> <span>PRÁTICA</span><i /> <span>FEEDBACK</span><i /> <span>EVOLUÇÃO</span></section>

      <section id="como-funciona" className="home-story">
        <div className="home-section-title"><p>DO CAOS AO PRÓXIMO PASSO</p><h2>Uma experiência que acompanha o jeito que você aprende.</h2></div>
        <div className="home-steps">
          <article><span>01</span><div><small>VOCÊ CONTA</small><h3>Objetivos e rotina</h3><p>Disponibilidade, matérias prioritárias e meta de prova entram em um perfil único.</p></div></article>
          <article><span>02</span><div><small>O PLANEJAI ORGANIZA</small><h3>Trilha possível</h3><p>O conteúdo vira sessões claras, com tempo, materiais e uma ordem que faz sentido.</p></div></article>
          <article><span>03</span><div><small>SEU RESULTADO ENSINA</small><h3>Plano mais inteligente</h3><p>Cada questão, redação e entrega melhora as próximas recomendações.</p></div></article>
        </div>
      </section>

      <section id="recursos" className="home-features">
        <div className="home-section-title is-light"><p>FEITO PARA QUEM APRENDE E QUEM ENSINA</p><h2>Profundo por dentro.<br />Simples na hora de usar.</h2></div>
        <div className="home-feature-grid">{recursos.map((item) => <article key={item.tag} data-color={item.cor}><span>{item.tag}</span><h3>{item.titulo}</h3><p>{item.texto}</p><i>↗</i></article>)}</div>
      </section>

      <section className="home-exams"><div><p>LABORATÓRIO DE PROVAS</p><h2>Treine para o desafio que está mirando.</h2><span>Monte simulados por instituição, dificuldade e quantidade. O resultado fica salvo e ajuda a orientar seu próximo ciclo de estudo.</span><Link to="/register">Explorar simulados <b>→</b></Link></div><div className="home-exam-stack"><article><small>ITA · PERFIL 2025</small><strong>Matemática + Física + Química</strong><span>Dificuldade avançada</span></article><article><small>ENEM · ESSENCIAL</small><strong>Treino interdisciplinar</strong><span>Ritmo e tomada de decisão</span></article><div><b>84%</b><span>melhor resultado</span></div></div></section>

      <section className="home-final"><Logo className="h-14 w-14" /><p>SEU PRÓXIMO PASSO COMEÇA AQUI</p><h2>Menos tempo planejando.<br />Mais clareza para avançar.</h2><Link to="/register">Criar minha conta grátis <span>→</span></Link></section>

      <footer className="home-footer"><Brand /><p>Planejamento inteligente para uma aprendizagem que continua.</p><div><Link to="/login">Entrar</Link><Link to="/register">Criar conta</Link></div><small>© {new Date().getFullYear()} PlanejAI</small></footer>
    </div>
  )
}
