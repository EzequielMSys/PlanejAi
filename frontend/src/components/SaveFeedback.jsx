import './SaveFeedback.css'

const labels = {
  loading: 'Carregando suas anotações…', ready: 'Suas alterações serão salvas automaticamente.',
  pending: 'Alterações pendentes de envio…', saving: 'Salvando na sua conta…', saved: 'Salvo na sua conta.',
  local: 'Salvo apenas neste aparelho. O servidor ainda não confirmou o envio.',
  cached: 'Cópia disponível neste aparelho. A conexão com o servidor não foi confirmada.',
  unsaved: 'Não foi possível salvar. Mantenha esta aba aberta e tente novamente.',
}
export default function SaveFeedback({ status = 'ready', message, onRetry }) {
  return <div className="save-feedback" data-state={status}><p role="status" aria-live="polite"><span aria-hidden="true">{status === 'saved' ? '✓' : ['local', 'unsaved', 'error'].includes(status) ? '!' : '•'}</span>{message || labels[status] || 'Verifique o salvamento.'}</p>{onRetry && ['local', 'unsaved', 'error'].includes(status) && <button type="button" onClick={onRetry}>Tentar salvar novamente</button>}</div>
}
