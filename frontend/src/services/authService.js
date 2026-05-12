import axios from 'axios'
import { toast } from 'react-hot-toast'

const API_BASE = '/api/auth'

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

export const authService = {
  async login(email, senha) {
    const response = await api.post('/login', { email, senha })
    return response.data
  },

  async register(data) {
    const response = await api.post('/register', data)
    toast.success(response.data.message || 'Cadastro realizado com sucesso!')
    return response.data
  },

  async esqueciSenha(email) {
    const response = await api.post('/esqueci-senha', { email })
    toast.success(response.data.message || 'Solicitação enviada!')
    return response.data
  },

  async trocarSenhaPrimeiroAcesso(senhaAtual, novaSenha, confirmarSenha) {
    const response = await api.post('/trocar-senha-primeiro-acesso', {
      senhaAtual,
      novaSenha,
      confirmarSenha
    })

    toast.success(response.data.message || 'Senha alterada com sucesso!')
    return response.data
  },

  async alterarSenha(senhaAtual, novaSenha, confirmarSenha) {
    const response = await api.post('/alterar-senha', {
      senhaAtual,
      novaSenha,
      confirmarSenha
    })

    toast.success(response.data.message || 'Senha alterada com sucesso!')
    return response.data
  }
}

export default authService