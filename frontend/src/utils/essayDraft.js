import { scopedCacheKey } from './offlineStore'
export const essayDraftKey = () => scopedCacheKey('essay-draft:v3')
export function readEssayDraft() {
  try { const value = JSON.parse(localStorage.getItem(essayDraftKey()) || 'null'); return value && typeof value.tema === 'string' && typeof value.texto === 'string' ? value : null } catch { return null }
}
export function writeEssayDraft(form) {
  const value = { tema: form.tema, texto: form.texto, salvoEm: new Date().toISOString(), queuedVersion: readEssayDraft()?.queuedVersion }
  try { localStorage.setItem(essayDraftKey(), JSON.stringify(value)); return value.salvoEm } catch { return null }
}
export function markEssayQueued(form) {
  try { localStorage.setItem(essayDraftKey(), JSON.stringify({ ...form, salvoEm: new Date().toISOString(), queuedVersion: JSON.stringify(form) })); return true } catch { return false }
}
