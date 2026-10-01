import { useEffect, useMemo, useRef, useState } from 'react'
import { concluirLoginSpotify, desconectarSpotify, iniciarLoginSpotify, obterPerfilSpotify, obterSessaoSpotify, spotifyRedirectUri } from '../services/spotifyPkce'
import './StudyAudioDock.css'
import './StudyAudioDockV2.css'

const STORAGE_KEY = 'planejai:study-audio'
const VOLUME_KEY = 'planejai:ambient-volume'
const POSITION_KEY = 'planejai:study-audio-position'
const FREE_POSITION_KEY = 'planejai:study-audio-free-position'
const COMPACT_KEY = 'planejai:study-audio-compact'
const POSICOES = new Set(['bottom-left', 'bottom-right', 'top-left', 'top-right', 'free'])
const SUGESTOES = [
  { nome: 'Deep Focus', detalhe: 'Instrumental', url: 'https://open.spotify.com/playlist/37i9dQZF1DWZeKCadgRdKQ' },
  { nome: 'Peaceful Piano', detalhe: 'Piano leve', url: 'https://open.spotify.com/playlist/37i9dQZF1DX4sWSpwq3LiO' },
  { nome: 'Lo-Fi Beats', detalhe: 'Ritmo contínuo', url: 'https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn' }
]

let spotifyApiPromise
function carregarSpotifyApi() {
  if (spotifyApiPromise) return spotifyApiPromise
  spotifyApiPromise = new Promise((resolve) => {
    if (window.SpotifyIframeApi) return resolve(window.SpotifyIframeApi)
    const callbackAnterior = window.onSpotifyIframeApiReady
    window.onSpotifyIframeApiReady = (api) => {
      window.SpotifyIframeApi = api
      if (typeof callbackAnterior === 'function') callbackAnterior(api)
      resolve(api)
    }
    if (!document.querySelector('script[data-planejai-spotify]')) {
      const script = document.createElement('script')
      script.src = 'https://open.spotify.com/embed/iframe-api/v1'
      script.async = true
      script.dataset.planejaiSpotify = 'true'
      document.body.appendChild(script)
    }
  })
  return spotifyApiPromise
}

function validarSpotify(valor) {
  try {
    const texto = String(valor || '').trim()
    const uri = texto.match(/spotify:(playlist|album|track|episode|show|artist):[A-Za-z0-9]+/i)?.[0]
    if (uri) return uri
    const link = texto.match(/https?:\/\/[^\s]+/i)?.[0] || texto
    const parsed = new window.URL(link)
    if (['spotify.link', 'www.spotify.link'].includes(parsed.hostname)) return parsed.href
    if (!['open.spotify.com', 'www.open.spotify.com'].includes(parsed.hostname)) return ''
    const partes = parsed.pathname.split('/').filter(Boolean)
    let offset = partes[0]?.startsWith('intl-') ? 1 : 0
    if (partes[offset] === 'embed') offset += 1
    const tipo = partes[offset]
    const id = partes[offset + 1]
    if (!['playlist', 'album', 'track', 'episode', 'show', 'artist'].includes(tipo) || !/^[A-Za-z0-9]+$/.test(id || '')) return ''
    return `https://open.spotify.com/${tipo}/${id}`
  } catch { return '' }
}

