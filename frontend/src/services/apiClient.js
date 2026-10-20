import axios from 'axios'
import { apiUrl } from '../config/api'
import { cacheGet, cachePut, enqueue, scopedCacheKey } from '../utils/offlineStore'
import { deduplicateReads } from '../utils/requestDeduplication'

export function createApiClient(basePath) {
  const api = axios.create({ baseURL: apiUrl(basePath), timeout: 15000 })
  api.defaults.adapter = deduplicateReads(axios.getAdapter(api.defaults.adapter))
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    config.offlineCacheKey = scopedCacheKey(api.getUri(config))
    return config
  })
  api.interceptors.response.use(
    (response) => { if(response.config.method==='get' && response.config.offlineCacheKey === scopedCacheKey(api.getUri(response.config)))cachePut(response.config.offlineCacheKey,response.data).catch(()=>{});return response },
    async (error) => {
      const config=error.config||{}
      if(!error.response&&config.method==='get'&&!axios.isCancel(error)&&config.offlineCacheKey===scopedCacheKey(api.getUri(config))){const cached=await cacheGet(config.offlineCacheKey).catch(()=>null);if(cached)return{data:cached.data,status:200,config,offline:true}}
      if(!error.response&&config.offlineQueue&&['post','put','patch'].includes(config.method)){let data=config.data;try{if(typeof data==='string')data=JSON.parse(data)}catch{/* mantém */}const id=await enqueue({baseURL:config.baseURL,url:config.url,method:config.method.toUpperCase(),data});return{data:{offline:true,queued:true,queueId:id,message:'Salvo neste aparelho. Será sincronizado quando a conexão voltar.'},status:202,config}}
      if (error.response?.status === 401 && localStorage.getItem('token')) {
        for (const key of ['token', 'user', 'primeiro_acesso', 'perfil_completo']) localStorage.removeItem(key)
        window.dispatchEvent(new window.CustomEvent('planejai:session-expired'))
      }
      return Promise.reject(error)
    }
  )
  return api
}
