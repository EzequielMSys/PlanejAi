import { useEffect, useRef, useState } from 'react'
import { useAccessibility } from '../context/AccessibilityContext'
import './Accessibility.css'

export default function AccessibilityToolbar() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const { settings, update, reset } = useAccessibility()

  useEffect(() => {
    if (!open) return undefined
    const close = (event) => {
      if (event.key === 'Escape') setOpen(false)
      if (event.key !== 'Tab') return
      const focusable = panelRef.current?.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', close)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', close)
  }, [open])

  function closePanel() {
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  function read() {
    window.speechSynthesis.cancel()
    const selected = window.getSelection()?.toString().trim()
    const text = selected || document.querySelector('#conteudo-principal')?.innerText || ''
    const utterance = new window.SpeechSynthesisUtterance(text.slice(0, 12000))
    utterance.lang = 'pt-BR'
    utterance.rate = 0.95
    window.speechSynthesis.speak(utterance)
  }

  return (
    <aside className="a11y-toolbar" aria-label="Recursos de acessibilidade">
      {open && (
        <section ref={panelRef} tabIndex="-1" id="a11y-panel" role="dialog" aria-modal="true" aria-labelledby="a11y-title" className="a11y-panel">
          <header><div><small>PREFERÊNCIAS</small><h2 id="a11y-title">Leitura e conforto</h2></div><button type="button" onClick={closePanel} aria-label="Fechar preferências">×</button></header>
          <label>Tamanho do texto <output>{settings.fontScale}%</output><input type="range" min="90" max="140" step="10" value={settings.fontScale} onChange={(e) => update('fontScale', Number(e.target.value))} /></label>
          <label>Espaçamento <output>{settings.lineHeight}</output><input type="range" min="1.3" max="2" step="0.1" value={settings.lineHeight} onChange={(e) => update('lineHeight', Number(e.target.value))} /></label>
          <div className="a11y-options">
            {[['highContrast', 'Alto contraste'], ['reducedMotion', 'Reduzir animações'], ['dyslexicFont', 'Fonte de alta legibilidade'], ['focusMode', 'Modo com menos estímulos']].map(([key, label]) => <label key={key}><input type="checkbox" checked={settings[key]} onChange={(e) => update(key, e.target.checked)} /><span>{label}</span></label>)}
          </div>
          <div className="a11y-actions"><button type="button" onClick={read}>Ler página ou seleção</button><button type="button" onClick={() => window.speechSynthesis.cancel()}>Parar</button><button type="button" onClick={reset}>Restaurar</button></div>
        </section>
      )}
      <button ref={triggerRef} type="button" aria-expanded={open} aria-controls="a11y-panel" onClick={() => open ? closePanel() : setOpen(true)} className="a11y-trigger"><span aria-hidden="true">Aa</span><strong>Acessibilidade</strong></button>
    </aside>
  )
}
