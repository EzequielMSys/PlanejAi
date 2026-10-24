import { useLocation } from 'react-router-dom'

export default function SectionLink({ target, children, ...props }) {
  const location = useLocation()
  return <a {...props} href={`#${location.pathname}${location.search}`} onClick={event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    const element = document.getElementById(target)
    if (!element) return
    const reduced = document.documentElement.classList.contains('a11y-reduced-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    element.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    if (!element.hasAttribute('tabindex')) element.setAttribute('tabindex', '-1')
    element.focus({ preventScroll: true })
  }}>{children}</a>
}
