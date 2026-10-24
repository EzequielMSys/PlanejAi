import { createApiClient } from './apiClient'
const api = createApiClient('/api/aprendizagem/estudo-em-andamento')
export default {
  current: () => api.get('/').then(result => { if (result.offline) throw new Error('Não foi possível confirmar a retomada na conta.'); return result.data }),
  save: id => api.put('/', { idItem: id }).then(result => result.data),
  clear: id => api.delete('/', { data: { idItem: id } }).then(result => result.data),
}
