import { createApiClient } from './apiClient'
const api = createApiClient('/api/dashboard')

export default {
  estatisticas: async () => (await api.get('/estatisticas')).data,
  entregasPendentes: async () => (await api.get('/entregas-pendentes')).data,
  desempenho: async () => (await api.get('/desempenho')).data,
  aprendizagem: async () => (await api.get('/aprendizagem')).data
}
