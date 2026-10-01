import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import './CommandPalette.css'

const DESTINOS = [
  { path: '/inicio', title: 'Visão geral', hint: 'Seu ponto de partida', code: '01', keys: 'Alt 1' },
  { path: '/cronograma', title: 'Cronograma', hint: 'Planejamento e conteúdos', code: '02', keys: 'Alt C' },
  { path: '/redacoes', title: 'Estúdio de redação', hint: 'Escrever, revisar e evoluir', code: '03', keys: 'Alt R' },
  { path: '/atividades', title: 'Atividades', hint: 'Práticas e desafios', code: '04', keys: 'Alt A' },
  { path: '/minhas-atividades', title: 'Minhas entregas', hint: 'Acompanhar pendências', code: '05' },
  { path: '/avisos', title: 'Avisos', hint: 'Recados importantes', code: '06' },
  { path: '/perfil', title: 'Perfil e rotina', hint: 'Conta, segurança e estudos', code: '07' }
]

function normalizar(valor) {
  return valor.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export default function CommandPalette({ onOpenChange }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const inputRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)

  const resultados = useMemo(() => {
    const alvo = normalizar(query.trim())
    return alvo ? DESTINOS.filter((item) => normalizar(`${item.title} ${item.hint}`).includes(alvo)) : DESTINOS
  }, [query])

  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault(); setOpen((value) => !value)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    onOpenChange?.(open)
    if (open) window.setTimeout(() => inputRef.current?.focus(), 50)
    else { setQuery(''); setSelected(0) }
  }, [open, onOpenChange])

  useEffect(() => setOpen(false), [pathname])

  function ir(path) { setOpen(false); navigate(path) }

  function keyboard(event) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setSelected((value) => (value + 1) % Math.max(1, resultados.length)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setSelected((value) => (value - 1 + Math.max(1, resultados.length)) % Math.max(1, resultados.length)) }
    if (event.key === 'Enter' && resultados[selected]) { event.preventDefault(); ir(resultados[selected].path) }
  }

  return <>
    <button type="button" className="command-trigger" onClick={() => setOpen(true)} aria-label="Abrir busca rápida"><span>Ir para</span><kbd>Ctrl K</kbd></button>
    {open && <div className="command-overlay" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
      <section className="command-dialog" role="dialog" aria-modal="true" aria-label="Navegação rápida">
        <header><span className="command-mark">P/</span><input ref={inputRef} value={query} onChange={(e) => { setQuery(e.target.value); setSelected(0) }} onKeyDown={keyboard} placeholder="Onde você quer chegar?" aria-label="Buscar página" /><kbd>ESC</kbd></header>
        <div className="command-caption"><span>NAVEGAÇÃO</span><small>{resultados.length} destinos</small></div>
        <div className="command-results">{resultados.map((item, index) => <button type="button" className={`${selected === index ? 'is-selected' : ''} ${pathname === item.path ? 'is-current' : ''}`} key={item.path} onMouseEnter={() => setSelected(index)} onClick={() => ir(item.path)}><span>{item.code}</span><div><b>{item.title}</b><small>{item.hint}</small></div>{item.keys && <kbd>{item.keys}</kbd>}</button>)}{resultados.length === 0 && <p>Nenhum destino com esse nome.</p>}</div>
        <footer><span><i /> selecionar</span><span>↑ ↓ navegar</span><span>↵ abrir</span></footer>
      </section>
    </div>}
  </>
}
