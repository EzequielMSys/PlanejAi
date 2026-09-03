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

function ExamIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12h14V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5a3 3 0 016 0M8 11l2 2 5-5M8 17h8" />
    </svg>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const { isAdmin, isDono, isGestor, user } = useAuth()

  const navItems = [
    { path: '/inicio', label: 'Visão geral', icon: LayoutIcon },
    ...(user?.tipo === 'aluno' ? [{ path: '/minha-jornada', label: 'Minha jornada', icon: DashboardIcon }] : []),
    { path: '/cronograma', label: 'Cronograma', icon: CalendarIcon },
    { path: '/aprendizagem', label: 'Aprendizagem', icon: DashboardIcon },
    { path: '/provas', label: 'Provas', icon: ExamIcon },
    { path: '/planejamento-inteligente', label: 'Planejamento', icon: CalendarIcon },
    { path: '/redacoes', label: 'Redações', icon: RedacaoIcon },
    ...(isGestor ? [{ path: '/turmas', label: 'Turmas', icon: UsersIcon }] : []),
    ...(isGestor ? [{ path: '/atividades', label: 'Atividades', icon: RedacaoIcon }] : []),
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
        className="app-sidebar"
      >
        <div className="sidebar-brand-row">
          <button
            type="button"
            className="sidebar-brand-button"
            onClick={handleNavigateHome}
          >
            <motion.div
              whileHover={{ rotate: -6, scale: 1.04 }}
              className="sidebar-logo"
            >
              <Logo className="h-10 w-10" />
            </motion.div>
            <span className="sidebar-brand-copy"><strong>PlanejAI</strong><small>aprenda com direção</small></span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="sidebar-close"
          >
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="sidebar-context"><span><i /> Espaço ativo</span><strong>{user?.tipo === 'aluno' ? 'Minha aprendizagem' : 'Central pedagógica'}</strong></div>

        <nav className="sidebar-nav">
          <p className="sidebar-section">Aprender</p>

          {navItems.map((item) => (
            <SidebarLink key={item.path} item={item} onClose={onClose} />
          ))}

          {adminItems.length > 0 && (
            <>
              <p className="sidebar-section sidebar-section--spaced">Gerenciar</p>

              {adminItems.map((item) => (
                <SidebarLink key={item.path} item={item} onClose={onClose} />
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-account">
            <span className="sidebar-avatar">{(user?.apelido || user?.nome || 'U').charAt(0).toUpperCase()}</span>
            <span><strong>{user?.apelido || user?.nome || 'Usuário'}</strong><small>{user?.tipo || 'aluno'} · online</small></span>
            <i aria-hidden="true">•••</i>
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
      className={({ isActive }) => `sidebar-link${isActive ? ' is-active' : ''}`}
    >
      <span className="sidebar-link-icon"><item.icon className="h-5 w-5" /></span>
      <span>{item.label}</span>
      <i aria-hidden="true">›</i>
    </NavLink>
  )
}
