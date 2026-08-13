import axios from 'axios'
const api = axios.create({ baseURL: '/api/conteudos' })
api.interceptors.request.use((config) => { const token = localStorage.getItem('token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config })
export default { listar: async () => (await api.get('/')).data, atualizar: async (id, dados) => (await api.put(`/${id}`, dados)).data.conteudo }
