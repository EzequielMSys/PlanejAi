import axios from 'axios'
import { apiUrl } from '../config/api'
const api = axios.create({ baseURL: apiUrl('/api/conteudos') })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
export default { listar: async () => (await api.get('/')).data, atualizar: async (id, dados) => (await api.put(`/${id}`, dados)).data.conteudo }
