import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import ThemeToggle from '../components/ThemeToggle'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } }
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } }
}

const letterStagger = {
  hidden: { opacity: 0, y: 60, rotateX: 90 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { delay: 0.4 + i * 0.08, duration: 0.6, ease: 'easeOut' }
  })
}

// Letters for the animated "PlanejAI" acronym
const BRAND_LETTERS = ['P', 'l', 'a', 'n', 'e', 'j', 'A', 'I']

function explodeConfetti() {
  const defaults = { colors: ['#9394CF', '#4B4C9D', '#7778BD', '#A9AAE8', '#ffffff'] }
  confetti({ ...defaults, particleCount: 120, spread: 80, origin: { y: 0.6 } })
  confetti({ ...defaults, particleCount: 60, angle: 60, spread: 60, origin: { x: 0 } })
  confetti({ ...defaults, particleCount: 60, angle: 120, spread: 60, origin: { x: 1 } })
}

// Floating particles inside the hero
function Particles() {
  const particles = Array.from({ length: 18 })
  return (
    <div className="particle-field">
      {particles.map((_, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-white/40 dark:bg-white/30"
          style={{
            left: `${(i * 37) % 100}%`,
            bottom: `${(i * 23) % 90}%`,
            width: `${4 + (i % 4) * 3}px`,
            height: `${4 + (i % 4) * 3}px`,
            animation: `particle ${10 + (i % 6) * 2}s linear ${i * 0.7}s infinite`
          }}
        />
      ))}
    </div>
  )
}

// The animated "PlanejAI" acronym
function AnimatedBrand() {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      className="relative select-none"
      style={{ perspective: 800 }}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {BRAND_LETTERS.map((letter, i) => (
          <motion.span
            key={i}
            custom={i}
            variants={letterStagger}
            className={`inline-block font-black leading-none
              ${i >= 6 ? 'text-white' : 'text-transparent bg-clip-text'}
              translate-z-0`}
            style={{
              fontSize: 'clamp(4rem, 16vw, 11rem)',
              backgroundImage: i < 6
                ? 'linear-gradient(120deg, #7c7de0, #4B4C9D, #9394CF, #7c7de0)'
                : undefined,
              backgroundSize: '300% 300%',
              animation: i < 6 ? 'gradientX 5s ease infinite' : undefined,
              textShadow: i >= 6 ? '0 0 30px rgba(147,148,207,0.9), 0 0 60px rgba(75,76,157,0.6)' : undefined,
              transform: i % 2 === 0 ? undefined : 'translateY(6px)'
            }}
            whileHover={{ scale: 1.15, y: -8, rotate: i % 2 === 0 ? -6 : 6 }}
          >
            {letter}
          </motion.span>
        ))}
      </div>

      {/* Glow layer behind the acronym */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center blur-2xl opacity-60 dark:opacity-40">
        <span className="font-black text-[#4B4C9D] dark:text-[#A9AAE8]" style={{ fontSize: 'clamp(4rem, 16vw, 11rem)' }}>
          PlanejAI
        </span>
      </div>
    </motion.div>
  )
}

// Stats section with animated counters
function Stats() {
  const stats = [
    { value: 1000, suffix: '+', label: 'Cronogramas gerados' },
    { value: 500, suffix: '+', label: 'Alunos apoiados' },
    { value: 98, suffix: '%', label: 'Satisfação' },
    { value: 24, suffix: 'h', label: 'Suporte ativo' }
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

function FeatureCard({ emoji, title, desc }) {
  return (
    <motion.div
      variants={fadeUp}
      className="bg-white dark:bg-[#26254A] text-center group hover:scale-[1.03] hover:-translate-y-1 hover:shadow-[0_30px_80px_rgba(75,76,157,0.3)] transition-all duration-300 p-8 rounded-[2rem] shadow-xl border border-[#9394CF]/30 dark:border-white/10"
    >
      <div className="relative w-20 h-20 bg-gradient-to-br from-[#9394CF] to-[#4B4C9D] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 shadow-lg">
        <span className="text-3xl">{emoji}</span>
        <span className="absolute inset-0 rounded-full bg-white/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <h3 className="text-2xl font-extrabold text-black dark:text-white mb-4">
        {title}
      </h3>

      <p className="text-black/65 dark:text-white/60 leading-relaxed">
        {desc}
      </p>
    </motion.div>
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] pt-32 pb-20 bg-animated-grid">
        {/* Ambient animated blobs */}
        <div className="absolute top-16 left-10 w-40 h-40 bg-white/20 rounded-full blur-xl animate-float" />
        <div className="absolute top-40 right-16 w-56 h-56 bg-black/10 rounded-full blur-2xl animate-float-slow" />
        <div className="absolute top-32 right-1/4 w-24 h-24 border border-white/40 rounded-full animate-pulse-glow" />
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-white/10 rounded-full blur-2xl animate-float" />
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        {/* Rotating decorative ring */}
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[26rem] h-[26rem] border border-white/10 rounded-full animate-spin-slower" />
        <div className="absolute top-32 left-1/2 -translate-x-1/2 w-[20rem] h-[20rem] border border-white/10 rounded-full animate-spin-slow" />

        {/* Floating particles */}
        <Particles />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="bg-white/85 dark:bg-white/10 backdrop-blur-xl rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white/60 dark:border-white/20 card-glow"
          >
            {/* Animated logo/acronym */}
            <motion.div variants={fadeUp} className="mb-8 flex justify-center">
              <AnimatedBrand />
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-4xl md:text-6xl font-black text-black dark:text-white mb-6 leading-tight tracking-tight"
            >
              Estude com{' '}
              <span className="text-gradient-animated inline-block">
                inteligência
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg md:text-2xl text-black/75 dark:text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed"
            >
              Organize sua rotina com cronogramas personalizados, metas claras e acompanhamento inteligente.
            </motion.p>

            {/* Decorative divider */}
            <motion.div variants={fadeUp} className="flex items-center justify-center gap-3 mb-8">
              <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#4B4C9D] dark:to-white/40" />
              <span className="text-2xl animate-bounce-glow">🚀</span>
              <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#4B4C9D] dark:to-white/40" />
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto"
            >
              <Link
                to="/login"
                className="shine-overlay bg-black dark:bg-white text-white dark:text-black text-lg font-bold py-4 px-12 w-full sm:w-auto rounded-full shadow-xl hover:bg-[#4B4C9D] dark:hover:bg-[#9394CF] transform hover:-translate-y-1 hover:shadow-2xl transition-all duration-300"
              >
                Acessar sistema
              </Link>

              <Link
                to="/register"
                onClick={explodeConfetti}
                className="shine-overlay bg-[#4B4C9D] text-white text-lg font-bold py-4 px-12 w-full sm:w-auto rounded-full shadow-xl hover:bg-black dark:hover:bg-white dark:hover:text-black transform hover:-translate-y-1 hover:shadow-2xl animate-pulse-glow transition-all duration-300"
              >
                Começar agora ✨
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white dark:bg-[#1E1D3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Stats />
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-[#F7F7FB] dark:bg-[#0F0E20]">
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
              emoji="📓"
              title="Cronogramas Inteligentes"
              desc="Organização automática com base no seu tempo disponível e nos seus objetivos."
            />
            <FeatureCard
              emoji="🗓️"
              title="Personalização Total"
              desc="Você informa sua rotina, dificuldades, prioridades e metas de estudo."
            />
            <FeatureCard
              emoji="📈"
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
