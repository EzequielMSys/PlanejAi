export default function RouteLoading({ label = 'Preparando seu espaço…', embedded = false }) {
  return <div className={`route-loading${embedded ? ' route-loading--embedded' : ''}`} role="status" aria-live="polite" aria-busy="true">
    <div className="route-loading-label"><span className="route-loading-mark" aria-hidden="true">✦</span><span>{label}</span></div>
    <div className="route-skeleton" aria-hidden="true"><div className="skeleton-line skeleton-line--title" /><div className="skeleton-line" /><div className="skeleton-feature" /><div className="skeleton-cards"><i /><i /><i /></div></div>
  </div>
}
