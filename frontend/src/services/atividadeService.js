import axios from 'axios'

const api = axios.create({ baseURL: '/api/atividade' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  listar: async () => (await api.get('/')).data,
  criar: async (atividade) => (await api.post('/', atividade)).data.atividade,
  atualizar: async (id, atividade) => (await api.put(`/${id}`, atividade)).data.atividade,
  obter: async (id) => (await api.get(`/${id}`)).data,
  responder: async (id, respostas) => (await api.post(`/${id}/respostas`, { respostas })).data,
  entregas: async (id) => (await api.get(`/${id}/entregas`)).data,
  corrigir: async (id, dados) => (await api.patch(`/respostas/${id}/corrigir`, dados)).data.resposta
}
