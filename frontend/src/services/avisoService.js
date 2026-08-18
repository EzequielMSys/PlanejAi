import axios from 'axios'
import { apiUrl } from '../config/api'

const api = axios.create({ baseURL: apiUrl('/api/avisos') })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default {
  listar: async () => (await api.get('/')).data,
  criar: async (aviso) => (await api.post('/', aviso)).data.aviso,
  deletar: async (id) => (await api.delete(`/${id}`)).data
}
