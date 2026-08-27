import { createApiClient } from './apiClient'
const api = createApiClient('/api/inteligencia')
export default {
  diagnostico: (disciplinas) => api.get('/diagnostico', { params: { disciplinas: disciplinas.join(',') } }).then((r) => r.data),
  salvarDiagnostico: (respostas) => api.post('/diagnostico', { respostas }).then((r) => r.data),
  metas: () => api.get('/metas').then((r) => r.data), salvarMeta: (dados) => api.put('/metas', dados).then((r) => r.data),
  privacidade: () => api.get('/privacidade').then((r) => r.data), salvarPrivacidade: (visibilidade) => api.put('/privacidade', { visibilidade }).then((r) => r.data)
  ,flashcards: () => api.get('/flashcards').then((r) => r.data), criarFlashcard: (dados) => api.post('/flashcards', dados).then((r) => r.data), avaliarFlashcard: (id, resultado) => api.post(`/flashcards/${id}/avaliar`, { resultado }).then((r) => r.data), buscar: (q) => api.get('/busca', { params: { q } }).then((r) => r.data)
  ,provas: () => api.get('/provas').then((r) => r.data), criarProva: (dados) => api.post('/provas', dados).then((r) => r.data)
  ,trilhas: () => api.get('/trilhas').then((r) => r.data)
}
