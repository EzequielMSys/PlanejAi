import { createApiClient } from './apiClient'
const api = createApiClient('/api/atividade')

export default {
  listar: async () => (await api.get('/')).data,
  listarAlunos: async () => (await api.get('/alunos')).data,
  criar: async (atividade) => (await api.post('/', atividade)).data.atividade,
  atualizar: async (id, atividade) => (await api.put(`/${id}`, atividade)).data.atividade,
  autosalvar: async (id, atividade) => (await api.put(`/rascunhos/${id || 'novo'}`, atividade)).data,
  obter: async (id) => (await api.get(`/${id}`)).data,
  responder: async (id, respostas) => (await api.post(`/${id}/respostas`, { respostas })).data,
  salvarRespostas: async (id, respostas) => (await api.put(`/${id}/respostas/rascunho`, { respostas })).data,
  entregas: async (id) => (await api.get(`/${id}/entregas`)).data,
  versoes: async (id) => (await api.get(`/${id}/versoes`)).data,
  bancoQuestoes: async () => (await api.get('/banco-questoes')).data,
  salvarNoBanco: async (questao) => (await api.post('/banco-questoes', questao)).data,
  registrarUso: async (id) => (await api.post(`/banco-questoes/${id}/usar`)).data,
  removerDoBanco: async (id) => api.delete(`/banco-questoes/${id}`),
  corrigir: async (id, dados) => (await api.patch(`/respostas/${id}/corrigir`, dados)).data.resposta,
  uploadImagem: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    return response.data
  },
  uploadResposta: async (file) => {
    const form = new FormData()
    form.append('file', file)
    return (await api.post('/respostas/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data
  }
}
