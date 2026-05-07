import axios from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE = '/api/usuarios'

const api = axios.create({
  baseURL: API_BASE
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

const usuarioService = {
  async listar() {
    const response = await api.get('/')
    return response.data
  },

  async me() {
    const response = await api.get('/me')
    return response.data
  },

  async atualizar(id, data) {
    const response = await api.put(`/${id}`, data)
    toast.success('Perfil atualizado!')
    return response.data
  },

  async uploadFotoPerfil(file) {
    const formData = new FormData()

    formData.append('foto', file)

    const response = await api.patch('/me/foto', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    toast.success('Foto atualizada!')
    return response.data
  },

  async alterarTipo(id, tipo) {
    const response = await api.patch(`/${id}/tipo`, { tipo })

    toast.success(response.data.message)
    return response.data
  },

  async alterarStatus(id, ativo) {
    const response = await api.patch(`/${id}/status`, { ativo })

    toast.success(response.data.message)
    return response.data
  },

  async resetarSenha(id) {
    const response = await api.patch(`/${id}/resetar-senha`)

    toast.success(response.data.message)
    return response.data
  }
}

export default usuarioService