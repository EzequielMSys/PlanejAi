import { motion, useReducedMotion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Logo from '../components/Logo'
import ColorPicker from '../components/ColorPicker'
import ThemeToggle from '../components/ThemeToggle'
import { useTheme } from '../context/ThemeContext'

// A entrada escalonada cria ritmo de leitura: cada bloco aparece um pouco
// depois do anterior, guiando o olho de cima para baixo.
const container = {
  oculto: {},
  visivel: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const item = {
  oculto: { opacity: 0, y: 20 },
  visivel: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.2, 0.8, 0.2, 1] } },
}

// Os quatro territórios do saber. Cada um aponta para a tela real do produto,
// então o card é clicável e leva o usuário até a ferramenta de verdade.
const TERRITORIOS = [
  {
    rotulo: 'Cronograma',
    titulo: 'Seu tempo, desenhado',
    texto: 'Sessões distribuídas na semana real e reajustadas quando a vida muda de planos.',
    rota: '/cronograma',
    marca: '◷',
  },
  {
    rotulo: 'Provas',
    titulo: 'Treine sem apostar no escuro',
    texto: 'Simulados por vestibular, objetivo e nível, com o resultado já calibrando a rota.',
    rota: '/provas',
    marca: '◎',
  },
  {
    rotulo: 'Redações',
    titulo: 'Escreva e receba retorno',
    texto: 'Escrita guiada com comentários do docente apontando exatamente onde melhorar.',
    rota: '/redacoes',
    marca: '✎',
  },
  {
    rotulo: 'Sua turma',
    titulo: 'Todo mundo no mesmo rumo',
    texto: 'Entre com o código, Activities e avisos do professor reunidos num só lugar.',
    // Antes apontava para /turmas, que é a tela de GESTÃO. Um aluno logado era
    // jogado para /dashboard em silêncio, sem entender por quê. A promessa é
    // escrita do ponto de vista do aluno, então precisa levar à tela do aluno.
    rota: '/minhas-turmas',
    marca: '◈',
  },
]

const JORNADA = [
  { titulo: 'Você marca onde está', texto: 'O sistema descobre sua base em cada disciplina e desenha o território.' },
  { titulo: 'O caminho se traça', texto: 'Um plano com etapas claras, do primeiro passo ao domínio, sempre com um destino à vista.' },
  { titulo: 'Cada passo deixa marca', texto: 'Questões, provas e redações atualizam o mapa e revelam o que falta.' },
]

function Cabecalho() {
  return (
    <header className="pn-topo">
      <Link to="/" className="pn-marca" aria-label="PlanejAI, página inicial">
        <Logo className="h-9 w-9" animado={false} />
        <span className="pn-marca-texto">Planej<strong>AI</strong></span>
      </Link>

      <nav className="pn-nav" aria-label="Navegação principal">
        <a href="#como-funciona">Como funciona</a>
        <a href="#recursos">Recursos</a>
      </nav>

      <div className="pn-acoes">
        <ColorPicker />
        <ThemeToggle />
        <Link to="/login" className="pn-btn pn-btn-fantasma">Entrar</Link>
        <Link to="/register" className="pn-btn pn-btn-primario">Criar conta</Link>
      </div>
    </header>
  )
}

// A prévia do produto: o "mapa" do aluno. Mostra uma rota real — do que já foi
// dominado ao que está em foco agora — que é a ideia central do conceito Atlas.
function PreviaMapa() {
  return (
    <div className="pn-mapa">
      <div className="pn-mapa-topo">
        <span className="pn-sobrancelha">Seu mapa</span>
        <strong>Quarta-feira</strong>
      </div>

      <ul className="pn-mapa-trilha" aria-label="Rota de estudos de hoje">
        <li data-estado="feito">
          <span className="pn-mapa-no" aria-hidden="true">✓</span>
          <div>
            <b>Revisão ativa</b>
            <small>8 cartões · concluído</small>
          </div>
        </li>
        <li data-estado="agora">
          <span className="pn-mapa-no" aria-hidden="true">2</span>
          <div>
            <b>Funções exponenciais</b>
            <small>Matemática · 35 min</small>
            <span className="pn-progresso" role="presentation"><span /></span>
          </div>
        </li>
        <li data-estado="depois">
          <span className="pn-mapa-no" aria-hidden="true">3</span>
          <div>
            <b>Redação dissertativa</b>
            <small>40 min</small>
          </div>
        </li>
      </ul>

      <div className="pn-mapa-rodape">
        <span>4 dias seguidos</span>
        <b>68% da meta</b>
      </div>
    </div>
  )
}

