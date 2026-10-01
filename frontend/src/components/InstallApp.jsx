import { useEffect, useState } from 'react'
import './InstallApp.css'

export default function InstallApp() {
  const [prompt, setPrompt] = useState(null)

  useEffect(() => {
    const capture = (event) => {
      event.preventDefault()
      setPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', capture)
    return () => window.removeEventListener('beforeinstallprompt', capture)
  }, [])

  if (!prompt) return null

  const install = async () => {
    await prompt.prompt()
    await prompt.userChoice
    setPrompt(null)
  }

  return <button type="button" className="install-app" onClick={install}>Instalar PlanejAI <span>＋</span></button>
}
