import { useEffect, useState } from 'react'
import './RecoveryState.css'
export default function RouteLoading({ label = 'Preparando seu espaço…', embedded = false }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setSlow(true), 8000); return () => window.clearTimeout(timer) }, [])
  return <div className={`route-loading${embedded ? ' route-loading--embedded' : ''}`} role="status" aria-live="polite" aria-busy="true">
    <div className="route-loading-label"><span className="route-loading-mark" aria-hidden="true">✦</span><span>{label}</span></div>
    <div className="route-skeleton" aria-hidden="true"><div className="skeleton-line skeleton-line--title" /><div className="skeleton-line" /><div className="skeleton-feature" /><div className="skeleton-cards"><i /><i /><i /></div></div>
    {slow && <p className="route-loading-note">Está demorando mais que o esperado. Você pode continuar aguardando; evite recarregar se houver um formulário aberto. Quando a consulta falhar, a tela oferecerá uma nova tentativa.</p>}
  </div>
}
