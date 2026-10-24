import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiUrl } from '../config/api'
import { currentUser, listQueue, syncQueue } from '../utils/offlineStore'

export default function ConnectionStatus() {
  const [status, setStatus] = useState('checking')
  const [pending, setPending] = useState(0)
  const [conflicts, setConflicts] = useState(0)
  const checking = useRef(false)
  const controller = useRef(null)
  const refreshQueue = useCallback(async () => {
    const owner = currentUser()
    const items = await listQueue().catch(() => [])
    setPending(items.filter(i => i.owner === owner && i.status === 'PENDING').length)
    setConflicts(items.filter(i => i.owner === owner && i.status === 'CONFLICT').length)
  }, [])
  const checkConnection = useCallback(async () => {
    if (checking.current) return
    if (!window.navigator.onLine) { setStatus('offline'); return }
    checking.current = true
    controller.current = new window.AbortController()
    const activeController = controller.current
    const timeout = window.setTimeout(() => activeController.abort(), 6000)
    try {
      const response = await fetch(apiUrl('/api/health'), { signal: activeController.signal, cache: 'no-store' })
      if (controller.current !== activeController) return
      setStatus(response.ok ? 'online' : 'server')
      if (response.ok) await syncQueue()
    } catch { if (controller.current === activeController) setStatus('server') }
    finally { window.clearTimeout(timeout); if (controller.current === activeController) checking.current = false }
  }, [])
  useEffect(() => {
    refreshQueue()
    window.addEventListener('planejai:offline-change', refreshQueue)
    return () => window.removeEventListener('planejai:offline-change', refreshQueue)
  }, [refreshQueue])
  useEffect(() => {
    const checkVisible = () => { if (!document.hidden) checkConnection() }
    checkConnection()
    const interval = window.setInterval(checkVisible, 30000)
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    document.addEventListener('visibilitychange', checkVisible)
    return () => {
      controller.current?.abort()
      controller.current = null
      checking.current = false
      window.clearInterval(interval)
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
      document.removeEventListener('visibilitychange', checkVisible)
    }
  }, [checkConnection])
  if ((status === 'checking' || status === 'online') && pending === 0 && conflicts === 0) return null
  return <div className="connection-alert" role="status"><span className="connection-alert-dot" />
    <p><strong>{conflicts > 0 ? `${conflicts} item(ns) precisam de revisão antes de sincronizar.` : status === 'online' ? `${pending} item(ns) aguardando sincronização.` : status === 'offline' ? 'Você está sem internet.' : 'Servidor indisponível.'}</strong>{' '}
      {status === 'offline' ? 'Algumas alterações podem ficar apenas neste aparelho. Confira o aviso de salvamento em cada tela.' : status === 'online' ? 'Os envios que estão na fila serão sincronizados automaticamente.' : 'Não conseguimos confirmar a conexão. Confira os avisos de salvamento antes de sair.'}</p>
    <button type="button" onClick={checkConnection}>Tentar novamente</button><Link to="/status">Ver diagnóstico</Link>
  </div>
}
