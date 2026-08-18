import axios from 'axios'
import { apiUrl } from '../config/api'

const api = axios.create({ baseURL: apiUrl('/api/dashboard') })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  estatisticas: async () => (await api.get('/estatisticas')).data,
  entregasPendentes: async () => (await api.get('/entregas-pendentes')).data,
  desempenho: async () => (await api.get('/desempenho')).data
}
