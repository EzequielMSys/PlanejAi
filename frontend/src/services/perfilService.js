import { toast } from 'react-hot-toast'
import { createApiClient } from './apiClient'
const api = createApiClient('/api/perfil')

const perfilService = {
  async obterPerfilCompleto() {
    const response = await api.get('/')
    return response.data
  },

  async salvarPerfil(data) {
    const response = await api.post('/', data)
    toast.success(response.data.message || 'Perfil salvo com sucesso!')
    return response.data
  },

  async atualizarPerfil(data) {
    const response = await api.put('/', data)
    toast.success(response.data.message || 'Perfil atualizado com sucesso!')
    return response.data
  },

  async obterDisponibilidade() {
    const response = await api.get('/disponibilidade')
    return response.data
  },

  async salvarDisponibilidade(dias) {
    const response = await api.post('/disponibilidade', { dias })
    toast.success(response.data.message || 'Disponibilidade salva com sucesso!')
    return response.data
  }
}

export default perfilService
