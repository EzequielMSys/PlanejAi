import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

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

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 100-8 4 4 0 000 8zM9 10a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  )
}

function CrownIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 16l-2-9 5 4 4-7 4 7 5-4-2 9H5zm0 0h14v3H5v-3z" />
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
  const { isAdmin, isDono, user } = useAuth()

  const navItems = [
    { path: '/inicio', label: 'Dashboard', icon: LayoutIcon },
    { path: '/cronograma', label: 'Cronograma', icon: CalendarIcon },
    { path: '/perfil', label: 'Perfil', icon: UserIcon }
  ]

  const adminItems = [
    ...(isAdmin
      ? [{ path: '/usuarios', label: 'Painel Admin', icon: UsersIcon }]
      : []),
    ...(isDono
      ? [{ path: '/dono/usuarios', label: 'Painel Dono', icon: CrownIcon }]
      : [])
  ]

  const handleNavigateHome = () => {
    navigate('/inicio')
    onClose()
  }

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
        className="
          fixed lg:fixed lg:translate-x-0 lg:opacity-100
          top-0 left-0 h-full w-64 z-50
          bg-white/95 backdrop-blur-xl border-r border-[#9394CF]/20
          shadow-2xl flex flex-col
        "
      >
        <div className="flex items-center justify-between p-6 border-b border-[#9394CF]/20">
          <button
            type="button"
            className="flex items-center space-x-2"
            onClick={handleNavigateHome}
          >
            <div className="w-9 h-9 bg-[#9394CF] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-black font-black text-lg">P</span>
            </div>

            <span className="text-xl font-black text-[#4B4C9D]">
              PlanejAI
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-[#4B4C9D] hover:text-black transition-colors"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-4 pt-2 pb-1 text-[11px] uppercase tracking-[0.25em] text-black/40 font-black">
            Principal
          </p>

          {navItems.map((item) => (
            <SidebarLink key={item.path} item={item} onClose={onClose} />
          ))}

          {adminItems.length > 0 && (
            <>
              <p className="px-4 pt-6 pb-1 text-[11px] uppercase tracking-[0.25em] text-black/40 font-black">
                Gestão
              </p>

              {adminItems.map((item) => (
                <SidebarLink key={item.path} item={item} onClose={onClose} />
              ))}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-[#9394CF]/20">
          <div className="bg-[#F7F7FB] rounded-[2rem] p-4 border border-[#9394CF]/20">
            <p className="text-xs text-black/50 mb-1 font-bold">
              Conta
            </p>

            <p className="text-sm font-black text-[#4B4C9D] truncate">
              {user?.tipo || 'aluno'}
            </p>

            <p className="text-xs text-black/50 mt-3 mb-1 font-bold">
              Versão
            </p>

            <p className="text-sm font-black text-[#4B4C9D]">
              1.0.0
            </p>
          </div>
        </div>
      </motion.aside>
    </>
  )
}

function SidebarLink({ item, onClose }) {
  return (
    <NavLink
      to={item.path}
      onClick={onClose}
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
  )
}