import { Link } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import Logo, { BrandName } from '../components/Logo'
import ColorPicker from '../components/ColorPicker'
import ThemeToggle from '../components/ThemeToggle'
import TutorLumi from '../components/TutorLumi'
import './Landing.css'
import BrandCover from '../components/BrandCover'
import './BrandLanding.css'

const recursos = [
  ['01', 'Um plano que cabe na vida.', 'Distribua as matérias no tempo que você tem. Retome o que ficou para depois e enxergue o próximo passo.', '/cronograma', 'Organizar meus estudos'],
  ['02', 'Entender vale mais que decorar.', 'Converse com o tutor, peça outro exemplo e pratique com questões. Aprenda a explicar com suas palavras.', '/chat', 'Conhecer o assistente'],
  ['03', 'Sua escrita, em construção.', 'Reúna versões, revise argumentos e acompanhe a evolução das suas redações em um só lugar.', '/redacoes', 'Explorar redações'],
  ['04', 'Aprender também é compartilhar.', 'Atividades, materiais e avisos aproximam a sua rotina da turma e de quem ensina.', '/minhas-turmas', 'Encontrar minha turma'],
]

function irParaSecao(id) {
  const secao = document.getElementById(id)
  if (!secao) return
  const movimentoReduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  secao.scrollIntoView({ behavior: movimentoReduzido ? 'auto' : 'smooth', block: 'start' })
  secao.focus({ preventScroll: true })
}

export default function Landing() {
  const menuRef = useRef(null)
  const closeMenu = () => { if (menuRef.current) menuRef.current.open = false }
  useEffect(() => {
    const dismiss = event => {
      const menu = menuRef.current
      if (!menu?.open) return
      if (event.type === 'keydown' && event.key === 'Escape') {
        menu.open = false
        menu.querySelector('summary').focus()
      } else if (event.type === 'pointerdown' && !menu.contains(event.target)) menu.open = false
    }
    document.addEventListener('keydown', dismiss)
    document.addEventListener('pointerdown', dismiss)
    return () => {
      document.removeEventListener('keydown', dismiss)
      document.removeEventListener('pointerdown', dismiss)
    }
  }, [])
  const openSection = id => { closeMenu(); irParaSecao(id) }
  return <div className="study-landing">
    <header className="study-nav">
      <Link to="/" className="study-brand" aria-label="PlanejAI, página inicial"><Logo decorative className="h-9 w-9" /><BrandName/></Link>
      <div className="study-nav-actions">
        <Link to="/login" className="study-login">Entrar</Link>
        <details className="study-menu" ref={menuRef}>
          <summary aria-controls="study-menu-content"><span aria-hidden="true">☰</span> Menu</summary>
          <div id="study-menu-content" className="study-menu-panel">
            <nav aria-label="Navegação principal">
              <button type="button" onClick={() => openSection('recursos')}>Ferramentas de estudo</button>
              <button type="button" onClick={() => openSection('lumi')}>Conheça a Lumi</button>
              <button type="button" onClick={() => openSection('como-funciona')}>Como começar</button>
            </nav>
            <div className="study-menu-account"><p>Sua conta</p><Link to="/register" onClick={closeMenu}>Criar minha conta ↗</Link><Link to="/login" onClick={closeMenu}>Já tenho conta · Entrar</Link></div>
            <div className="study-menu-preferences"><p>Do seu jeito</p><div><ColorPicker /><ThemeToggle /></div></div>
          </div>
        </details>
      </div>
    </header>
    <main id="conteudo-principal" tabIndex={-1}>
      <section className="study-hero">
        <div className="study-hero-copy">
          <p className="study-kicker">ESPAÇO PARA APRENDER · PLANEJAI</p>
          <h1>Uma ideia.<br /><em>Abre outra.</em></h1>
          <p className="study-lead">Organize o que estudar, encontre sentido nas dúvidas e reconheça o que aprendeu. Seu plano, sua escrita e a Lumi, no mesmo espaço.</p>
          <div className="study-actions"><Link to="/register" className="study-button">Começar meu caderno <span aria-hidden="true">↗</span></Link><button type="button" className="study-anchor-button" onClick={() => irParaSecao('como-funciona')}>Conhecer o PlanejAI <span aria-hidden="true">↓</span></button></div>
          <p className="study-caption">No seu tempo. Do seu jeito. Com direção.</p>
        </div>
        <BrandCover/>
      </section>
      <section id="lumi" className="study-lumi" aria-labelledby="study-lumi-title" tabIndex={-1}>
        <div className="study-lumi-copy"><p className="study-kicker">CONHEÇA A LUMI</p><h2 id="study-lumi-title">Toda pergunta merece<br /><em>uma conversa de verdade.</em></h2><p>Quando uma explicação não encaixa, tente outro caminho. A Lumi pode retomar suas lições, explorar suas dúvidas e seguir no seu ritmo.</p><Link to="/chat" className="study-lumi-link">Conversar com a Lumi <span aria-hidden="true">↗</span></Link></div>
        <div className="study-lumi-example" aria-label="Exemplo de conversa com a Lumi"><div className="study-lumi-example-top"><TutorLumi tamanho={60} rotulo="Lumi, gata tutora" /><div><strong>Lumi</strong><small>Apoio para seus estudos</small></div></div><p className="study-lumi-question">“Por que essa função muda de sinal?”</p><div className="study-lumi-answer"><strong>Vamos olhar passo a passo.</strong><p>O sinal muda quando o resultado passa por zero. Primeiro encontramos esse ponto; depois testamos um valor de cada lado para entender o que acontece.</p></div><span className="study-lumi-example-foot">UM EXEMPLO · CADA CONVERSA SEGUE A SUA DÚVIDA</span></div>
      </section>
      <section id="recursos" className="study-resources" tabIndex={-1}>
        <div className="study-section-heading"><p className="study-kicker">SEU ESTUDO, POR INTEIRO</p><h2>As ferramentas certas.<br /><em>O caminho é seu.</em></h2></div>
        <div className="study-resource-grid">{recursos.map(([number, title, text, route, label]) => <article key={number}><span className="study-resource-number">{number}</span><h3>{title}</h3><p>{text}</p><Link to={route}>{label}<span aria-hidden="true">↗</span></Link></article>)}</div>
      </section>
      <section id="como-funciona" className="study-start" tabIndex={-1}>
        <div><p className="study-kicker">SEM COMPLICAR</p><h2>Comece de onde<br /><em>você está.</em></h2><p>Não existe uma rotina perfeita. Existe a que funciona para você — e ela pode mudar.</p></div>
        <ol>{[['Conte o que você busca', 'Seu objetivo, suas matérias e o tempo disponível ajudam a montar o plano.'], ['Encontre seu ritmo', 'Estude, pratique e converse com o assistente quando precisar de outra explicação.'], ['Volte e perceba a diferença', 'Use seus resultados para revisar dificuldades e escolher os próximos passos.']].map(([title, text], i) => <li key={title}><span>0{i + 1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
    </main>
    <footer className="study-footer"><Link to="/" className="study-brand"><Logo decorative className="h-8 w-8" /><BrandName/></Link><p>Aprender transforma o que vem depois.</p><small>© {new Date().getFullYear()} PlanejAI</small></footer>
  </div>
}
