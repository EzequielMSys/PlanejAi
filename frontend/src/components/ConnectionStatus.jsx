import { useCallback, useEffect, useState } from 'react'
import { apiUrl } from '../config/api'

export default function ConnectionStatus() {
  const [status, setStatus] = useState('checking')

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
    } catch {
      setStatus('server')
    }
  }, [])

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

  if (status === 'checking' || status === 'online') return null

  return (
    <div className="connection-alert" role="status">
      <span className="connection-alert-dot" />
      <p>
        <strong>{status === 'offline' ? 'Você está sem internet.' : 'Servidor indisponível.'}</strong>{' '}
        {status === 'offline'
          ? 'Não será possível salvar até a conexão voltar.'
          : 'Verifique o backend e a conexão com o banco.'}
      </p>
      <button type="button" onClick={checkConnection}>Tentar novamente</button>
      <a href="#/status">Ver diagnóstico</a>
    </div>
  )
}
