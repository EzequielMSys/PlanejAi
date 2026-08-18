import axios from 'axios'
axios.defaults.timeout = 15000
axios.defaults.headers.common.Accept = 'application/json'

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim() || ''

// VITE_API_URL representa apenas a origem do backend. Aceitamos um `/api`
// legado no final para não gerar acidentalmente URLs como `/api/api/auth`.
export const API_ORIGIN = configuredApiUrl
  .replace(/\/$/, '')
  .replace(/\/api$/i, '')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_ORIGIN}${normalizedPath}`
}

export function resolveBackendAsset(path) {
  if (!path || /^(?:https?:)?\/\//i.test(path) || path.startsWith('data:')) {
    return path || ''
  }

  return apiUrl(path)
}
