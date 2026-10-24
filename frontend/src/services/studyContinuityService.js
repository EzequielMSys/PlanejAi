import { createApiClient } from './apiClient'
const api = createApiClient('/api/aprendizagem/estudo-em-andamento')
export default {
  current: () => api.get('/').then(result => result.offline ? null : result.data),
  save: id => api.put('/', { idItem: id }).then(result => result.data),
  clear: id => api.delete('/', { data: { idItem: id } }).then(result => result.data),
}
