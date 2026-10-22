import { useId } from 'react'
import './Logo.css'

// Livro, percurso e ponto de descoberta em um símbolo legível também a 16 px.
export default function Logo({ className = 'w-9 h-9', title = 'PlanejAI', animado = true }) {
  const gradientId = `pn-brand-${useId().replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 48 48"
      className={`${className}${animado ? ' pn-logo-interactive' : ''}`}
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="5" y1="5" x2="44" y2="45" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--pn-primaria)" />
          <stop offset="1" stopColor="var(--pn-primaria-hover)" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="14" fill={`url(#${gradientId})`} />
      <path className="pn-logo-book" d="M9.5 16.5c5-2.2 10.1-1.6 14.5 2.3 4.4-3.9 9.5-4.5 14.5-2.3v17.7c-5-2.2-10.1-1.6-14.5 2.3-4.4-3.9-9.5-4.5-14.5-2.3V16.5Z" fill="none" stroke="#fff" strokeWidth="2.7" strokeLinejoin="round" />
      <path d="M24 18.8v17.7" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".75" />
      <path className="pn-logo-route" d="M14 29c2-4.8 4.6-7.5 7.7-7.5 2.6 0 3.2 4.6 5.8 4.6 1.9 0 3.3-2.3 5-5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path className="pn-logo-spark" d="m33 8 1.25 3.75L38 13l-3.75 1.25L33 18l-1.25-3.75L28 13l3.75-1.25L33 8Z" fill="#fff" />
    </svg>
  )
}
