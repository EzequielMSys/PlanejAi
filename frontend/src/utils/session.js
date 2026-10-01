export function isTokenExpired(token, clockSkewSeconds = 30) {
  if (!token || typeof token !== 'string') return true
  try {
    const payload = JSON.parse(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return !payload.exp || payload.exp <= Math.floor(Date.now() / 1000) + clockSkewSeconds
  } catch {
    return true
  }
}

export function clearStoredSession() {
  for (const key of ['token', 'user', 'primeiro_acesso', 'perfil_completo']) {
    window.localStorage.removeItem(key)
  }
}
