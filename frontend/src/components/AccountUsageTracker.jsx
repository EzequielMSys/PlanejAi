import { useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { apiUrl } from '../config/api'

const SAMPLE_MS = 15_000
const IDLE_MS = 60_000
const events = ['pointerdown', 'keydown', 'wheel', 'touchstart']

export default function AccountUsageTracker() {
  const { token, user } = useAuth()
  const id = user?.id_usuario || user?.id

  useEffect(() => {
    if (!token || !id) return
    const abort = new AbortController()
    const foreground = () => document.visibilityState === 'visible' && document.hasFocus()
    let lastInteraction = -Infinity
    let activeSince = null
    let sending = false
    function reset() {
      activeSince = null
      lastInteraction = -Infinity
    }
    function mark(event) {
      if (!event.isTrusted || !foreground()) return
      const now = performance.now()
      if (now - lastInteraction >= IDLE_MS) activeSince = now
      lastInteraction = now
    }
    const timer = window.setInterval(async () => {
      const now = performance.now()
      if (!foreground() || now - lastInteraction >= IDLE_MS) {
        reset()
        return
      }
      if (sending || activeSince === null || now - activeSince < SAMPLE_MS) return
      activeSince = now
      sending = true
      try {
        await fetch(apiUrl('/api/usuarios/me/uso'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
          signal: AbortSignal.any([abort.signal, AbortSignal.timeout(10_000)])
        })
      } catch {
        // A conexão pode voltar durante um próximo intervalo ativo.
      } finally {
        sending = false
      }
    }, 1000)

    events.forEach(event => window.addEventListener(event, mark, { passive: true, capture: true }))
    window.addEventListener('blur', reset)
    document.addEventListener('visibilitychange', reset)
    return () => {
      abort.abort()
      window.clearInterval(timer)
      events.forEach(event => window.removeEventListener(event, mark, true))
      window.removeEventListener('blur', reset)
      document.removeEventListener('visibilitychange', reset)
    }
  }, [id, token])

  return null
}
