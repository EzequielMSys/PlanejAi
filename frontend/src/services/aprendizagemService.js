import axios from 'axios'
import { apiUrl } from '../config/api'

const api = axios.create({ baseURL: apiUrl('/api/aprendizagem') })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  resumo: () => api.get('/resumo').then((r) => r.data),
  simulado: (opcoes = {}) => api.get('/simulado', { params: opcoes }).then((r) => r.data),
  responder: (id, resposta, duracaoSegundos, embaralhamento) => api.post(`/questoes/${id}/responder`, { resposta, duracaoSegundos, embaralhamento }).then((r) => r.data),
  erros: () => api.get('/erros').then((r) => r.data),
  atualizarErro: (id, dados) => api.patch(`/erros/${id}`, dados).then((r) => r.data),
  revisoes: () => api.get('/revisoes').then((r) => r.data),
  adicionarRevisao: (idConteudo) => api.post(`/revisoes/${idConteudo}`).then((r) => r.data),
  avaliarRevisao: (idConteudo, resultado) => api.post(`/revisoes/${idConteudo}/avaliar`, { resultado }).then((r) => r.data),
  versoesRedacao: (id) => api.get(`/redacoes/${id}/versoes`).then((r) => r.data),
  criarVersaoRedacao: (id, dados) => api.post(`/redacoes/${id}/versoes`, dados).then((r) => r.data)
}

