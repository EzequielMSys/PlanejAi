import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import ThemeToggle from '../components/ThemeToggle'
import Logo from '../components/Logo'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
}

function explodeConfetti() {
  const defaults = { colors: ['#7C3AED', '#A855F7', '#C4B5FD', '#E9D5FF', '#ffffff'] }
  confetti({ ...defaults, particleCount: 120, spread: 80, origin: { y: 0.6 } })
  confetti({ ...defaults, particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } })
  confetti({ ...defaults, particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } })
}

function AnimatedBrand() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="inline-flex select-none items-center gap-3"
    >
      <Logo className="h-12 w-12" />
      <span className="text-2xl font-black tracking-[-0.04em] text-[#241A38] dark:text-white sm:text-3xl">Planej<span className="text-[#7C3AED] dark:text-[#C4B5FD]">AI</span></span>
    </motion.div>
  )
}

// Stats section with animated counters
function Stats() {
  const stats = [
    { value: 4, suffix: '', label: 'áreas de conhecimento' },
    { value: 7, suffix: '', label: 'dias organizados' },
    { value: 100, suffix: '%', label: 'adaptado à sua rotina' },
    { value: 1, suffix: '', label: 'plano centralizado' }
  ]

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-6"
    >
      {stats.map((s) => (
        <motion.div
          key={s.label}
          variants={fadeUp}
          className="card-glow bg-white dark:bg-[#26254A] rounded-2xl p-6 text-center shadow-xl border border-[#9394CF]/30 dark:border-white/10"
        >
          <Counter value={s.value} suffix={s.suffix} />
          <p className="mt-2 text-sm font-semibold text-black/60 dark:text-white/60">{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

function Counter({ value, suffix }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useInViewOnce(ref, () => {
    if (started.current) return
    started.current = true
    const duration = 1600
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * value))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  return (
    <div ref={ref} className="text-3xl md:text-4xl font-black text-gradient-animated">
      {display}
      {suffix}
    </div>
  )
}

function useInViewOnce(ref, callback) {
  if (typeof IntersectionObserver === 'undefined') {
    callback()
    return
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback()
          observer.disconnect()
        }
      })
    },
    { threshold: 0.4 }
  )
  if (ref.current) observer.observe(ref.current)
  return () => observer.disconnect()
}

function FeatureCard({ number, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      className="group rounded-[1.75rem] border border-[#E4E3F0] bg-white p-8 text-left shadow-[0_22px_60px_-42px_rgba(35,31,77,.5)] transition-all duration-300 hover:-translate-y-1 hover:border-[#C9C5F4] hover:shadow-[0_28px_70px_-40px_rgba(75,67,183,.45)] dark:border-white/10 dark:bg-[#211F3D]"
    >
      <div className="mb-8 flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6157D9] text-sm font-black text-white shadow-md shadow-indigo-200 dark:shadow-none">{number}</span>
        <span className="text-2xl text-[#B8B5CA] transition group-hover:translate-x-1 group-hover:text-[#6157D9]">↗</span>
      </div>

      <h3 className="mb-3 text-xl font-extrabold tracking-tight text-black dark:text-white">
        {title}
      </h3>

      <p className="text-black/65 dark:text-white/60 leading-relaxed">
        {desc}
      </p>
    </motion.div>
  )
}

const TRILHAS_DE_EXEMPLO = [
  ['Matemática', 'Funções', [35, 45, 50]], ['Redação', 'Repertório', [30, 40, 45]],
  ['Biologia', 'Ecologia', [30, 35, 45]], ['Física', 'Cinemática', [35, 45, 50]],
  ['Química', 'Estequiometria', [30, 40, 50]], ['Português', 'Interpretação de texto', [30, 35, 45]],
  ['História', 'Brasil República', [35, 40, 50]], ['Geografia', 'Urbanização', [30, 40, 45]],
  ['Inglês', 'Tempos verbais', [25, 30, 40]], ['Literatura', 'Modernismo', [30, 40, 45]]
]
const DIAS_DE_EXEMPLO = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado']

function criarTrilhaAleatoria() {
  const opcoes = [...TRILHAS_DE_EXEMPLO].sort(() => Math.random() - 0.5).slice(0, 3)
  const inicio = 8 * 60 + Math.floor(Math.random() * 9) * 30
  let cursor = inicio
  const itens = opcoes.map(([title, assunto, duracoes], index) => {
    const minutos = duracoes[Math.floor(Math.random() * duracoes.length)]
    const hora = `${String(Math.floor(cursor / 60)).padStart(2, '0')}:${String(cursor % 60).padStart(2, '0')}`
    cursor += minutos + [15, 20, 25][Math.floor(Math.random() * 3)]
    return { title, detail: `${assunto} · ${minutos} min`, time: hora, featured: false, minutos, id: `${title}-${index}` }
  })
  itens[Math.floor(Math.random() * itens.length)].featured = true
  return { day: DIAS_DE_EXEMPLO[Math.floor(Math.random() * DIAS_DE_EXEMPLO.length)], items: itens, total: itens.reduce((soma, item) => soma + item.minutos, 0) }
}

function StudyMap() {
  const [trilha] = useState(criarTrilhaAleatoria)

  return (
    <div className="relative mx-auto min-h-[430px] max-w-[480px] overflow-hidden rounded-[2rem] border border-[#D9CDF5] bg-[#FCFAFF] p-6 shadow-[0_28px_80px_-42px_rgba(76,29,149,.45)] dark:border-white/10 dark:bg-[#20172F] sm:p-8">
      <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(#E9E1F7_1px,transparent_1px),linear-gradient(90deg,#E9E1F7_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[.06]" />
      <div className="relative">
        <div className="mb-8 flex items-end justify-between">
          <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#8A769F] dark:text-white/40">{trilha.day}</p><h3 className="mt-1 text-2xl font-black tracking-tight text-[#2A1D3D] dark:text-white">Minha trilha</h3></div>
          <span className="rounded-full bg-[#EEE7FF] px-3 py-1.5 text-xs font-black text-[#6D28D9] dark:bg-white/10 dark:text-[#D8B4FE]">3 blocos</span>
        </div>

        <div className="relative space-y-5">
          <div className="absolute bottom-5 left-4 top-5 w-px bg-gradient-to-b from-[#A78BFA] via-[#7C3AED] to-[#D8B4FE]" />
          {trilha.items.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: .45 + index * .12 }} className="relative grid grid-cols-[34px_1fr] gap-4">
              <span className={`relative z-10 mt-5 h-8 w-8 rounded-full border-[6px] border-[#FCFAFF] dark:border-[#20172F] ${item.featured ? 'bg-[#7C3AED]' : 'bg-[#C4B5FD]'}`} />
              <div className={`rounded-2xl border p-4 ${item.featured ? 'rotate-[1deg] border-[#8B5CF6] bg-[#7C3AED] text-white shadow-lg shadow-purple-200 dark:shadow-none' : 'border-[#E3D9F5] bg-white text-[#2B2138] dark:border-white/10 dark:bg-white/[.06] dark:text-white'}`}>
                <div className="flex items-center justify-between gap-3"><strong>{item.title}</strong><span className={`font-mono text-xs ${item.featured ? 'text-white/70' : 'text-[#8A769F] dark:text-white/40'}`}>{item.time}</span></div>
                <p className={`mt-1 text-sm ${item.featured ? 'text-white/75' : 'text-[#7E718C] dark:text-white/45'}`}>{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-[#E9E1F4] pt-5 dark:border-white/10"><span className="text-sm font-bold text-[#6F607E] dark:text-white/50">Ritmo do dia</span><span className="font-mono text-sm font-black text-[#7C3AED] dark:text-[#C4B5FD]">{trilha.total} min</span></div>
      </div>
    </div>
  )
}

const Landing = () => {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] overflow-hidden">
      {/* Top bar with theme toggle */}
      <div className="fixed top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-[#F5F0FF] pb-20 pt-24 dark:bg-[#140F20] sm:pt-28">
        {/* Ambient animated blobs */}
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full border-[52px] border-[#E5D8FF] dark:border-[#7C3AED]/10" />
        <div className="absolute -right-20 bottom-[-9rem] h-96 w-96 rounded-full bg-[#DDD0FA] blur-3xl dark:bg-[#6D28D9]/15" />
        {/* Rotating decorative ring */}
        <div className="absolute right-[42%] top-20 h-16 w-16 rotate-12 rounded-2xl border border-[#C4B5FD]/60 dark:border-white/10" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid items-center gap-12 text-left lg:grid-cols-[1.02fr_.98fr]"
          >
            <div>
            {/* Animated logo/acronym */}
            <motion.div variants={fadeUp} className="mb-10 flex justify-start">
              <AnimatedBrand />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-0.055em] text-[#251638] dark:text-white sm:text-6xl md:text-7xl"
            >
              Sua semana tem um ritmo.{' '}
                <span className="inline-block text-[#7C3AED] dark:text-[#B794F6]">
                Seu estudo também.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mb-8 mt-7 max-w-xl text-lg leading-relaxed text-[#6F607E] dark:text-white/55 md:text-xl"
            >
              Transforme horários soltos, prioridades e objetivos em uma trilha de estudos que você realmente consegue seguir.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="flex max-w-2xl flex-col items-stretch gap-3 sm:flex-row sm:items-center"
            >
              <Link
                to="/login"
                className="w-full rounded-xl border border-[#CFC0E8] bg-white/60 px-7 py-4 text-center font-extrabold text-[#4C3863] transition hover:border-[#A78BFA] hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white sm:w-auto"
              >
                Acessar sistema
              </Link>

              <Link
                to="/register"
                onClick={explodeConfetti}
                className="w-full rounded-xl bg-[#7C3AED] px-7 py-4 text-center font-extrabold text-white shadow-lg shadow-purple-300/30 transition hover:-translate-y-0.5 hover:bg-[#6D28D9] dark:shadow-none sm:w-auto"
              >
                Montar minha trilha
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-[#796989] dark:text-white/40"><span>✓ Horários flexíveis</span><span>✓ Foco por matéria</span><span>✓ Progresso visível</span></motion.div>
            </div>

            <StudyMap />
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white py-16 dark:bg-[#1A1426]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stats />
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#FAF8FD] py-32 dark:bg-[#120E1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-24"
          >
            <motion.p variants={fadeUp} className="uppercase tracking-[0.35em] text-sm font-black text-[#4B4C9D] dark:text-[#A9AAE8] mb-4">
              planejamento inteligente
            </motion.p>

            <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-black text-black dark:text-white mb-6 tracking-tight">
              Tudo para estudar com{' '}
              <span className="text-gradient-animated">mais organização</span>
            </motion.h2>

            <motion.p variants={fadeUp} className="text-xl text-black/65 dark:text-white/60 max-w-2xl mx-auto">
              O PlanejAI entende seu perfil e transforma sua rotina em um plano de estudos mais claro.
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="grid md:grid-cols-3 gap-8"
          >
            <FeatureCard
              number="01"
              title="Cronogramas Inteligentes"
              desc="Organização automática com base no seu tempo disponível e nos seus objetivos."
            />
            <FeatureCard
              number="02"
              title="Personalização Total"
              desc="Você informa sua rotina, dificuldades, prioridades e metas de estudo."
            />
            <FeatureCard
              number="03"
              title="Evolução Contínua"
              desc="Acompanhe seu progresso e ajuste seus estudos conforme seu desempenho."
            />
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-24 bg-white dark:bg-[#1E1D3A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="uppercase tracking-[0.35em] text-sm font-black text-[#4B4C9D] dark:text-[#A9AAE8] mb-4 animate-pulse-soft">
            contato
          </p>

          <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-6">
            Fale com a equipe{' '}
            <span className="text-gradient-animated">PlanejAI</span>
          </h2>

          <p className="text-lg text-black/65 dark:text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Tem dúvidas sobre o projeto, sugestões ou quer saber mais sobre a plataforma? Entre em contato conosco.
          </p>

          <a
            href="mailto:planejai.contato@gmail.com"
            className="shine-overlay inline-block bg-[#4B4C9D] text-white text-lg font-bold py-4 px-12 rounded-full shadow-xl hover:bg-black dark:hover:bg-white dark:hover:text-black transform hover:-translate-y-1 transition-all duration-300"
          >
            Enviar email ✉️
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#4B4C9D] text-white px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
        {/* Soft glow accent */}
        <div className="absolute -top-20 left-1/3 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <h2 className="text-3xl font-black mb-3">
              Planej<span className="text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.6),0_0_20px_rgba(255,255,255,0.4)]">AI</span>
            </h2>

            <p className="text-white/80 leading-relaxed">
              Plataforma inteligente para organizar estudos, criar cronogramas personalizados e acompanhar a evolução dos alunos.
            </p>
          </div>

          <div>
            <h3 className="font-black mb-3">
              Navegação
            </h3>

            <div className="flex flex-col gap-2 text-white/80 text-sm">
              <Link to="/" className="hover:text-white transform hover:translate-x-1 transition">Início</Link>
              <Link to="/login" className="hover:text-white transform hover:translate-x-1 transition">Login</Link>
              <Link to="/register" className="hover:text-white transform hover:translate-x-1 transition">Cadastro</Link>
            </div>
          </div>

          <div>
            <h3 className="font-black mb-3">
              Projeto
            </h3>

            <div className="flex flex-col gap-2 text-white/80 text-sm">
              <p>TCC</p>
              <p>Desenvolvimento de Sistemas</p>
              <p>2026</p>
            </div>
          </div>

          <div>
            <h3 className="font-black mb-3">
              Contato
            </h3>

            <div className="flex flex-col gap-2 text-white/80 text-sm">
              <p>Email: planejai.contato@gmail.com</p>
              <p>Instagram: @planejai</p>
              <p>Equipe PlanejAI: Fernanda e Ezequiel :p</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto mt-8 pt-6 border-t border-white/20 text-center text-sm text-white/70">
          © 2026 PlanejAI. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}

export default Landing
