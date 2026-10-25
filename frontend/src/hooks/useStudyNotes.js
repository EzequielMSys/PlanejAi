import { useEffect, useRef, useState } from 'react'
import aprendizagem from '../services/aprendizagemService'
import { scopedCacheKey } from '../utils/offlineStore'

export default function useStudyNotes(contentId, fallbackId) {
  const key = scopedCacheKey(`study-note:${contentId || fallbackId || 'free'}`)
  const operation = useRef(null)
  if (operation.current?.key !== key) operation.current = { key, text: '', version: 0, confirmed: -1, localSaved: false, busy: false, active: true }
  const current = operation.current
  const [notes, setText] = useState('')
  const [status, setStatus] = useState('loading')
  const [savedAt, setSavedAt] = useState(null)
  const [revision, setRevision] = useState(0)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const ready = useRef(false)
  const isCurrent = () => current.active && operation.current === current && scopedCacheKey(`study-note:${contentId || fallbackId || 'free'}`) === key
  function draft(text) {
    try { localStorage.setItem(key, JSON.stringify({ text, dirty: true, updatedAt: new Date().toISOString() })); current.localSaved = true; return true }
    catch { current.localSaved = false; return false }
  }
  useEffect(() => {
    let active = true
    current.active = true
    ready.current = false
    setStatus('loading'); setRevision(0); setSavedAt(null); setText('')
    let local = null
    try { local = JSON.parse(localStorage.getItem(key) || 'null') } catch { /* A damaged draft must not break the editor. */ }
    async function load() {
      let remote = null
      try { if (contentId) remote = await aprendizagem.anotacao(contentId) } catch { /* A local draft can still be recovered. */ }
      if (!active || !isCurrent()) return
      // Unsent work wins over a cached or older server copy, and requires explicit resend.
      const recovered = local?.dirty && typeof local.text === 'string'
      const deviceCopy = !recovered && (!remote || remote.offline) && typeof local?.text === 'string'
      if (contentId && !remote && !recovered && !deviceCopy) { setStatus('unavailable'); return }
      const text = recovered || deviceCopy ? local.text : remote?.texto || ''
      current.text = text
      current.localSaved = Boolean(recovered)
      current.confirmed = remote && !remote.offline && !recovered ? 0 : -1
      setText(text)
      setSavedAt(recovered ? local.updatedAt : remote?.atualizadoEm || null)
      setStatus(recovered ? 'local' : deviceCopy || remote?.offline ? 'cached' : remote ? 'saved' : 'ready')
      ready.current = true
    }
    load()
    return () => { active = false; current.active = false }
  }, [key, contentId, loadAttempt])

  function setNotes(value) {
    if (!ready.current || !isCurrent()) return
    const text = typeof value === 'function' ? value(current.text) : value
    current.text = text
    current.version++
    setText(text)
    const persisted = draft(text)
    setStatus(persisted ? 'pending' : 'unsaved')
    setRevision(current.version)
  }
  function save() {
    if (!isCurrent() || !ready.current) return Promise.resolve(false)
    if (current.busy) return current.promise
    if (current.confirmed === current.version) return Promise.resolve(true)
    if (current.version === 0 && !current.localSaved) return Promise.resolve(false)
    if (!contentId) { setStatus(draft(current.text) ? 'local' : 'unsaved'); return Promise.resolve(false) }
    current.busy = true
    const version = current.version, text = current.text
    setStatus('saving')
    async function write() {
      try {
        const result = await aprendizagem.salvarAnotacao(contentId, text)
        if (!isCurrent()) return
        if (version === current.version) {
          if (result?.offline || result?.queued) setStatus(draft(text) ? 'local' : 'unsaved')
          else {
            current.confirmed = version
            current.localSaved = false
            setStatus('saved'); setSavedAt(result?.atualizadoEm || new Date().toISOString())
            // Preserva uma cópia confirmada para reabrir sem rede. Não é envio pendente.
            try { localStorage.setItem(key, JSON.stringify({ text, dirty: false, updatedAt: result?.atualizadoEm || new Date().toISOString() })) } catch { /* A conta confirmou; não prometer cópia local. */ }
          }
        }
      } catch {
        if (isCurrent() && version === current.version) {
          setStatus(draft(text) ? 'error' : 'unsaved')
          setSavedAt(new Date().toISOString())
        }
      } finally {
        current.busy = false
      }
    }
    current.promise = write().then(() => {
      // Serialize requests: an older request cannot overwrite a newer note.
      if (isCurrent() && version !== current.version) return save()
      return isCurrent() && current.confirmed === current.version
    })
    return current.promise
  }
  useEffect(() => {
    if (!revision || !ready.current) return
    const timer = window.setTimeout(save, 650)
    return () => window.clearTimeout(timer)
  }, [revision, key])
  useEffect(() => {
    if (current.version <= current.confirmed || current.version === 0 || current.localSaved) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [status, revision, key])
  return { notes, setNotes, status, savedAt, retry: status === 'unavailable' ? () => setLoadAttempt(value => value + 1) : save, loading: status === 'loading' || status === 'unavailable', flush: async () => ({ confirmed: await save(), local: current.localSaved, unchanged: current.version === 0 && !current.localSaved }) }
}
