import { createApiClient } from './apiClient'

const api = createApiClient('/api/operacoes')
export const loadOperationsMetrics = () => api.get('/metrics').then((response) => response.data)
