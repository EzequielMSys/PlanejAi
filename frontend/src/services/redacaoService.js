import axios from 'axios'
import { toast } from 'react-hot-toast'

const api = axios.create({
  baseURL: '/api/redacao'
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
  }
}

export default redacaoService
