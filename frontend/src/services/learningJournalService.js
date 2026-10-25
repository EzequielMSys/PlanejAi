import { createApiClient } from './apiClient'
const api = createApiClient('/api/aprendizagem/diario')
export default {
  list: (params, signal) => api.get('/', {params, signal, cache:false}).then(r=>r.data),
  detail: (id, antes, signal) => api.get(`/${id}`, {params:{antes},signal,cache:false}).then(r=>r.data),
  save: (id, data) => api.post(id ? `/${id}/passos` : '/',data).then(r=>r.data),
  remove: id=>api.delete(`/${id}`).then(r=>r.data),
  assist: (id, passos)=>api.post(`/${id}/lumi`,{passos},{timeout:55000}).then(r=>r.data),
}
