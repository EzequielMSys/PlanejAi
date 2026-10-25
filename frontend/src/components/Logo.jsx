import './Logo.css'
import { BRAND_PATH } from '../theme/brandGeometry'

/** P aberto: uma curva contínua e um ponto que convida ao próximo passo. */
export default function Logo({ className = 'w-9 h-9', title = 'PlanejAI', animado = true, monochrome = false, decorative = false }) {
  return <svg viewBox="0 0 48 48" className={['pn-logo',className,animado?'pn-logo-interactive':'',monochrome?'is-monochrome':''].join(' ')} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : title} aria-hidden={decorative ? 'true' : undefined} xmlns="http://www.w3.org/2000/svg">
    <path d={BRAND_PATH} fill="currentColor"/>
    <circle className="pn-logo-point" cx="36" cy="38" r="5" fill="currentColor"/>
  </svg>
}
export function BrandName() {
  return <span className="pn-wordmark">Planej<span className="pn-wordmark-ai">AI</span><span className="pn-wordmark-point" aria-hidden="true">.</span></span>
}
