import axios from 'axios'
import { toast } from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/usuarios'
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

function extrairMensagem(error, fallback = 'Erro na operação.') {
  return (
    error.response?.data?.error ||
    error.response?.data?.message ||
    error.message ||
    fallback
  )
}

const usuarioService = {
  async listar() {
    const response = await api.get('/')

    return Array.isArray(response.data)
      ? response.data
      : response.data.usuarios || []
  },

  async me() {
    const response = await api.get('/me')
    return response.data.usuario || response.data
  },

  async obterPorId(id) {
    const response = await api.get(`/${id}`)
    return response.data.usuario || response.data
  },

  async atualizar(id, data) {
    try {
      const response = await api.put(`/${id}`, data)

      toast.success(
        response.data.message || 'Perfil atualizado com sucesso!'
      )

      return response.data
    } catch (error) {
      toast.error(extrairMensagem(error, 'Erro ao atualizar usuário.'))
      throw error
    }
  },

  async uploadFotoPerfil(file) {
    try {
      const formData = new FormData()
      formData.append('foto', file)

      const response = await api.patch('/me/foto', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      toast.success(
        response.data.message || 'Foto atualizada com sucesso!'
      )

      return response.data
    } catch (error) {
      toast.error(extrairMensagem(error, 'Erro ao enviar foto.'))
      throw error
    }
  },

  async alterarTipo(id, tipo) {
    try {
      const response = await api.patch(`/${id}/tipo`, { tipo })

      toast.success(
        response.data.message || 'Tipo alterado com sucesso!'
      )

      return response.data
    } catch (error) {
      toast.error(extrairMensagem(error, 'Erro ao alterar tipo.'))
      throw error
    }
  },

  async alterarStatus(id, ativo) {
    try {
      const response = await api.patch(`/${id}/status`, {
        ativo: Boolean(ativo)
      })

      toast.success(
        response.data.message || 'Status alterado com sucesso!'
      )

      return response.data
    } catch (error) {
      toast.error(extrairMensagem(error, 'Erro ao alterar status.'))
      throw error
    }
  },

  async resetarSenha(id) {
    try {
      const response = await api.patch(`/${id}/resetar-senha`)

      toast.success(
        response.data.message || 'Senha redefinida com sucesso!'
      )

      return response.data
    } catch (error) {
      toast.error(extrairMensagem(error, 'Erro ao resetar senha.'))
      throw error
    }
  }
}

export default usuarioService