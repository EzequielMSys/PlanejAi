import { useState } from 'react'
import { toast } from 'react-hot-toast'
import aprendizagem from '../services/aprendizagemService'
import { reviewReason } from '../utils/recommendationReasons'
import './StudyRecommendations.css'

export default function ReviewRecommendation({ item, onSaved }) {
  const [days, setDays] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  async function postpone() {
    if (saving) return
    setSaving(true); setError('')
    try {
      await aprendizagem.adiarRevisao(item.id_revisao, Number(days))
      setSaved(true)
      toast.success('Revisão reagendada e salva na sua conta.')
      await onSaved()
    } catch { setError('Não foi possível atualizar a fila. Atualize a página para conferir antes de reagendar novamente.') }
    finally { setSaving(false) }
  }
  return <details className="study-recommendation"><summary>Por que esta revisão? E se eu quiser mudar?</summary><p>{reviewReason(item)}</p><p>Prefere outro dia? Altera apenas a próxima data, sem registrar uma resposta ou aumentar seu domínio.</p>{saved ? <p role="status">Reagendamento salvo na sua conta.</p> : <div className="study-recommendation-actions"><label>Revisar<select value={days} onChange={event => setDays(event.target.value)} disabled={saving}><option value="1">Amanhã</option><option value="3">Em 3 dias</option><option value="7">Em 7 dias</option></select></label><button type="button" disabled={saving} onClick={postpone}>{saving ? 'Salvando…' : 'Confirmar nova data'}</button></div>}{error && <p role="alert">{error}</p>}</details>
}
