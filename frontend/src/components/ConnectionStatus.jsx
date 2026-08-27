import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '../config/api'
import { listQueue, syncQueue } from '../utils/offlineStore'

export default function ConnectionStatus() {
  const [status, setStatus] = useState('checking')
  const [pending, setPending] = useState(0)
  const [conflicts, setConflicts] = useState(0)

  const checkConnection = useCallback(async () => {
    if (!window.navigator.onLine) {
      setStatus('offline')
      return
    }

    try {
      const controller = new window.AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 6000)
      const response = await fetch(apiUrl('/api/health'), { signal: controller.signal })
      window.clearTimeout(timeout)
      setStatus(response.ok ? 'online' : 'server')
      if(response.ok)await syncQueue()
    } catch {
      setStatus('server')
    }
  }, [])

  useEffect(()=>{const refresh=()=>listQueue().then(items=>{setPending(items.filter(i=>i.status==='PENDING').length);setConflicts(items.filter(i=>i.status==='CONFLICT').length)}).catch(()=>{});refresh();window.addEventListener('planejai:offline-sync',refresh);return()=>window.removeEventListener('planejai:offline-sync',refresh)},[])

  useEffect(() => {
    checkConnection()
    const interval = window.setInterval(checkConnection, 30000)
    window.addEventListener('online', checkConnection)
    window.addEventListener('offline', checkConnection)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('online', checkConnection)
      window.removeEventListener('offline', checkConnection)
    }
  }, [checkConnection])

  if ((status === 'checking' || status === 'online') && pending === 0 && conflicts === 0) return null

  return (
    <div className="connection-alert" role="status">
      <span className="connection-alert-dot" />
      <p>
        <strong>{conflicts>0?`${conflicts} item(ns) precisam de revisão antes de sincronizar.`:status === 'online' ? `${pending} item(ns) aguardando sincronização.` : status === 'offline' ? 'Você está sem internet.' : 'Servidor indisponível.'}</strong>{' '}
        {status === 'offline'
          ? 'Seu trabalho compatível ficará salvo neste aparelho e será enviado depois.'
          : 'Verifique o backend e a conexão com o banco.'}
      </p>
      <button type="button" onClick={checkConnection}>Tentar novamente</button>
      <a href="#/status">Ver diagnóstico</a>
    </div>
  )
}
