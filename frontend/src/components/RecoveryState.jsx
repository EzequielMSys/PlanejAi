import './RecoveryState.css'
export default function RecoveryState({ title = 'Não conseguimos carregar esta parte.', children, onRetry, busy = false }) {
  return <section className="recovery-state" role="alert"><h2>{title}</h2><div>{children || <p>Confira sua conexão e tente novamente. Uma falha de consulta não significa que seus registros foram apagados.</p>}</div>{onRetry && <button type="button" disabled={busy} onClick={onRetry}>{busy ? 'Tentando novamente…' : 'Tentar novamente'}</button>}</section>
}
