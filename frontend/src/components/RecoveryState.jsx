import './RecoveryState.css'
import ContentState from './ContentState'
export default function RecoveryState({ title = 'Não conseguimos carregar esta parte.', children, onRetry, busy = false }) {
  return <ContentState kind="error" className="recovery-state" title={title} onAction={onRetry} actionLabel="Tentar novamente" busy={busy}>{children || <p>Não foi possível confirmar os dados agora. Confira sua conexão e tente novamente.</p>}</ContentState>
}
