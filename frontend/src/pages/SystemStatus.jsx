import { useCallback, useEffect, useState } from 'react'
import { API_ORIGIN, apiUrl } from '../config/api'

export default function SystemStatus() {
  const [result, setResult] = useState({ state: 'checking', latency: null, data: null, error: '' })
  const check = useCallback(async () => {
    const start = window.performance.now()
    setResult((current) => ({ ...current, state: 'checking', error: '' }))
    try {
      const controller = new window.AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 8000)
      const response = await fetch(apiUrl('/api/health'), { signal: controller.signal, cache: 'no-store' })
      window.clearTimeout(timeout)
      const data = await response.json().catch(() => ({}))
      setResult({ state: response.ok ? 'online' : 'error', latency: Math.round(window.performance.now() - start), data, error: response.ok ? '' : data.error || `HTTP ${response.status}` })
    } catch (error) {
      setResult({ state: 'offline', latency: null, data: null, error: error.name === 'AbortError' ? 'O servidor demorou mais de 8 segundos para responder.' : 'Não foi possível alcançar o backend.' })
    }
  }, [])

  useEffect(() => { check() }, [check])
  const online = result.state === 'online'
  return <main className="pj-page"><div className="pj-wrap"><header className="pj-panel" style={{ padding: 'clamp(1.5rem, 4vw, 3rem)' }}><span className="pj-eyebrow">PlanejAI / Diagnóstico</span><h1 style={{ marginTop: '.5rem', fontSize: 'clamp(2rem,5vw,4rem)', fontWeight: 950, letterSpacing: '-.055em' }}>Conexão sem mistério.</h1><p style={{ marginTop: '.75rem', maxWidth: '42rem', color: 'var(--pj-muted)' }}>Esta página separa problemas de internet, frontend, API e banco de dados — sem esconder a causa em uma mensagem genérica.</p></header>
    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '.8rem', marginTop: '.8rem' }}>
      <StatusCard label="Navegador" ok={window.navigator.onLine} value={window.navigator.onLine ? 'Internet detectada' : 'Sem conexão'} detail="Sinal informado pelo dispositivo" />
      <StatusCard label="Backend" ok={online} value={result.state === 'checking' ? 'Verificando…' : online ? 'Respondendo' : 'Indisponível'} detail={API_ORIGIN || 'Proxy local / mesma origem'} />
      <StatusCard label="Banco de dados" ok={result.data?.database === 'connected'} value={result.data?.database === 'connected' ? 'Conectado' : online ? 'Sem confirmação' : 'Não consultado'} detail={result.data?.environment || 'Ambiente não informado'} />
      <StatusCard label="Latência" ok={online && result.latency < 1500} value={result.latency === null ? '—' : `${result.latency} ms`} detail={result.latency > 1500 ? 'Resposta mais lenta que o esperado' : 'Tempo da verificação atual'} />
    </section>
    <section className="pj-panel" style={{ marginTop: '.8rem', padding: '1.5rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}><div><span className="pj-eyebrow">Resultado</span><h2 style={{ marginTop: '.3rem', fontSize: '1.35rem', fontWeight: 950 }}>{online ? 'Serviços essenciais funcionando' : result.state === 'checking' ? 'Executando diagnóstico' : 'A API precisa de atenção'}</h2></div><button className="pj-button pj-button--primary" onClick={check} disabled={result.state === 'checking'}>Testar novamente</button></div>{result.error && <p style={{ marginTop: '1rem', borderLeft: '3px solid var(--pj-danger)', paddingLeft: '.8rem', color: 'var(--pj-muted)' }}>{result.error}</p>}<details style={{ marginTop: '1.2rem', borderTop: '1px solid var(--pj-line)', paddingTop: '1rem' }}><summary style={{ cursor: 'pointer', fontWeight: 850 }}>Informações técnicas seguras</summary><pre style={{ marginTop: '.7rem', overflow: 'auto', borderRadius: '.8rem', background: 'var(--pj-purple-soft)', padding: '1rem', color: 'var(--pj-ink)', fontSize: '.72rem' }}>{JSON.stringify({ api: API_ORIGIN || window.location.origin, health: result.data, browserOnline: window.navigator.onLine }, null, 2)}</pre></details></section>
    </div></main>
}

function StatusCard({ label, ok, value, detail }) {
  return <article className="pj-panel" style={{ padding: '1.25rem' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: '.5rem' }}><span className="pj-eyebrow">{label}</span><i aria-hidden="true" style={{ width: '.65rem', height: '.65rem', borderRadius: '50%', background: ok ? 'var(--pj-success)' : 'var(--pj-danger)', boxShadow: `0 0 0 .25rem color-mix(in srgb, ${ok ? 'var(--pj-success)' : 'var(--pj-danger)'} 12%, transparent)` }} /></div><strong style={{ display: 'block', marginTop: '.7rem', fontSize: '1.15rem' }}>{value}</strong><small style={{ display: 'block', marginTop: '.25rem', color: 'var(--pj-muted)' }}>{detail}</small></article>
}
