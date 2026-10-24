import { useEffect, useRef, useState } from 'react'
import { scopedCacheKey, currentUser } from '../utils/offlineStore'
import useExitWarning from './useExitWarning'
function read(key) {
  try {
    const draft = JSON.parse(localStorage.getItem(key) || 'null')
    const value = draft?.value
    return draft?.version === 1 && typeof value?.formData?.areas_foco === 'string' && typeof value.formData.objetivo === 'string' && Array.isArray(value.disponibilidade) && value.disponibilidade.length === 7 && value.disponibilidade.every(day => typeof day.dia_semana === 'string' && typeof day.hora_inicio === 'string' && typeof day.hora_fim === 'string') ? draft : null
  } catch { return null }
}
export default function usePlanningDraft(value, ready) {
  const key = scopedCacheKey('planning-draft:v1')
  const owner = useRef(currentUser())
  const [offer, setOffer] = useState(() => read(key))
  const [status, setStatus] = useState('ready')
  const baseline = useRef(null)
  const cleared = useRef(false)
  const serialized = JSON.stringify(value)
  useEffect(() => {
    if (!ready || currentUser() === 'anonymous' || owner.current !== currentUser() || cleared.current) return
    if (baseline.current === null) { baseline.current = serialized; return }
    if (serialized === baseline.current) return
    try { localStorage.setItem(key, JSON.stringify({ version: 1, value: JSON.parse(serialized), savedAt: new Date().toISOString() })); setStatus('local'); setOffer(null) }
    catch { setStatus('unsaved') }
  }, [serialized, ready, key])
  useExitWarning(status === 'unsaved')
  const clear = () => { if (owner.current !== currentUser()) return; cleared.current = true; try { localStorage.removeItem(key) } catch { /* Não afirmar remoção; a conta foi confirmada. */ } setOffer(null); setStatus('ready') }
  return { offer: owner.current === currentUser() ? offer : null, status, dismiss: () => setOffer(null), clear }
}
