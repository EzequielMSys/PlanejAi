import { toast } from 'react-hot-toast'
import { createApiClient } from './apiClient'
const api = createApiClient('/api/auth')

export const authService = {
  async login(email, senha) {
    const response = await api.post('/login', { email, senha })
    return response.data
  },

  async session() {
    const response = await api.get('/session', { cache: false })
    return response.data
  },

  async logout() {
    const response = await api.post('/logout')
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

  async redefinirSenha(token, novaSenha, confirmarSenha) {
    const response = await api.post('/redefinir-senha', { token, novaSenha, confirmarSenha })
    toast.success(response.data.message || 'Senha redefinida!')
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
