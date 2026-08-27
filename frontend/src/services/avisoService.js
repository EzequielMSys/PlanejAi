import { createApiClient } from './apiClient'
const api = createApiClient('/api/avisos')

export default {
  listar: async () => (await api.get('/')).data,
  criar: async (aviso) => (await api.post('/', aviso)).data.aviso,
  deletar: async (id) => (await api.delete(`/${id}`)).data
}
