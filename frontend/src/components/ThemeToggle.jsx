import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'

const SunIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M5.6 5.6l.7.7m12.1 12.1l.7.7M3 12h1m16 0h1M5.6 18.4l.7-.7m12.1-12.1l.7-.7M12 8a4 4 0 100 8 4 4 0 000-8z" />
  </svg>
)

const MoonIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
)

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Modo claro' : 'Modo escuro'}
      className={`relative inline-flex items-center justify-center w-11 h-11 rounded-full
        bg-white/70 dark:bg-white/10 backdrop-blur-xl border border-[#4B4C9D]/20
        text-[#4B4C9D] dark:text-white shadow-lg hover:scale-105
        hover:bg-[#9394CF]/20 dark:hover:bg-white/20
        transition-all duration-300 ${className}`}
    >
      <AnimateIcon key={isDark ? 'dark' : 'light'} isDark={isDark} />
    </motion.button>
  )
}

function AnimateIcon({ isDark }) {
  return (
    <motion.span
      key={isDark ? 'dark' : 'light'}
      initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
      animate={{ opacity: 1, rotate: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex items-center justify-center"
    >
      {isDark ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
    </motion.span>
  )
}
