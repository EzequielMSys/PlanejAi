import { useEffect, useMemo, useState } from 'react'
import './StudyAudioDock.css'

const STORAGE_KEY = 'planejai:study-audio'
const SUGESTOES = [
  { nome: 'Deep Focus', detalhe: 'Instrumental para concentração', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { nome: 'Peaceful Piano', detalhe: 'Piano leve para escrever', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  { nome: 'Lo-Fi Beats', detalhe: 'Ritmo contínuo, sem distração', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' }
]

function criarEmbed(valor) {
  try {
    const url = new window.URL(valor)
    if (!['open.spotify.com', 'www.open.spotify.com'].includes(url.hostname)) return ''
    const partes = url.pathname.split('/').filter(Boolean)
    const offset = partes[0]?.startsWith('intl-') ? 1 : 0
    const tipo = partes[offset]
    const id = partes[offset + 1]
    if (!['playlist', 'album', 'track', 'episode', 'show', 'artist'].includes(tipo) || !/^[A-Za-z0-9]+$/.test(id || '')) return ''
    return `https://open.spotify.com/embed/${tipo}/${id}?utm_source=generator&theme=0`
  } catch { return '' }
}

export default function StudyAudioDock() {
  const [aberto, setAberto] = useState(false)
  const [url, setUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || SUGESTOES[0].url)
  const [entrada, setEntrada] = useState('')
  const [erro, setErro] = useState('')
  const embed = useMemo(() => criarEmbed(url), [url])

  useEffect(() => { localStorage.setItem(STORAGE_KEY, url) }, [url])

  function conectar(event) {
    event.preventDefault()
    if (!criarEmbed(entrada.trim())) {
      setErro('Cole um link válido de música, álbum, playlist ou podcast do Spotify.')
      return
    }
    setUrl(entrada.trim()); setEntrada(''); setErro('')
  }

  return (
    <aside className={`study-audio ${aberto ? 'is-open' : ''}`} aria-label="Áudio para estudar">
      <button className="study-audio-trigger" type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
        <span className="study-audio-bars" aria-hidden="true"><i /><i /><i /></span>
        <span><b>Som de foco</b><small>Spotify no PlanejAI</small></span>
        <span className="study-audio-chevron" aria-hidden="true">⌃</span>
      </button>
      {aberto && <div className="study-audio-panel">
        <div className="study-audio-heading"><div><span>STUDY RADIO</span><h2>Seu ritmo, sem sair da página.</h2></div><button type="button" onClick={() => setAberto(false)} aria-label="Minimizar player">—</button></div>
        <iframe title="Player do Spotify" src={embed} width="100%" height="152" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" />
        <div className="study-audio-presets" aria-label="Seleções de foco">{SUGESTOES.map((item) => <button className={url === item.url ? 'is-active' : ''} type="button" key={item.url} onClick={() => setUrl(item.url)}><b>{item.nome}</b><small>{item.detalhe}</small></button>)}</div>
        <form onSubmit={conectar} className="study-audio-connect"><label htmlFor="spotify-url">Trazer meu conteúdo</label><div><input id="spotify-url" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Cole um link do Spotify" /><button type="submit">Usar</button></div>{erro ? <p role="alert">{erro}</p> : <small>O login e a reprodução são feitos pelo player oficial do Spotify.</small>}</form>
      </div>}
    </aside>
  )
}
