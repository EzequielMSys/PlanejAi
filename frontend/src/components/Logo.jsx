export default function Logo({ className = 'w-9 h-9', title = 'PlanejAI' }) {
  return <svg viewBox="0 0 40 40" className={className} role="img" aria-label={title}>
    <rect x="1" y="1" width="38" height="38" rx="9" fill="var(--pn-primaria)" />
    <path d="M11 11h9a8 8 0 0 1 0 16h-3v4h-6V11Zm6 5v6h3a3 3 0 0 0 0-6h-3Z" fill="var(--pn-on-primaria)" />
    <path d="m26 10 4-3v8" fill="none" stroke="var(--pn-on-primaria)" strokeWidth="1.5" />
  </svg>
}
