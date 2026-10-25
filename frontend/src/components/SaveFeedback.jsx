import './SaveFeedback.css'

const labels = {
  loading: 'Carregando suas anotações…', ready: 'Suas alterações serão salvas automaticamente.',
  pending: 'Alterações pendentes de envio…', saving: 'Salvando na sua conta…', saved: 'Salvo na sua conta.',
  local: 'Salvo apenas neste aparelho. O servidor ainda não confirmou o envio.',
  cached: 'Cópia disponível neste aparelho. A conexão com o servidor não foi confirmada.',
  unsaved: 'Não foi possível salvar. Mantenha esta aba aberta e tente novamente.',
  error: 'Não foi possível salvar na sua conta. O rascunho está neste aparelho; tente enviar novamente.',
  unavailable: 'Não foi possível carregar suas anotações. O editor aguarda a consulta para não substituir um texto salvo por uma página vazia.',
}
export default function SaveFeedback({ status = 'ready', message, onRetry, savedAt }) {
  const date = savedAt && new Date(savedAt)
  const time = date && !Number.isNaN(date.getTime()) ? date.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}) : null
  return <div className="save-feedback" data-state={status}><p role="status" aria-live="polite"><span aria-hidden="true">{status === 'saved' ? '✓' : ['local', 'unsaved', 'error', 'unavailable'].includes(status) ? '!' : '•'}</span><span>{message || labels[status] || 'Verifique o salvamento.'}{time && status === 'saved' && <time dateTime={date.toISOString()}> · {time}</time>}</span></p>{onRetry && ['local', 'unsaved', 'error', 'unavailable'].includes(status) && <button type="button" onClick={onRetry}>{status === 'unavailable' ? 'Tentar carregar novamente' : 'Tentar salvar novamente'}</button>}</div>
}
