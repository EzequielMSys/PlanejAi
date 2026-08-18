import axios from 'axios'
import { toast } from 'react-hot-toast'
import { apiUrl } from '../config/api'

const api = axios.create({
  baseURL: apiUrl('/api/cronograma')
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

function tratarErro(error, mensagemPadrao) {
  const mensagem =
    error?.response?.data?.error ||
    error?.response?.data?.message ||
    mensagemPadrao

  toast.error(mensagem)

  throw error
}

const cronogramaService = {
  async gerarCronograma() {
    try {
      const response = await api.post('/gerar')

      toast.success(
        response.data.message || 'Cronograma gerado com sucesso!'
      )

      return response.data.cronograma
    } catch (error) {
      tratarErro(error, 'Erro ao gerar cronograma.')
    }
  },
  async replanejar() {
    try {
      const response = await api.post('/replanejar')
      toast.success(response.data.message)
      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao replanejar pendências.')
    }
  },

  async listarCronogramas() {
    try {
      const response = await api.get('/')
      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao listar cronogramas.')
    }
  },

  async obterCronogramaAtivo() {
    try {
      const response = await api.get('/ativo')
      return response.data.cronograma
    } catch (error) {
      tratarErro(error, 'Erro ao carregar cronograma ativo.')
    }
  },

  async concluirDia(diaId) {
    try {
      const response = await api.patch(
        `/dias/${diaId}/concluir`
      )

      toast.success(
        response.data.message || 'Dia concluído!'
      )

      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao concluir dia.')
    }
  },

  async reabrirDia(diaId) {
    try {
      const response = await api.patch(
        `/dias/${diaId}/reabrir`
      )

      toast.success(
        response.data.message || 'Dia reaberto!'
      )

      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao reabrir dia.')
    }
  },

  async concluirConteudo(conteudoCronogramaId) {
    try {
      const response = await api.patch(
        `/conteudos/${conteudoCronogramaId}/concluir`
      )

      toast.success(
        response.data.message || 'Conteúdo concluído!'
      )

      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao concluir conteúdo.')
    }
  },
  async moverConteudo(conteudoCronogramaId, idDiaDestino) {
    try {
      const response = await api.patch(`/conteudos/${conteudoCronogramaId}/mover`, { idDiaDestino })
      toast.success(response.data.message || 'Sessão movida.')
      return response.data.conteudo
    } catch (error) {
      tratarErro(error, 'Não foi possível mover a sessão.')
    }
  },


  async reabrirConteudo(conteudoCronogramaId) {
    try {
      const response = await api.patch(
        `/conteudos/${conteudoCronogramaId}/reabrir`
      )

      toast.success(
        response.data.message || 'Conteúdo reaberto!'
      )

      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao reabrir conteúdo.')
    }
  },

  async atualizarConteudoCronograma(conteudoCronogramaId, dados) {
    try {
      const response = await api.patch(`/conteudos/${conteudoCronogramaId}`, dados)
      return response.data.conteudo
    } catch (error) {
      tratarErro(error, 'Erro ao atualizar conteúdo.')
    }
  },

  async uploadMaterial(conteudoCronogramaId, file) {
    try {
      const form = new FormData()
      form.append('file', file)
      const response = await api.post(`/conteudos/${conteudoCronogramaId}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao enviar material.')
    }
  }
}

export default cronogramaService
