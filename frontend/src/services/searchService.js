import { createApiClient } from './apiClient'
const api = createApiClient('/api/busca')
export default {
  search: (params, signal) => api.get('/', {params, signal, cache:false}).then(response => response.data),
  content: (id, signal, notes = false) => api.get(`/conteudos/${id}`, {params:notes?{anotacao:'1'}:undefined, signal, cache:false}).then(response => response.data),
}
