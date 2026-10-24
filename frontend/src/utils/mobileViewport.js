// visualViewport follows the keyboard on browsers whose layout viewport does not.
export function observeMobileViewport(win = window) {
  const viewport = win.visualViewport
  if (!viewport) return () => {}
  const root = win.document.documentElement
  let frame
  const update = () => {
    const height = Math.round(viewport.height)
    if (!Number.isFinite(height) || height <= 0) return
    root.style.setProperty('--visible-viewport-height', `${height}px`)
    const focused = win.document.activeElement
    const editing = focused?.matches('textarea, input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=color]), [contenteditable=true]')
    root.toggleAttribute('data-mobile-keyboard', Boolean(editing && Math.abs((viewport.scale || 1) - 1) < .05 && win.innerWidth <= 680 && (win.innerHeight - height > 120 || height < 450)))
  }
  const schedule = () => { win.cancelAnimationFrame(frame); frame = win.requestAnimationFrame(update) }
  viewport.addEventListener('resize', schedule)
  viewport.addEventListener('scroll', schedule)
  win.document.addEventListener('focusin', schedule)
  win.document.addEventListener('focusout', schedule)
  update()
  return () => {
    win.cancelAnimationFrame(frame)
    viewport.removeEventListener('resize', schedule)
    viewport.removeEventListener('scroll', schedule)
    win.document.removeEventListener('focusin', schedule)
    win.document.removeEventListener('focusout', schedule)
    root.removeAttribute('data-mobile-keyboard')
    root.style.removeProperty('--visible-viewport-height')
  }
}
