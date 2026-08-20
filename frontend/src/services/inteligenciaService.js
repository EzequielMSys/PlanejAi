import axios from 'axios'
import { apiUrl } from '../config/api'
const api = axios.create({ baseURL: apiUrl('/api/inteligencia') })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
export default {
  diagnostico: (disciplinas) => api.get('/diagnostico', { params: { disciplinas: disciplinas.join(',') } }).then((r) => r.data),
  salvarDiagnostico: (respostas) => api.post('/diagnostico', { respostas }).then((r) => r.data),
  metas: () => api.get('/metas').then((r) => r.data), salvarMeta: (dados) => api.put('/metas', dados).then((r) => r.data),
  privacidade: () => api.get('/privacidade').then((r) => r.data), salvarPrivacidade: (visibilidade) => api.put('/privacidade', { visibilidade }).then((r) => r.data)
  ,flashcards: () => api.get('/flashcards').then((r) => r.data), criarFlashcard: (dados) => api.post('/flashcards', dados).then((r) => r.data), avaliarFlashcard: (id, resultado) => api.post(`/flashcards/${id}/avaliar`, { resultado }).then((r) => r.data), buscar: (q) => api.get('/busca', { params: { q } }).then((r) => r.data)
  ,provas: () => api.get('/provas').then((r) => r.data), criarProva: (dados) => api.post('/provas', dados).then((r) => r.data)
}
