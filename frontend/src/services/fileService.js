import { createApiClient } from './apiClient'
import { apiUrl, resolveBackendAsset } from '../config/api'

const api = createApiClient('')

export function isProtectedUpload(value) {
  return /^\/uploads\/(?!perfis\/)/i.test(String(value || ''))
}

export async function resolveProtectedAsset(value) {
  if (!isProtectedUpload(value)) return resolveBackendAsset(value)
  const { data } = await api.get('/api/files/sign', { params: { path: value } })
  return apiUrl(data.url)
}
