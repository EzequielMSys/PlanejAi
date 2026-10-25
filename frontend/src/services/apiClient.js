import axios from 'axios'
import { apiUrl } from '../config/api'
import { cacheGet, cachePut, enqueue, scopedCacheKey, currentUser } from '../utils/offlineStore'

export function createApiClient(basePath) {
  const api = axios.create({ baseURL: apiUrl(basePath), timeout: 15000 })
  api.interceptors.request.use((config) => {
    if(config.expectedOwner && config.expectedOwner!==currentUser())throw new axios.CanceledError('A conta mudou. Reabra o estudo na conta correta antes de enviar.')
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    // getUri uses Axios' actual parameter serializer, including filters and pages.
    config.offlineOwner = currentUser()
    config.offlineCacheKey = scopedCacheKey(api.getUri(config))
    if (config.offlineQueue && !config.headers['Idempotency-Key']) {
      config.headers['Idempotency-Key'] = window.crypto.randomUUID?.() || Array.from(window.crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('')
    }
    return config
  })
  api.interceptors.response.use(
    (response) => {
      if (response.config.method === 'get' && response.config.cache !== false) cachePut(response.config.offlineCacheKey, response.data).catch(() => {})
      return response
    },
    async (error) => {
      const config = error.config || {}
      if (config.offlineOwner && config.offlineOwner !== currentUser()) return Promise.reject(error)
      if (axios.isCancel(error)) return Promise.reject(error)
      if (!error.response && config.method === 'get' && config.cache !== false && config.offlineCacheKey) {
        const cached = await cacheGet(config.offlineCacheKey).catch(() => null)
        if (cached) return { data: cached.data, status: 200, config, offline: true }
      }
      if (!error.response && config.offlineQueue && ['post', 'put', 'patch'].includes(config.method)) {
        let data = config.data
        try { if (typeof data === 'string') data = JSON.parse(data) } catch { /* Keep the original body. */ }
        const id = await enqueue({ baseURL: config.baseURL, url: config.url, method: config.method.toUpperCase(),
          data, idempotencyKey: config.headers['Idempotency-Key'] })
        return { data: { offline: true, queued: true, queueId: id, message: 'Salvo neste aparelho. Será sincronizado quando a conexão voltar.' }, status: 202, config }
      }
      // An old in-flight request must not clear a session that has just been renewed.
      const currentToken = localStorage.getItem('token')
      if (error.response?.status === 401 && currentToken && config.headers?.Authorization === `Bearer ${currentToken}`) {
        for (const key of ['token', 'user', 'primeiro_acesso', 'perfil_completo']) localStorage.removeItem(key)
        window.dispatchEvent(new window.CustomEvent('planejai:session-expired'))
      }
      return Promise.reject(error)
    }
  )
  return api
}