export default function Landing() {
  const { paletaAtiva } = useTheme()
  const reduzirMovimento = useReducedMotion()
  // Com movimento reduzido não há variantes: o conteúdo aparece direto, sem
  // depender de animação para ser lido.
  const animaContainer = reduzirMovimento ? {} : container
  const animaItem = reduzirMovimento ? {} : item

  return (
    <div className="pn-pagina">
      <a href="#conteudo-principal" className="pn-saltar">Pular para o conteúdo</a>

      <Cabecalho />

      <main id="conteudo-principal" tabIndex={-1}>
        <section className="pn-hero">
          <motion.div className="pn-hero-texto" variants={animaContainer} initial="oculto" animate="visivel">
            <motion.p variants={animaItem} className="pn-sobrancelha">
              <span className="pn-ponto" /> O conhecimento como território
            </motion.p>

            <motion.h1 variants={animaItem} className="pn-titulo">
              Saiba sempre<br />
              <em>onde está.</em>
            </motion.h1>

            <motion.p variants={animaItem} className="pn-corpo pn-hero-lead">
              O PlanejAI mapeia o que você já domina e traça a rota até onde quer
              chegar. Nada de lista solta: cada passo tem destino, e cada prova
              redesenha o caminho.
            </motion.p>

            <motion.div variants={animaItem} className="pn-hero-acoes">
              <Link to="/register" className="pn-btn pn-btn-primario">Traçar meu mapa</Link>
              <a href="#como-funciona" className="pn-btn pn-btn-fantasma">Como funciona</a>
            </motion.div>
          </motion.div>

          <motion.div
            className="pn-hero-previa"
            initial={reduzirMovimento ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <PreviaMapa />
          </motion.div>
        </section>

        <section id="recursos" className="pn-secao-bloco">
          <div className="pn-secao-cabecalho">
            <p className="pn-sobrancelha">Os territórios</p>
            <h2 className="pn-secao">Cada área do conhecimento tem seu mapa.</h2>
            <p className="pn-corpo">
              Entre em qualquer território para ver como ele funciona na prática.
            </p>
          </div>

          <div className="pn-territorios">
            {TERRITORIOS.map((t) => (
              <Link
                key={t.rotulo}
                to={t.rota}
                className="pn-territorio pn-folha-interativa"
              >
                <span className="pn-territorio-marca" aria-hidden="true">{t.marca}</span>
                <span className="pn-sobrancelha">{t.rotulo}</span>
                <h3>{t.titulo}</h3>
                <p className="pn-corpo">{t.texto}</p>
                <span className="pn-territorio-ir" aria-hidden="true">Explorar →</span>
              </Link>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="pn-secao-bloco">
          <div className="pn-secao-cabecalho">
            <p className="pn-sobrancelha">Como funciona</p>
            <h2 className="pn-secao">O mapa se desenha enquanto você estuda.</h2>
          </div>

          <ol className="pn-jornada">
            {JORNADA.map((j, indice) => (
              <motion.li
                key={j.titulo}
                className="pn-jornada-passo"
                variants={animaItem}
                initial="oculto"
                whileInView="visivel"
                viewport={{ once: true, margin: '-80px' }}
              >
                <span className="pn-jornada-no" aria-hidden="true">
                  {String(indice + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3>{j.titulo}</h3>
                  <p className="pn-corpo">{j.texto}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </section>

        <section className="pn-fecho pn-folha">
          <div>
            <h2 className="pn-secao">Pronto para abrir seu caderno?</h2>
            <p className="pn-corpo">
              Crie sua conta em menos de um minuto e comece pelo que importa hoje.
            </p>
          </div>
          <Link to="/register" className="pn-btn pn-btn-primario">Criar minha conta</Link>
        </section>
      </main>

      <footer className="pn-rodape">
        <Logo className="h-7 w-7" animado={false} />
        <p className="pn-corpo">
          Planejamento inteligente para uma aprendizagem que continua. · Cor atual: {paletaAtiva.nome}
        </p>
        <small>© {new Date().getFullYear()} PlanejAI</small>
      </footer>
    </div>
  )
}
