// Aguarda o título de uma rota lazy sem mover o foco enquanto alguém digita.
export function focusRouteContent() {
  let observer, timer
  const visible = element => {
    for (let node = element; node && node !== document.body; node = node.parentElement) {
      if (node.hidden || node.getAttribute('aria-hidden') === 'true' || window.getComputedStyle(node).display === 'none') return false
    }
    return true
  }
  const move = () => {
    if (document.activeElement?.matches('input,textarea,select,[contenteditable="true"]')) return true
    const region = document.getElementById('conteudo-principal') || document.querySelector('main')
    const title = region && [...region.querySelectorAll('h1')].find(visible)
    if (!title) return false
    title.setAttribute('tabindex', '-1')
    title.focus({ preventScroll: true })
    return true
  }
  const stop = () => { observer?.disconnect(); window.clearTimeout(timer) }
  if (!move()) {
    observer = new window.MutationObserver(() => { if (move()) stop() })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'style'] })
    timer = window.setTimeout(stop, 10000)
  }
  return stop
}
