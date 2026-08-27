import { createApiClient } from './apiClient'
const api = createApiClient('/api/atividade')

export default {
  listar: async () => (await api.get('/')).data,
  listarAlunos: async () => (await api.get('/alunos')).data,
  criar: async (atividade) => (await api.post('/', atividade)).data.atividade,
  atualizar: async (id, atividade) => (await api.put(`/${id}`, atividade)).data.atividade,
  obter: async (id) => (await api.get(`/${id}`)).data,
  responder: async (id, respostas) => (await api.post(`/${id}/respostas`, { respostas })).data,
  entregas: async (id) => (await api.get(`/${id}/entregas`)).data,
  corrigir: async (id, dados) => (await api.patch(`/respostas/${id}/corrigir`, dados)).data.resposta,
  uploadImagem: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data
  }
}
