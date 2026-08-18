import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'

function LayoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  )
}

function DashboardIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

function RedacaoIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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

function BellIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { isAdmin, isDono, user } = useAuth()

const navItems = [
    { path: '/inicio', label: 'Dashboard', icon: LayoutIcon },
    { path: '/cronograma', label: 'Cronograma', icon: CalendarIcon },
    { path: '/aprendizagem', label: 'Aprendizagem', icon: DashboardIcon },
    { path: '/redacoes', label: 'Redações', icon: RedacaoIcon },
    { path: '/atividades', label: 'Atividades', icon: RedacaoIcon },
    ...(user?.tipo === 'aluno' ? [{ path: '/minhas-atividades', label: 'Minhas atividades', icon: RedacaoIcon }] : []),
    ...(user?.tipo === 'aluno' ? [{ path: '/avisos', label: 'Avisos', icon: BellIcon }] : []),
    { path: '/perfil', label: 'Perfil', icon: UserIcon }
  ]

  const adminItems = [
    ...(isAdmin || isDono || user?.tipo === 'docente'
      ? [{ path: '/dashboard-gestor', label: 'Painel Gestor', icon: DashboardIcon }]
      : []),
    ...(isAdmin
      ? [{ path: '/usuarios', label: 'Painel Admin', icon: UsersIcon }]
      : []),
    ...(isDono
      ? [{ path: '/dono/usuarios', label: 'Painel Dono', icon: CrownIcon }]
      : [])
  ]

  if (['dono', 'admin', 'adm', 'docente'].includes(user?.tipo)) {
    adminItems.unshift({ path: '/materiais', label: 'Materiais', icon: RedacaoIcon })
  }

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
          app-sidebar
          fixed lg:fixed lg:!translate-x-0 lg:!opacity-100
          top-0 left-0 h-full w-64 z-50
          bg-[#202024]/98 text-white backdrop-blur-xl border-r border-white/5
          shadow-[20px_0_60px_-35px_rgba(15,12,44,.8)] flex flex-col
        "
      >
        <div className="flex h-[4.5rem] items-center justify-between border-b border-white/10 px-5">
          <button
            type="button"
            className="flex items-center space-x-3"
            onClick={handleNavigateHome}
          >
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
            >
              <Logo className="w-9 h-9" />
            </motion.div>

            <span className="sidebar-brand text-xl font-black tracking-[-0.03em] text-white">
              PlanejAI
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="sidebar-close text-white/70 transition-colors hover:text-white lg:hidden"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

<nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="sidebar-section px-4 pb-2 pt-2 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
            Principal
          </p>

          {navItems.map((item) => (
            <SidebarLink key={item.path} item={item} onClose={onClose} />
          ))}

          {adminItems.length > 0 && (
            <>
              <p className="sidebar-section px-4 pb-2 pt-6 text-[10px] font-black uppercase tracking-[0.22em] text-white/35">
                Gestão
              </p>

              {adminItems.map((item) => (
                <SidebarLink key={item.path} item={item} onClose={onClose} />
              ))}
            </>
          )}
        </nav>

<div className="border-t border-white/10 p-4">
          <div className="sidebar-account rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <p className="text-xs text-black/50 dark:text-white/50 mb-1 font-bold">
              Conta
            </p>

            <strong className="block text-sm font-black text-[#4B4C9D] dark:text-[#A9AAE8] truncate">
              {user?.tipo || 'aluno'}
            </strong>

            <p className="text-xs text-black/50 dark:text-white/50 mt-3 mb-1 font-bold">
              Versão
            </p>

            <strong className="block text-sm font-black text-[#4B4C9D] dark:text-[#A9AAE8]">
              1.0.0
            </strong>
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
              ? 'sidebar-link is-active bg-[#6157D9] text-white shadow-lg shadow-black/20'
            : 'sidebar-link text-white/58 hover:bg-white/[0.07] hover:text-white'
        }`
      }
    >
      <item.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span>{item.label}</span>
    </NavLink>
  )
}
