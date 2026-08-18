import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import { resolveBackendAsset } from '../config/api'
import Logo from './Logo'

const MenuIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const XIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ChevronDownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
)

const DashboardIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
)

const CalendarIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const PenIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)

const UserIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const UsersIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4h-1M9 20H4v-2a4 4 0 014-4h1m8-4a4 4 0 100-8 4 4 0 000 8zM9 10a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
)

const CrownIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 16l-2-9 5 4 4-7 4 7 5-4-2 9H5zm0 0h14v3H5v-3z" />
  </svg>
)

const SettingsIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const LogoutIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

function getFotoUrl(fotoUrl) {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith('http')) return fotoUrl
  return resolveBackendAsset(fotoUrl)
}

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, logout, isAdmin, isDono } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [navMenuOpen, setNavMenuOpen] = useState(false)

  const avatarUrl = getFotoUrl(user?.foto_url)
  const displayName = user?.apelido || user?.nome || 'Usuário'
  const initials = (displayName?.charAt(0) || 'U').toUpperCase()

  const menuItems = [
    { path: '/inicio', label: 'Dashboard', icon: DashboardIcon },
    { path: '/cronograma', label: 'Cronograma', icon: CalendarIcon },
    { path: '/redacoes', label: 'Redações', icon: PenIcon },
    { path: '/perfil', label: 'Perfil', icon: UserIcon },
    { path: '/perfil', label: 'Configurações', icon: SettingsIcon },
    ...(isAdmin
      ? [{ path: '/usuarios', label: 'Painel Admin', icon: UsersIcon }]
      : []),
    ...(isDono
      ? [{ path: '/dono/usuarios', label: 'Painel Dono', icon: CrownIcon }]
      : [])
  ]

  const handleNavigate = (path) => {
    setDropdownOpen(false)
    setNavMenuOpen(false)
    navigate(path)
  }

  const handleLogout = () => {
    setDropdownOpen(false)
    setNavMenuOpen(false)
    logout()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 h-[4.5rem] border-b border-[#E8DFF2] bg-[#FCFAFF]/95 backdrop-blur-2xl dark:border-white/10 dark:bg-[#181220]/95">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-full text-[#4B4C9D] hover:text-black hover:bg-[#9394CF]/20 transition-all"
            aria-label="Abrir menu"
          >
            {sidebarOpen ? (
              <XIcon className="w-6 h-6" />
            ) : (
              <MenuIcon className="w-6 h-6" />
            )}
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setNavMenuOpen((v) => !v)
                setDropdownOpen(false)
              }}
              className="group flex items-center gap-2.5 rounded-xl px-1.5 py-1 transition hover:bg-[#F2ECF8] dark:hover:bg-white/5"
              aria-label="Menu de navegação"
            >
              <Logo className="h-9 w-9" />

              <span className="hidden text-lg font-black tracking-[-0.03em] text-[#2C1A3D] sm:block dark:text-[#FAF7FF]">
                PlanejAI
              </span>

              <ChevronDownIcon
                className={`hidden h-4 w-4 text-[#8885A1] transition-transform sm:block ${
                  navMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {navMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setNavMenuOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 mt-2 w-64 bg-white/95 backdrop-blur-xl border border-[#9394CF]/20 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[#9394CF]/20">
                      <p className="text-xs uppercase tracking-[0.25em] text-black/40 font-black">
                        PlanejAI
                      </p>

                      <p className="text-sm font-black text-[#4B4C9D]">
                        Navegação
                      </p>
                    </div>

                    <div className="p-2 space-y-1">
                      {menuItems.map((item) => (
                        <button
                          key={item.label}
                          onClick={() => handleNavigate(item.path)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-black hover:bg-[#9394CF]/20 transition-colors text-left font-bold"
                        >
                          <item.icon className="w-5 h-5 text-[#4B4C9D]" />
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

<div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2.5 rounded-xl border border-[#E7DDF0] bg-white/70 py-1.5 pl-2 pr-3 transition hover:border-[#C4B5FD] hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-[#8B5CF6]/50 dark:hover:bg-white/10"
            >
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-[#E2DFFD] shadow-sm">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-[#443BA7]">
                    {initials}
                  </span>
                )}
              </div>

              <span className="text-sm font-bold text-black dark:text-white hidden md:block max-w-[120px] truncate">
                {displayName}
              </span>

              <ChevronDownIcon
                className={`w-4 h-4 text-[#4B4C9D] transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />

                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-60 bg-white/95 dark:bg-[#26254A]/95 backdrop-blur-xl border border-[#9394CF]/20 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-4 border-b border-[#9394CF]/20">
                      <p className="text-sm font-black text-black dark:text-white truncate">
                        {displayName}
                      </p>

                      <p className="text-xs text-black/60 dark:text-white/60 truncate">
                        {user?.email}
                      </p>

                      <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-[#9394CF]/20 text-[#4B4C9D] dark:text-[#A9AAE8] text-xs font-black capitalize">
                        {user?.tipo || 'aluno'}
                      </span>
                    </div>

                    <div className="p-2 space-y-1">
                      <button
                        onClick={() => handleNavigate('/perfil')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-black dark:text-white hover:bg-[#9394CF]/20 transition-colors text-left font-bold"
                      >
                        Perfil
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleNavigate('/usuarios')}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-black dark:text-white hover:bg-[#9394CF]/20 transition-colors text-left font-bold"
                        >
                          Painel Admin
                        </button>
                      )}

                      {isDono && (
                        <button
                          onClick={() => handleNavigate('/dono/usuarios')}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-[#4B4C9D] dark:text-[#A9AAE8] hover:bg-[#9394CF]/20 transition-colors text-left font-black"
                        >
                          Painel Dono
                        </button>
                      )}

                      <button
                        onClick={() => handleNavigate('/alterar-senha')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-black dark:text-white hover:bg-[#9394CF]/20 transition-colors text-left font-bold"
                      >
                        Alterar Senha
                      </button>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left font-bold"
                      >
                        Sair
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  )
}