function formatarTempo(ms = 0) {
  const segundos = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, '0')}`
}

export default function StudyAudioDockV2() {
  const [aberto, setAberto] = useState(false)
  const [aba, setAba] = useState('spotify')
  const [url, setUrl] = useState(() => localStorage.getItem(STORAGE_KEY) || SUGESTOES[0].url)
  const [entrada, setEntrada] = useState('')
  const [adicionandoLink, setAdicionandoLink] = useState(false)
  const [erro, setErro] = useState('')
  const [playerPronto, setPlayerPronto] = useState(false)
  const [tocando, setTocando] = useState(false)
  const [progresso, setProgresso] = useState({ posicao: 0, duracao: 0 })
  const [ampliado, setAmpliado] = useState(false)
  const [metadata, setMetadata] = useState(null)
  const [ambiente, setAmbiente] = useState('desligado')
  const [contaSpotify, setContaSpotify] = useState(null)
  const [conectandoConta, setConectandoConta] = useState(false)
  const spotifyClientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID?.trim()
  const [volume, setVolume] = useState(() => Number(localStorage.getItem(VOLUME_KEY) || 32))
  const [posicao, setPosicao] = useState(() => {
    const salva = localStorage.getItem(POSITION_KEY)
    return POSICOES.has(salva) ? salva : 'bottom-left'
  })
  const [posicaoLivre, setPosicaoLivre] = useState(() => {
    try { return JSON.parse(localStorage.getItem(FREE_POSITION_KEY)) || { x: 280, y: 90 } } catch { return { x: 280, y: 90 } }
  })
  const [compacto, setCompacto] = useState(() => localStorage.getItem(COMPACT_KEY) === 'true')
  const [arrastando, setArrastando] = useState(false)
  const [mudo, setMudo] = useState(false)
  const [timer, setTimer] = useState(0)
  const dockRef = useRef(null)
  const arrasteRef = useRef(null)
  const hostRef = useRef(null)
  const controllerRef = useRef(null)
  const audioRef = useRef(null)
  const urlRef = useRef(url)
  urlRef.current = url
  const urlValida = useMemo(() => validarSpotify(url), [url])

  useEffect(() => {
    if (!aberto) return undefined
    let ativo = true
    carregarSpotifyApi().then((api) => {
      if (!ativo || !hostRef.current || controllerRef.current) return
      api.createController(hostRef.current, { width: '100%', height: 152, url: validarSpotify(urlRef.current) }, (controller) => {
        controllerRef.current = controller
        controller.addListener('ready', () => setPlayerPronto(true))
        controller.addListener('playback_update', (event) => {
          setTocando(!event.data.isPaused)
          setProgresso({ posicao: event.data.position || 0, duracao: event.data.duration || 0 })
        })
      })
    })
    return () => {
      ativo = false
      if (controllerRef.current) {
        controllerRef.current.destroy()
        controllerRef.current = null
      }
      setPlayerPronto(false)
      setTocando(false)
    }
  }, [aberto])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, url)
    if (controllerRef.current && urlValida) controllerRef.current.loadEntity(urlValida)
  }, [url, urlValida])

  useEffect(() => {
    const iframe = hostRef.current?.querySelector('iframe')
    if (iframe) iframe.style.height = ampliado ? '352px' : '152px'
  }, [ampliado, playerPronto])

  useEffect(() => {
    localStorage.setItem(VOLUME_KEY, String(volume))
    if (audioRef.current?.gain) audioRef.current.gain.gain.value = mudo ? 0 : volume / 100
  }, [volume, mudo])

  useEffect(() => {
    localStorage.setItem(POSITION_KEY, posicao)
  }, [posicao])

  useEffect(() => {
    localStorage.setItem(FREE_POSITION_KEY, JSON.stringify(posicaoLivre))
  }, [posicaoLivre])

  useEffect(() => {
    localStorage.setItem(COMPACT_KEY, String(compacto))
  }, [compacto])

  useEffect(() => {
    const mover = (event) => {
      if (!arrasteRef.current || !dockRef.current) return
      const largura = dockRef.current.offsetWidth
      const altura = Math.min(dockRef.current.offsetHeight, window.innerHeight - 16)
      setPosicaoLivre({
        x: Math.max(8, Math.min(window.innerWidth - largura - 8, event.clientX - arrasteRef.current.offsetX)),
        y: Math.max(8, Math.min(window.innerHeight - altura - 8, event.clientY - arrasteRef.current.offsetY))
      })
    }
    const parar = () => {
      arrasteRef.current = null
      setArrastando(false)
    }
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', parar)
    return () => { window.removeEventListener('pointermove', mover); window.removeEventListener('pointerup', parar) }
  }, [])

  function iniciarArraste(event) {
    if (window.innerWidth <= 640) return
    const rect = dockRef.current?.getBoundingClientRect()
    if (!rect) return
    event.preventDefault()
    event.stopPropagation()
    setPosicao('free')
    setArrastando(true)
    arrasteRef.current = { offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top }
  }

  useEffect(() => {
    if (!spotifyClientId) return
    let ativo = true
    concluirLoginSpotify(spotifyClientId)
      .then((sessao) => sessao && obterPerfilSpotify(sessao))
      .then((perfil) => { if (ativo && perfil) setContaSpotify(perfil) })
      .catch((error) => { if (ativo) setErro(error.message) })
    const existente = obterSessaoSpotify()
    if (existente) obterPerfilSpotify(existente).then((perfil) => { if (ativo && perfil) setContaSpotify(perfil) })
    return () => { ativo = false }
  }, [spotifyClientId])

  useEffect(() => {
    if (!urlValida || urlValida.startsWith('spotify:') || urlValida.includes('spotify.link')) {
      setMetadata(null)
      return undefined
    }
    const metadataController = new window.AbortController()
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(urlValida)}`, { signal: metadataController.signal })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('metadata')))
      .then((data) => setMetadata({ title: data.title, thumbnail: data.thumbnail_url }))
      .catch((error) => {
        if (error.name !== 'AbortError') setMetadata(null)
      })
    return () => metadataController.abort()
  }, [urlValida])

  useEffect(() => {
    if (!timer) return undefined
    const timeout = window.setTimeout(() => {
      pararAmbiente()
      controllerRef.current?.pause()
      setTimer(0)
    }, timer * 60 * 1000)
    return () => window.clearTimeout(timeout)
  }, [timer])

  useEffect(() => () => {
    try { audioRef.current?.source?.stop() } catch { /* fonte já encerrada */ }
    if (audioRef.current?.context?.state !== 'closed') {
      audioRef.current?.context?.close()
    }
    controllerRef.current?.pause()
  }, [])

  async function usarLink(event) {
    event.preventDefault()
    setAdicionandoLink(true); setErro('')
    let normalizada = validarSpotify(entrada.trim())
    if (!normalizada) {
      setErro('Cole um link válido de música, álbum, playlist ou podcast.')
      setAdicionandoLink(false)
      return
    }
    try {
      if (normalizada.includes('spotify.link')) {
        const response = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(normalizada)}`)
        if (!response.ok) throw new Error('Não foi possível abrir o link encurtado.')
        const data = await response.json()
        const src = data.html?.match(/src=["']([^"']+)/i)?.[1]?.replace(/&amp;/g, '&')
        const canonical = src?.match(/https:\/\/open\.spotify\.com\/embed\/(playlist|album|track|episode|show|artist)\/([A-Za-z0-9]+)/i)
        if (canonical) normalizada = `https://open.spotify.com/${canonical[1]}/${canonical[2]}`
      }
      setUrl(normalizada); setEntrada(''); setErro('Conteúdo adicionado ao player.')
    } catch (error) {
      setErro(error.message)
    } finally {
      setAdicionandoLink(false)
    }
  }

  async function conectarContaSpotify() {
    setConectandoConta(true); setErro('')
    try { await iniciarLoginSpotify(spotifyClientId) }
    catch (error) { setErro(error.message); setConectandoConta(false) }
  }

  function sairDaContaSpotify() {
    desconectarSpotify(); setContaSpotify(null)
  }

  async function copiarRedirect() {
    try {
      await window.navigator.clipboard.writeText(spotifyRedirectUri())
      setErro('Redirect URI copiada. Cadastre-a exatamente assim no painel do Spotify.')
    } catch {
      setErro(`Redirect URI: ${spotifyRedirectUri()}`)
    }
  }

  function criarAmbiente(tipo) {
    pararAmbiente()
    const AudioContext = window.AudioContext || window.webkitAudioContext
    if (!AudioContext) return setErro('Seu navegador não oferece áudio ambiente.')
    const context = new AudioContext()
    const tamanho = context.sampleRate * 3
    const buffer = context.createBuffer(1, tamanho, context.sampleRate)
    const dados = buffer.getChannelData(0)
    let anterior = 0
    for (let i = 0; i < tamanho; i += 1) {
      const branco = Math.random() * 2 - 1
      anterior = tipo === 'marrom' ? (anterior + (0.02 * branco)) / 1.02 : branco
      dados[i] = Math.max(-1, Math.min(1, anterior * (tipo === 'marrom' ? 3.5 : .55)))
    }
    const source = context.createBufferSource()
    const filter = context.createBiquadFilter()
    const gain = context.createGain()
    source.buffer = buffer; source.loop = true
    filter.type = tipo === 'chuva' ? 'bandpass' : 'lowpass'
    filter.frequency.value = tipo === 'chuva' ? 1800 : 480
    filter.Q.value = tipo === 'chuva' ? .45 : .7
    gain.gain.value = mudo ? 0 : volume / 100
    source.connect(filter); filter.connect(gain); gain.connect(context.destination); source.start()
    audioRef.current = { context, source, gain }
    setAmbiente(tipo)
  }

  function pararAmbiente() {
    try { audioRef.current?.source?.stop() } catch { /* já encerrado */ }
    audioRef.current?.context?.close()
    audioRef.current = null
    setAmbiente('desligado')
  }

  function alternarSpotify() {
    if (!controllerRef.current) return
    if (tocando) controllerRef.current.pause()
    else controllerRef.current.resume()
  }

  return (
    <aside ref={dockRef} style={posicao === 'free' ? { left: posicaoLivre.x, top: posicaoLivre.y, right: 'auto', bottom: 'auto' } : undefined} className={`study-audio study-audio-v2 dock-${posicao} ${compacto ? 'is-compact' : ''} ${aberto ? 'is-open' : ''} ${arrastando ? 'is-dragging' : ''}`} aria-label="Central de áudio para estudar">
      <div className="study-audio-launcher">
        <button className="study-audio-drag-handle study-audio-drag-handle--collapsed" type="button" onPointerDown={iniciarArraste} aria-label="Mover central de áudio" title="Segure e arraste para mover">⠿</button>
        <button className="study-audio-trigger" type="button" onClick={() => setAberto((v) => !v)} aria-expanded={aberto}>
          <span className="study-audio-bars" aria-hidden="true"><i /><i /><i /></span>
          <span><b>Central de áudio</b><small>{ambiente !== 'desligado' ? `Ambiente: ${ambiente}` : 'Spotify + sons de foco'}</small></span>
          <span className="study-audio-chevron" aria-hidden="true">⌃</span>
        </button>
      </div>

      {aberto && <div className="study-audio-panel">
        <div className="study-audio-heading">
          <button className="study-audio-drag-handle" type="button" onPointerDown={iniciarArraste} aria-label="Mover central de áudio" title="Segure e arraste para mover">⠿</button>
          <div className="study-audio-heading-copy"><span>PLANEJAI / STUDY RADIO</span><h2>Controle o clima do estudo.</h2></div>
          <div className="study-audio-layout-tools">
            <label htmlFor="audio-position">Posição</label>
            <select id="audio-position" value={posicao} onChange={(event) => setPosicao(event.target.value)} aria-label="Posição do player">
              <option value="bottom-left">Inferior esquerda</option>
              <option value="bottom-right">Inferior direita</option>
              <option value="top-left">Superior esquerda</option>
              <option value="top-right">Superior direita</option>
              <option value="free">Livre — arraste</option>
            </select>
            <button type="button" onClick={() => { setCompacto((valor) => !valor); setAba('spotify') }} aria-label={compacto ? 'Expandir player' : 'Compactar player'}>{compacto ? 'Expandir' : 'Compactar'}</button>
            <button type="button" onClick={() => setAberto(false)} aria-label="Minimizar">—</button>
          </div>
        </div>
        <div className="audio-tabs" role="tablist"><button className={aba === 'spotify' ? 'is-active' : ''} type="button" onClick={() => setAba('spotify')}>Spotify</button><button className={aba === 'ambiente' ? 'is-active' : ''} type="button" onClick={() => setAba('ambiente')}>Ambiente local</button></div>

        <div className={aba === 'spotify' ? 'audio-pane' : 'audio-pane audio-pane-hidden'}>
          <div className={`spotify-account-card ${contaSpotify ? 'is-connected' : ''}`}>
            <div className="spotify-account-mark">S</div>
            <div><span>{contaSpotify ? 'CONTA VINCULADA' : 'SPOTIFY CONNECT'}</span><strong>{contaSpotify?.display_name || (spotifyClientId ? 'Controle Premium opcional' : 'Configuração necessária')}</strong><small>{contaSpotify ? contaSpotify.email || 'Sessão protegida nesta aba' : spotifyClientId ? 'Entre com sua conta para preparar os controles avançados.' : 'Adicione VITE_SPOTIFY_CLIENT_ID para habilitar o login.'}</small></div>
            {contaSpotify
              ? <button type="button" onClick={sairDaContaSpotify}>Desconectar</button>
              : spotifyClientId
                ? <button type="button" onClick={conectarContaSpotify} disabled={conectandoConta}>{conectandoConta ? 'Abrindo...' : 'Vincular conta'}</button>
                : <button type="button" onClick={copiarRedirect}>Copiar Redirect URI</button>}
          </div>
          {!spotifyClientId && <details className="spotify-setup-help"><summary>Como habilitar a vinculação?</summary><ol><li>Crie um app no Spotify for Developers.</li><li>Cadastre esta Redirect URI: <code>{spotifyRedirectUri()}</code></li><li>Coloque o Client ID em <code>VITE_SPOTIFY_CLIENT_ID</code>.</li><li>Reinicie o frontend.</li></ol><a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer">Abrir painel do Spotify ↗</a></details>}
          <div className="spotify-now-card">
            {metadata?.thumbnail ? <img src={metadata.thumbnail} alt="Capa do conteúdo selecionado" /> : <div className="spotify-cover-fallback"><i /><i /><i /></div>}
            <div><span>{playerPronto ? 'PRONTO PARA TOCAR' : 'CONECTANDO AO SPOTIFY'}</span><strong>{metadata?.title || 'Seu conteúdo de foco'}</strong><small>{playerPronto ? 'Player oficial carregado' : 'Aguarde alguns instantes'}</small></div>
            <b aria-label={playerPronto ? 'Spotify conectado' : 'Spotify carregando'}>{playerPronto ? '●' : '○'}</b>
          </div>
          <div ref={hostRef} className={`spotify-controller ${ampliado ? 'is-expanded' : ''}`} />
          <div className="spotify-custom-controls">
            <button type="button" onClick={() => controllerRef.current?.restart()} disabled={!playerPronto} aria-label="Reiniciar">↺</button>
            <button className="spotify-main-control" type="button" onClick={alternarSpotify} disabled={!playerPronto}>{tocando ? 'Pausar' : 'Reproduzir'}</button>
            <button type="button" onClick={() => setAmpliado((v) => !v)}>{ampliado ? 'Compactar' : 'Player completo'}</button>
          </div>
          <div className="spotify-progress"><i><i style={{ width: `${progresso.duracao ? (progresso.posicao / progresso.duracao) * 100 : 0}%` }} /></i><span>{formatarTempo(progresso.posicao)} / {formatarTempo(progresso.duracao)}</span></div>
          <p className="spotify-volume-note">O Spotify não libera volume no Embed. Abra o player completo para os controles oficiais ou use o ambiente local, que possui volume próprio.</p>
          <div className="study-audio-presets">{SUGESTOES.map((item) => <button className={url === item.url ? 'is-active' : ''} type="button" key={item.url} onClick={() => setUrl(item.url)}><b>{item.nome}</b><small>{item.detalhe}</small></button>)}</div>
          <form onSubmit={usarLink} className="study-audio-connect"><label htmlFor="spotify-url-v2">Trazer meu conteúdo</label><div><input id="spotify-url-v2" value={entrada} onChange={(e) => setEntrada(e.target.value)} placeholder="Cole link, URI ou texto compartilhado" /><button type="submit" disabled={adicionandoLink}>{adicionandoLink ? 'Abrindo...' : 'Usar'}</button></div>{erro && <p role="status">{erro}</p>}</form>
        </div>
        <section className={aba === 'ambiente' ? 'ambient-panel' : 'ambient-panel audio-pane-hidden'}>
          <div className="ambient-orbit" data-active={ambiente !== 'desligado'}><i /><i /><span>{ambiente === 'desligado' ? 'silêncio' : ambiente}</span></div>
          <h3>Sons contínuos, gerados no navegador.</h3>
          <p>Funcionam sem conta, sem anúncio e sem transmitir áudio para outro serviço.</p>
          <div className="ambient-choices"><button className={ambiente === 'chuva' ? 'is-active' : ''} type="button" onClick={() => criarAmbiente('chuva')}><b>Chuva suave</b><small>Textura leve para leitura</small></button><button className={ambiente === 'marrom' ? 'is-active' : ''} type="button" onClick={() => criarAmbiente('marrom')}><b>Ruído marrom</b><small>Graves para concentração</small></button></div>
          <div className="ambient-volume"><button type="button" onClick={() => setMudo((v) => !v)}>{mudo ? 'Ativar som' : 'Silenciar'}</button><label htmlFor="ambient-volume">Volume <b>{mudo ? 0 : volume}%</b></label><input id="ambient-volume" type="range" min="0" max="70" value={volume} onChange={(e) => { setVolume(Number(e.target.value)); setMudo(false) }} /></div>
          <div className="ambient-footer"><button type="button" onClick={pararAmbiente} disabled={ambiente === 'desligado'}>Parar ambiente</button><label>Desligar em <select value={timer} onChange={(e) => setTimer(Number(e.target.value))}><option value="0">Sem timer</option><option value="15">15 min</option><option value="30">30 min</option><option value="60">60 min</option></select></label></div>
        </section>
      </div>}
    </aside>
  )
}
