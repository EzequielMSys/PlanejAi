import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const API_URL = 'http://localhost:3000'

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

function getFotoUrl(fotoUrl) {
  if (!fotoUrl) return null
  if (fotoUrl.startsWith('http')) return fotoUrl
  return `${API_URL}${fotoUrl}`
}

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, logout, isAdmin, isDono } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const avatarUrl = getFotoUrl(user?.foto_url)
  const displayName = user?.apelido || user?.nome || 'Usuário'
  const initials = (displayName?.charAt(0) || 'U').toUpperCase()

  const handleNavigate = (path) => {
    setDropdownOpen(false)
    navigate(path)
  }

  const handleLogout = () => {
    setDropdownOpen(false)
    logout()
    navigate('/')
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/90 backdrop-blur-xl border-b border-[#9394CF]/20 shadow-lg">
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
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

          <Link to="/inicio" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-full bg-[#9394CF] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <span className="text-black font-black text-lg">P</span>
            </div>

            <span className="text-xl font-black text-[#4B4C9D] hidden sm:block">
              PlanejAI
            </span>
          </Link>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#9394CF]/20 transition-all border border-transparent hover:border-[#9394CF]/30"
          >
            <div className="w-8 h-8 rounded-full bg-[#9394CF] flex items-center justify-center shadow-md overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-black font-black text-sm">
                  {initials}
                </span>
              )}
            </div>

            <span className="text-sm font-bold text-black hidden md:block max-w-[120px] truncate">
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
                  className="absolute right-0 mt-2 w-60 bg-white/95 backdrop-blur-xl border border-[#9394CF]/20 rounded-[2rem] shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-4 py-4 border-b border-[#9394CF]/20">
                    <p className="text-sm font-black text-black truncate">
                      {displayName}
                    </p>

                    <p className="text-xs text-black/60 truncate">
                      {user?.email}
                    </p>

                    <span className="inline-flex mt-2 px-3 py-1 rounded-full bg-[#9394CF]/20 text-[#4B4C9D] text-xs font-black capitalize">
                      {user?.tipo || 'aluno'}
                    </span>
                  </div>

                  <div className="p-2 space-y-1">
                    <button
                      onClick={() => handleNavigate('/perfil')}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-black hover:bg-[#9394CF]/20 transition-colors text-left font-bold"
                    >
                      Perfil
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleNavigate('/usuarios')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-black hover:bg-[#9394CF]/20 transition-colors text-left font-bold"
                      >
                        Painel Admin
                      </button>
                    )}

                    {isDono && (
                      <button
                        onClick={() => handleNavigate('/dono/usuarios')}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-[#4B4C9D] hover:bg-[#9394CF]/20 transition-colors text-left font-black"
                      >
                        Painel Dono
                      </button>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-full text-sm text-red-600 hover:bg-red-100 transition-colors text-left font-bold"
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
    </nav>
  )
}