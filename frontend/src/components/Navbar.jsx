import ConnectedPages from './ConnectedPages'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAccessibility } from '../context/AccessibilityContext'
import { useAuth } from '../context/AuthContext'
import { searchPages, pageFor } from '../config/navigation'
import Icon from './Icons'
import ThemeToggle from './ThemeToggle'
import ColorPicker from './ColorPicker'

export default function Navbar({ onMenuClick, sidebarOpen }) {
  const { user, logout } = useAuth()
  const { settings, update } = useAccessibility()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const page = pageFor(pathname)
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef(null)
  const results = useMemo(() => searchPages(user?.tipo || 'aluno', query), [query, user?.tipo])
  const searchPath = `/busca${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ''}`
  useEffect(() => { setSearchOpen(false); setQuery('') }, [pathname])
  useEffect(() => {
    const key = event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(true); searchRef.current?.focus() }
      if (event.key === 'Escape') { setSearchOpen(false); searchRef.current?.blur() }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  return <header className="app-topbar sd-topbar">
    <div className="sd-topbar-context"><ConnectedPages compact/><button className="sd-icon-button sd-mobile-menu" type="button" onClick={onMenuClick} aria-controls="app-sidebar" aria-expanded={sidebarOpen} aria-label={sidebarOpen ? 'Fechar menu' : 'Abrir menu'}><Icon name="menu" /></button><div><span>{page.group}</span><strong>{page.title}</strong></div></div>
    <div className="sd-search"><form role="search" onSubmit={event => { event.preventDefault(); setSearchOpen(false); navigate(searchPath) }}><button className="sd-search-trigger" type="button" aria-label="Abrir busca unificada" aria-expanded={searchOpen} aria-controls="page-search-results" onClick={() => { setSearchOpen(true); searchRef.current?.focus() }}><Icon name="search" size={18} /></button><input ref={searchRef} type="search" value={query} placeholder="Encontre seu próximo passo" aria-label="Buscar no meu espaço" maxLength={100} onFocus={() => setSearchOpen(true)} onChange={event => { setQuery(event.target.value); setSearchOpen(true) }} /><kbd>Ctrl K</kbd></form>
      {searchOpen && <><button className="sd-search-dismiss" type="button" aria-label="Fechar busca" onClick={() => setSearchOpen(false)} /><div className="sd-search-results" id="page-search-results"><Link className="sd-unified-search-link" to={searchPath} onClick={() => setSearchOpen(false)}><Icon name="search"/><span><strong>Buscar no meu acervo</strong><small>Matérias, materiais, anotações e redações</small></span><Icon name="arrow" size={15}/></Link><span>PÁGINAS DO SEU ESPAÇO</span>{results.length ? results.map(item => <Link key={item.path} to={item.path} onClick={() => setSearchOpen(false)}><Icon name={item.icon} /><span><strong>{item.title}</strong><small>{item.group}</small></span><Icon name="arrow" size={15} /></Link>) : <p>Nenhuma página encontrada. Tente outro nome.</p>}</div></>}
    </div>
    <div className="sd-topbar-actions">{settings.focusMode && <button type="button" className="sd-focus-exit" onClick={() => update('focusMode', false)}>Sair do modo foco</button>}<ColorPicker /><ThemeToggle /><Link className="sd-icon-button sd-reading-shortcut" to="/preferencias" aria-label="Preferências de leitura"><span aria-hidden="true">Aa</span></Link><button type="button" className="sd-icon-button sd-signout" onClick={logout} aria-label="Sair da conta"><Icon name="logout" size={18} /></button></div>
  </header>
}
