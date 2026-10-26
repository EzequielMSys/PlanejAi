import { createApiClient } from './apiClient'
import { currentUser } from '../utils/offlineStore'
const api = createApiClient('/api/aprendizagem/percursos')
export default {
  list: (kind, signal) => api.get('/', { params: { tipo: kind }, signal, cache: false }).then(r => r.data),
  detail: (id, signal) => api.get(`/${id}`, { signal, cache: false }).then(r => r.data),
  today: signal => api.get('/hoje', { signal, cache: false }).then(r => r.data),
  finalReview: (id, signal) => api.get(`/${id}/revisao-final`, { signal, cache: false }).then(r => r.data),
  create: (kind, body) => api.post(`/${kind}`, body, { expectedOwner: currentUser() }).then(r => r.data),
  change: (id, body) => api.patch(`/${id}`, body, { expectedOwner: currentUser() }).then(r => r.data),
  assist: (id, attempts, fields) => api.post(`/${id}/lumi`, { attempts,fields }, { expectedOwner: currentUser(),timeout:55000 }).then(r => r.data),
  catalog: signal=>api.get('/laboratorio/catalogo',{signal,cache:false}).then(r=>r.data),
  recoveryPreview:(id,body)=>api.post(`/${id}/recuperacao/previa`,body,{expectedOwner:currentUser()}).then(r=>r.data),
  saveAs:(id,body)=>api.post(`/${id}/guardar`,body,{expectedOwner:currentUser()}).then(r=>r.data),
}
