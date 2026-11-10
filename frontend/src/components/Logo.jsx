import { useId } from 'react'
import maskImage from '../assets/planejai-logo-mask.png'
import './Logo.css'

/** Recorte fiel da marca fornecida, colorido pelo tema atual. */
export default function Logo({ className = 'w-9 h-9', title = 'PlanejAI', animado = true, monochrome = false, decorative = false }) {
  const maskId = useId()
  return <svg viewBox="0 0 413 372" className={['pn-logo',className,animado?'pn-logo-interactive':'',monochrome?'is-monochrome':''].join(' ')} role={decorative ? undefined : 'img'} aria-label={decorative ? undefined : title} aria-hidden={decorative ? 'true' : undefined} xmlns="http://www.w3.org/2000/svg">
    <defs><mask id={maskId} maskContentUnits="userSpaceOnUse"><image href={maskImage} width="413" height="372" /></mask></defs>
    <rect width="413" height="372" fill="currentColor" mask={`url(#${maskId})`} />
  </svg>
}
export function BrandName() {
  return <span className="pn-wordmark">Planej<span className="pn-wordmark-ai">AI</span><span className="pn-wordmark-point" aria-hidden="true">.</span></span>
}
