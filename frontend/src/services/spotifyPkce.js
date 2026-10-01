/* global sessionStorage, TextEncoder, URLSearchParams */
const SESSION_KEY = 'planejai:spotify:session'
const VERIFIER_KEY = 'planejai:spotify:verifier'
const STATE_KEY = 'planejai:spotify:oauth-state'
const RETURN_KEY = 'planejai:spotify:return-hash'

function base64Url(bytes) {
  return window.btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function aleatorio(tamanho = 64) {
  return base64Url(window.crypto.getRandomValues(new Uint8Array(tamanho))).slice(0, tamanho)
}

export function spotifyRedirectUri() {
  return new window.URL(import.meta.env.BASE_URL, window.location.origin).href
}

export function obterSessaoSpotify() {
  try {
    const sessao = JSON.parse(sessionStorage.getItem(SESSION_KEY))
    return sessao?.access_token && sessao.expires_at > Date.now() ? sessao : null
  } catch { return null }
}

export async function iniciarLoginSpotify(clientId) {
  if (!clientId) throw new Error('Spotify Client ID não configurado.')
  if (window.location.hostname === 'localhost') {
    throw new Error('Abra o projeto por 127.0.0.1: o Spotify não aceita localhost como redirecionamento.')
  }
  const verifier = aleatorio(72)
  const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  const state = aleatorio(32)
  sessionStorage.setItem(VERIFIER_KEY, verifier)
  sessionStorage.setItem(STATE_KEY, state)
  sessionStorage.setItem(RETURN_KEY, window.location.hash || '#/inicio')
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: spotifyRedirectUri(),
    code_challenge_method: 'S256',
    code_challenge: base64Url(digest),
    state,
    scope: 'user-read-private user-read-email user-read-playback-state user-modify-playback-state streaming'
  })
  window.location.assign(`https://accounts.spotify.com/authorize?${params}`)
}

export async function concluirLoginSpotify(clientId) {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('code')
  const recebido = params.get('state')
  if (!code) return obterSessaoSpotify()
  const verifier = sessionStorage.getItem(VERIFIER_KEY)
  const esperado = sessionStorage.getItem(STATE_KEY)
  if (!verifier || !esperado || recebido !== esperado) throw new Error('A validação de segurança do Spotify expirou. Tente conectar novamente.')
  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyRedirectUri(),
    code_verifier: verifier
  })
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  if (!response.ok) throw new Error('O Spotify recusou a vinculação. Confira Client ID e Redirect URI.')
  const token = await response.json()
  const sessao = { ...token, expires_at: Date.now() + ((token.expires_in || 3600) * 1000) - 30000 }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessao))
  sessionStorage.removeItem(VERIFIER_KEY)
  sessionStorage.removeItem(STATE_KEY)
  const retorno = sessionStorage.getItem(RETURN_KEY) || '#/inicio'
  sessionStorage.removeItem(RETURN_KEY)
  window.history.replaceState({}, '', `${window.location.pathname}${retorno}`)
  return sessao
}

export async function obterPerfilSpotify(sessao = obterSessaoSpotify()) {
  if (!sessao) return null
  const response = await fetch('https://api.spotify.com/v1/me', { headers: { Authorization: `Bearer ${sessao.access_token}` } })
  if (!response.ok) return null
  return response.json()
}

export function desconectarSpotify() {
  sessionStorage.removeItem(SESSION_KEY)
}
