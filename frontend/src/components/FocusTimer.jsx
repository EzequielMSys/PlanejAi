import { useEffect, useState } from 'react'
import { toast } from 'react-hot-toast'

const DEFAULT_SECONDS = 25 * 60

function formatTime(total) {
  const minutes = Math.floor(total / 60).toString().padStart(2, '0')
  const seconds = (total % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}

export default function FocusTimer() {
  const [open, setOpen] = useState(false)
  const [remaining, setRemaining] = useState(DEFAULT_SECONDS)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    const savedEnd = Number(window.localStorage.getItem('focus-end'))
    if (savedEnd > Date.now()) {
      setRemaining(Math.ceil((savedEnd - Date.now()) / 1000))
      setRunning(true)
    }
  }, [])

  useEffect(() => {
    if (!running) return undefined
    const interval = window.setInterval(() => {
      const end = Number(window.localStorage.getItem('focus-end'))
      const next = Math.max(0, Math.ceil((end - Date.now()) / 1000))
      setRemaining(next)
      if (next === 0) {
        window.clearInterval(interval)
        window.localStorage.removeItem('focus-end')
        setRunning(false)
        toast.success('Ciclo concluído. Hora de respirar um pouco!')
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [running])

  const pause = () => {
    window.localStorage.removeItem('focus-end')
    setRunning(false)
  }

  const chooseDuration = (minutes) => {
    pause()
    setRemaining(minutes * 60)
  }

  const toggleTimer = () => {
    if (running) {
      pause()
      return
    }
    window.localStorage.setItem('focus-end', String(Date.now() + remaining * 1000))
    setRunning(true)
  }

  return (
    <div className="focus-tool">
      {open && (
        <section className="focus-panel" aria-label="Temporizador de foco">
          <div className="focus-panel-top">
            <span>Modo foco</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar">×</button>
          </div>
          <strong>{formatTime(remaining)}</strong>
          <p>{running ? 'Uma coisa de cada vez.' : 'Escolha um ciclo e comece quando quiser.'}</p>
          <div className="focus-presets">
            <button type="button" onClick={() => chooseDuration(25)}>25 min</button>
            <button type="button" onClick={() => chooseDuration(50)}>50 min</button>
            <button type="button" onClick={() => chooseDuration(5)}>Pausa</button>
          </div>
          <button type="button" className="focus-action" onClick={toggleTimer}>
            {running ? 'Pausar ciclo' : 'Começar foco'}
          </button>
        </section>
      )}
      <button
        type="button"
        className={`focus-trigger ${running ? 'is-running' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Abrir temporizador de foco"
      >
        <span>{running ? formatTime(remaining) : 'Foco'}</span>
        <i aria-hidden="true" />
      </button>
    </div>
  )
}
