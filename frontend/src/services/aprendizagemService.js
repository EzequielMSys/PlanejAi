import { createApiClient } from './apiClient'
const api = createApiClient('/api/aprendizagem')

export default {
  resumo: () => api.get('/resumo').then((r) => r.data),
  evolucao: () => api.get('/evolucao').then((r) => r.data),
  jornada: (minutos) => api.get('/jornada', { params: { minutos } }).then((r) => r.data),
  simulado: (opcoes = {}) => api.get('/simulado', { params: opcoes }).then((r) => r.data),
  responder: (id, resposta, duracaoSegundos, embaralhamento, confianca = 'DUVIDA', pistasUsadas = 0) => api.post(`/questoes/${id}/responder`, { resposta, duracaoSegundos, embaralhamento, confianca, pistasUsadas }, { offlineQueue: true }).then((r) => r.data),
  erros: () => api.get('/erros').then((r) => r.data),
  atualizarErro: (id, dados) => api.patch(`/erros/${id}`, dados).then((r) => r.data),
  revisoes: () => api.get('/revisoes').then((r) => r.data),
  adicionarRevisao: (idConteudo) => api.post(`/revisoes/${idConteudo}`).then((r) => r.data),
  avaliarRevisao: (idConteudo, resultado) => api.post(`/revisoes/${idConteudo}/avaliar`, { resultado }).then((r) => r.data),
  registrarSessao: (dados) => api.post('/sessoes', dados, { offlineQueue: true }).then((r) => r.data),
  metaSemanal: () => api.get('/meta-semanal').then((r) => r.data),
  atualizarMetaSemanal: (minutosMeta) => api.put('/meta-semanal', { minutosMeta }).then((r) => r.data),
  versoesRedacao: (id) => api.get(`/redacoes/${id}/versoes`).then((r) => r.data),
  criarVersaoRedacao: (id, dados) => api.post(`/redacoes/${id}/versoes`, dados).then((r) => r.data)
}
