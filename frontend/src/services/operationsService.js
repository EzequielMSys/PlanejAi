import { createApiClient } from './apiClient'

const api = createApiClient('/api/operacoes')
export const loadOperationsMetrics = () => api.get('/metrics', { cache: false }).then((response) => response.data)
export const listSupport = (owner = false) => api.get(owner ? '/atendimento' : '/suporte', { cache: false }).then(response => {
  if (response.offline) throw new Error('Conecte-se para consultar os pedidos atualizados.')
  return response.data
})
export const sendSupport = data => api.post('/suporte', data).then(response => response.data)
export const replySupport = (id, data) => api.patch(`/atendimento/${id}`, data)
export const exportAccountData = () => createApiClient('/api/usuarios').get('/me/exportar', { cache: false }).then(response => response.data)
