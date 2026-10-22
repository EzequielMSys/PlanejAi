import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ColorPicker from '../components/ColorPicker'
import ThemeToggle from '../components/ThemeToggle'
import TutorLumi from '../components/TutorLumi'
import './Landing.css'

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
  return <div className="study-landing">
    <header className="study-nav">
      <Link to="/" className="study-brand" aria-label="PlanejAI, página inicial"><Logo className="h-9 w-9" /><span>Planej<span className="brand-accent">AI</span></span></Link>
      <nav aria-label="Navegação principal"><button type="button" className="study-anchor-button" onClick={() => irParaSecao('recursos')}>O que você encontra</button><button type="button" className="study-anchor-button" onClick={() => irParaSecao('como-funciona')}>Como começar</button></nav>
      <div className="study-nav-actions"><ColorPicker /><ThemeToggle /><Link to="/login" className="study-login">Entrar</Link></div>
    </header>
    <main id="conteudo-principal" tabIndex={-1}>
      <section className="study-hero">
        <div className="study-hero-copy">
          <p className="study-kicker">ESPAÇO PARA APRENDER · PLANEJAI</p>
          <h1>Seu futuro.<br />Uma página<br /><em>por vez.</em></h1>
          <p className="study-lead">Entre a vontade de aprender e o próximo passo, existe um lugar seu. Organize os estudos, tire dúvidas e veja o que já conquistou.</p>
          <div className="study-actions"><Link to="/register" className="study-button">Começar meu caderno <span aria-hidden="true">↗</span></Link><button type="button" className="study-anchor-button" onClick={() => irParaSecao('como-funciona')}>Conhecer o PlanejAI <span aria-hidden="true">↓</span></button></div>
          <p className="study-caption">No seu tempo. Do seu jeito. Com direção.</p>
        </div>
        <div className="study-desk" aria-label="Exemplo de organização de estudos">
          <div className="study-note"><span>um lembrete</span><p>Você não precisa<br />aprender tudo hoje.</p><svg viewBox="0 0 140 25" aria-hidden="true"><path d="M4 15 Q65 0 130 13 M110 4l22 9-20 9" /></svg></div>
          <div className="study-notebook">
            <div className="notebook-heading"><span>MEU CADERNO</span><span>EXEMPLO / 01</span></div>
            <h2>Hoje, um pouco<br /><em>mais longe.</em></h2>
            <div className="notebook-date">Três momentos para aprender</div>
            <ol>
              <li><span className="notebook-check">✓</span><div><b>Rever o que ficou</b><small>Revisão ativa · 15 min</small></div><span>01</span></li>
              <li className="notebook-current"><span className="notebook-check">↗</span><div><b>Dar sentido às funções</b><small>Matemática · 30 min</small></div><span>02</span></li>
              <li><span className="notebook-check">✎</span><div><b>Colocar ideias no papel</b><small>Redação · 25 min</small></div><span>03</span></li>
            </ol>
            <footer><span>O próximo passo já é um começo.</span><Logo className="h-7 w-7" /></footer>
          </div>
          <span className="study-desk-caption">MENOS RUÍDO. MAIS ESPAÇO PARA PENSAR.</span>
        </div>
      </section>
      <section className="study-manifesto"><span>APRENDER É UM PROCESSO</span><p>Um lugar para organizar.<br /><em>Liberdade para descobrir.</em></p><span>PLANEJAR / PRATICAR / EVOLUIR</span></section>
      <section className="study-lumi" aria-labelledby="study-lumi-title">
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
      <section className="study-invitation"><p className="study-kicker">O ESPAÇO É SEU</p><h2>O que você quer<br /><em>aprender agora?</em></h2><Link to="/register" className="study-button">Criar minha conta <span aria-hidden="true">↗</span></Link><p>Escolha suas cores no topo e sinta-se em casa.</p></section>
    </main>
    <footer className="study-footer"><Link to="/" className="study-brand"><Logo className="h-8 w-8" /><span>PlanejAI</span></Link><p>Aprender transforma o que vem depois.</p><small>© {new Date().getFullYear()} PlanejAI</small></footer>
  </div>
}
