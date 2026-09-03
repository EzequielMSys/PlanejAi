import { useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import ThemeToggle from './ThemeToggle'
import { resolveBackendAsset } from '../config/api'

const routeNames = {
  '/inicio': ['Visão geral', 'Seu centro de aprendizagem'],
  '/dashboard': ['Visão geral', 'Seu centro de aprendizagem'],
  '/cronograma': ['Cronograma', 'Organize o que vem a seguir'],
  '/aprendizagem': ['Aprendizagem', 'Pratique e acompanhe seu domínio'],
  '/planejamento-inteligente': ['Planejamento', 'Estratégia guiada por dados'],
  '/provas': ['Provas e simulados', 'Treino real com progresso salvo'],
  '/redacoes': ['Redações', 'Escreva, revise e evolua'],
  '/turmas': ['Turmas', 'Comunidade e acompanhamento'],
  '/atividades': ['Atividades', 'Criação e correção pedagógica'],
  '/minhas-atividades': ['Minhas atividades', 'Entregas e resultados'],
  '/avisos': ['Avisos', 'Atualizações da sua comunidade'],
  '/perfil': ['Perfil', 'Preferências e dados pessoais'],
  '/materiais': ['Materiais', 'Biblioteca do cronograma'],
  '/dashboard-gestor': ['Painel gestor', 'Visão pedagógica da comunidade'],
  '/usuarios': ['Administração', 'Pessoas e permissões'],
  '/dono': ['Central do proprietário', 'Saúde e operação da plataforma'],
  '/dono/usuarios': ['Administração', 'Pessoas e permissões']
}

function Icon({ name, className = '' }) {
  const paths = {
    menu: 'M4 7h16M4 12h16M4 17h16',
    close: 'M6 6l12 12M18 6L6 18',
    chevron: 'M8 10l4 4 4-4',
    spark: 'M12 3l1.8 4.7L19 10l-5.2 2.3L12 18l-1.8-5.7L5 10l5.2-2.3L12 3z',
    bell: 'M18 8a6 6 0 00-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4'
  }
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>
}

function getFotoUrl(value) {
  if (!value) return null
  return value.startsWith('http') ? value : resolveBackendAsset(value)
}

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, logout, isAdmin, isDono } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [title, subtitle] = routeNames[pathname] || ['PlanejAI', 'Seu ambiente de estudos']
  const displayName = user?.apelido || user?.nome || 'Usuário'
  const avatarUrl = getFotoUrl(user?.foto_url)
  const today = useMemo(() => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date()).replace('.', ''), [])

  const go = (path) => { setDropdownOpen(false); setQuickOpen(false); navigate(path) }
  const signOut = () => { setDropdownOpen(false); logout(); navigate('/') }

  return (
    <header className="app-topbar">
      <div className="topbar-left">
        <button type="button" onClick={onMenuClick} className="topbar-menu" aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}><Icon name={sidebarOpen ? 'close' : 'menu'} /></button>
        <div className="topbar-route"><span>{today}</span><div><strong>{title}</strong><small>{subtitle}</small></div></div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-quick-wrap">
          <button type="button" className="topbar-quick" onClick={() => setQuickOpen((value) => !value)} aria-expanded={quickOpen}><Icon name="spark" /> <span>Criar</span></button>
          <AnimatePresence>{quickOpen && <><button className="topbar-dismiss" type="button" aria-label="Fechar" onClick={() => setQuickOpen(false)} /><motion.div className="topbar-popover topbar-create-menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}><small>AÇÃO RÁPIDA</small><button onClick={() => go('/planejamento-inteligente')}>Montar planejamento <b>→</b></button><button onClick={() => go('/redacoes')}>Começar redação <b>→</b></button><button onClick={() => go(user?.tipo === 'aluno' ? '/minhas-atividades' : '/atividades')}>Abrir atividades <b>→</b></button></motion.div></>}</AnimatePresence>
        </div>
        <button type="button" className="topbar-icon-button" onClick={() => go('/avisos')} aria-label="Abrir avisos"><Icon name="bell" /></button>
        <ThemeToggle className="topbar-theme" />
        <div className="topbar-profile-wrap">
          <button type="button" className="topbar-profile" onClick={() => setDropdownOpen((value) => !value)} aria-expanded={dropdownOpen}>
            <span className="topbar-avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : displayName.charAt(0).toUpperCase()}</span>
            <span className="topbar-profile-copy"><strong>{displayName}</strong><small>{user?.tipo || 'aluno'}</small></span>
            <Icon name="chevron" className={dropdownOpen ? 'is-open' : ''} />
          </button>
          <AnimatePresence>{dropdownOpen && <><button className="topbar-dismiss" type="button" aria-label="Fechar" onClick={() => setDropdownOpen(false)} /><motion.div className="topbar-popover topbar-profile-menu" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}><div><strong>{displayName}</strong><small>{user?.email}</small></div><button onClick={() => go('/perfil')}>Meu perfil</button><button onClick={() => go('/alterar-senha')}>Segurança</button>{isAdmin && <button onClick={() => go('/usuarios')}>Administração</button>}{isDono && <button onClick={() => go('/dono')}>Central do proprietário</button>}<button className="is-danger" onClick={signOut}>Sair da conta</button></motion.div></>}</AnimatePresence>
        </div>
      </div>
    </header>
  )
}
