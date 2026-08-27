import { createApiClient } from './apiClient'
const api = createApiClient('/api/conteudos')
export default { listar: async () => (await api.get('/')).data, atualizar: async (id, dados) => (await api.put(`/${id}`, dados)).data.conteudo }
