import axios from 'axios'
import { toast } from 'react-hot-toast'
import { apiUrl } from '../config/api'

const api = axios.create({
  baseURL: apiUrl('/api/redacao')
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

const redacaoService = {
  async enviarRedacao({ tema, texto }) {
    try {
      const response = await api.post('/', { tema, texto })

      toast.success(
        response.data.message || 'Redação enviada com sucesso!'
      )

      return response.data.redacao
    } catch (error) {
      tratarErro(error, 'Erro ao enviar redação.')
    }
  },

  async listarRedacoes() {
    try {
      const response = await api.get('/')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      tratarErro(error, 'Erro ao listar redações.')
    }
  },

  async listarTodasRedacoes() {
    try {
      const response = await api.get('/todas')
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      tratarErro(error, 'Erro ao listar todas as redações.')
    }
  },

async obterRedacao(idRedacao) {
    try {
      const response = await api.get(`/${idRedacao}`)
      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao obter redação.')
    }
  },

  async sugerirTema(palavraChave = '') {
    try {
      const response = await api.post('/sugerir-tema', { palavraChave })
      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao sugerir tema.')
    }
  },

  async analisarRascunho({ tema, texto }) {
    try {
      const response = await api.post('/analisar-rascunho', { tema, texto })
      return response.data
    } catch (error) {
      tratarErro(error, 'Erro ao analisar rascunho.')
    }
  },

  async avaliarRedacao(idRedacao, { notaManual, feedbackManual }) {
    try {
      const response = await api.patch(`/${idRedacao}/avaliar`, {
        notaManual,
        feedbackManual
      })

      toast.success(
        response.data.message || 'Redação avaliada com sucesso!'
      )

      return response.data.redacao
    } catch (error) {
      tratarErro(error, 'Erro ao avaliar redação.')
    }
  }
}

export default redacaoService
