import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { path: '/inicio', label: 'Dashboard', icon: LayoutIcon },
  { path: '/cronograma', label: 'Cronograma', icon: CalendarIcon },
  { path: '/perfil', label: 'Perfil', icon: UserIcon },
]

function LayoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function CalendarIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function UserIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function CloseIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
          opacity: isOpen ? 1 : 0
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed lg:static lg:translate-x-0 lg:opacity-100
          top-0 left-0 h-full w-64 z-50
          bg-white/95 backdrop-blur-xl border-r border-[#9394CF]/20
          shadow-2xl flex flex-col
        `}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#9394CF]/20">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate('/inicio')}
          >
            <div className="w-9 h-9 bg-[#9394CF] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black font-black text-lg">P</span>
            </div>

            <span className="text-xl font-black text-[#4B4C9D]">
              PlanejAI
            </span>
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-[#4B4C9D] hover:text-black transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3.5 rounded-full transition-all duration-200 group font-bold ${
                  isActive
                    ? 'bg-[#4B4C9D] text-white shadow-xl'
                    : 'text-black/65 hover:bg-[#9394CF]/20 hover:text-black'
                }`
              }
            >
              <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-[#9394CF]/20">
          <div className="bg-[#F7F7FB] rounded-[2rem] p-4 border border-[#9394CF]/20">
            <p className="text-xs text-black/50 mb-1 font-bold">Versão</p>
            <p className="text-sm font-black text-[#4B4C9D]">1.0.0</p>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

