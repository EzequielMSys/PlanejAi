import { createApiClient } from './apiClient'
const api = createApiClient('/api/adaptativo')
export default {
  competencias: () => api.get('/competencias').then((r) => r.data),
  proximaAcao: () => api.get('/proxima-acao').then((r) => r.data),
  iniciarSessao: (dados) => api.post('/sessoes', dados).then((r) => r.data),
  concluirSessao: (id, dados) => api.patch(`/sessoes/${id}/concluir`, dados).then((r) => r.data),
  checkin: (dados) => api.post('/checkins', dados).then((r) => r.data),
  rotinas: () => api.get('/rotinas').then((r) => r.data),
  salvarRotina: (dados) => api.put('/rotinas', dados).then((r) => r.data),
  missoes: () => api.get('/missoes').then((r) => r.data),
  sequencia: () => api.get('/sequencia').then((r) => r.data),
  pistas: (id) => api.get(`/questoes/${id}/pistas`).then((r) => r.data),
  simulado: (params) => api.get('/simulado', { params }).then((r) => r.data)
}
