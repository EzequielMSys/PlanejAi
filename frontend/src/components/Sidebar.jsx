import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { navigationFor } from '../config/navigation'
import Icon from './Icons'
import Logo from './Logo'
import Avatar from './Avatar'
import LumiMark from './LumiMark'

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const sidebarRef = useRef(null)
  const { pathname } = useLocation()
  const pages = navigationFor(user?.tipo || 'aluno')
  const groups = [...new Set(pages.filter(page => page.path !== '/lumi' && page.group !== 'Preferências').map(page => page.group))]
  useEffect(() => {
    if (!isOpen) return
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    const mobile = window.matchMedia('(max-width: 1023px)').matches
    if (!mobile) { onClose(); return }
    const sidebar = sidebarRef.current
    const workspace = sidebar?.parentElement?.querySelector('.app-workspace')
    const previousInert = workspace?.inert
    if (workspace) workspace.inert = true
    document.body.style.overflow = 'hidden'
    const focusable = () => [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
    focusable()[0]?.focus()
    const close = event => {
      if (event.key === 'Escape') { event.preventDefault(); onClose() }
      if (event.key === 'Tab') {
        const items = focusable(), first = items[0], last = items[items.length - 1]
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    const resized = () => { if (!window.matchMedia('(max-width: 1023px)').matches) onClose() }
    window.addEventListener('keydown', close)
    window.addEventListener('resize', resized)
    return () => {
      window.removeEventListener('keydown', close)
      window.removeEventListener('resize', resized)
      document.body.style.overflow = previousOverflow
      if (workspace) workspace.inert = previousInert || false
      if (previousFocus?.isConnected) previousFocus.focus()
    }
  }, [isOpen, onClose])
  return <>
    {isOpen && <button className="sd-sidebar-shade" type="button" onClick={onClose} aria-label="Fechar navegação" />}
    <aside ref={sidebarRef} id="app-sidebar" className={`app-sidebar sd-sidebar ${isOpen ? 'is-open' : ''}`} aria-label="Navegação principal">
      <div className="sd-brand-row"><Link to="/inicio" className="sd-brand" onClick={onClose}><Logo className="sd-brand-mark" animado={false} /><span>Planej<span>AI</span><small>espaço para aprender</small></span></Link><button className="sd-sidebar-close" type="button" onClick={onClose} aria-label="Fechar menu lateral"><Icon name="close" /></button></div>
      <nav className="sd-navigation" aria-label="Páginas do PlanejAI">
        {groups.map(group => <section key={group}><h2>{group}</h2>{pages.filter(page => page.group === group).map(page => <NavLink key={page.path} to={page.path} onClick={onClose} aria-current={page.path === '/inicio' && pathname === '/dashboard' ? 'page' : undefined} className={({ isActive }) => `sd-nav-link${isActive || page.path === '/inicio' && pathname === '/dashboard' ? ' is-active' : ''}`}><Icon name={page.icon} /><span>{page.title}</span></NavLink>)}</section>)}
      </nav>
      <Link to="/lumi" className={`sd-lumi-link${pathname === '/lumi' || pathname === '/chat' ? ' is-active' : ''}`} onClick={onClose}><LumiMark /><span><strong>Estude com a Lumi</strong><small>Uma dúvida pode virar descoberta.</small></span><Icon name="arrow" size={16} /></Link>
      <div className="sd-sidebar-bottom"><NavLink className="sd-nav-link" to="/preferencias" onClick={onClose}><Icon name="palette" /><span>Meu espaço</span></NavLink><Link className="sd-account" to="/perfil" onClick={onClose}><Avatar src={user?.foto_url} nome={user?.apelido || user?.nome} tamanho={34} /><span><strong>{user?.apelido || user?.nome || 'Minha conta'}</strong><small>{user?.tipo === 'aluno' ? 'Estudante' : user?.tipo === 'docente' ? 'Docente' : 'Gestão'}</small></span><Icon name="settings" size={17} /></Link></div>
    </aside>
  </>
}
