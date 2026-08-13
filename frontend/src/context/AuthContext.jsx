import { createContext, useContext, useReducer, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import authService from '../services/authService'

const AuthContext = createContext()

const initialState = {
  user: null,
  token: null,
  primeiroAcesso: false,
  perfilCompleto: false,
  loading: true
}

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        primeiroAcesso: action.payload.primeiro_acesso,
        perfilCompleto: action.payload.perfil_completo,
        loading: false
      }

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      }

    case 'UPDATE_PERFIL_COMPLETO':
      return {
        ...state,
        perfilCompleto: action.payload
      }

    case 'LOGOUT':
      return {
        ...initialState,
        loading: false
      }

    case 'LOADING':
      return {
        ...state,
        loading: action.payload
      }

    default:
      return state
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    const primeiroAcesso =
      localStorage.getItem('primeiro_acesso') === 'true'

    const perfilCompleto =
      localStorage.getItem('perfil_completo') === 'true'

    if (token && user) {
      try {
        const parsedUser = JSON.parse(user)

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            token,
            user: parsedUser,
            primeiro_acesso: primeiroAcesso,
            perfil_completo: perfilCompleto
          }
        })
      } catch (error) {
        console.error('Erro ao restaurar sessão:', error)

        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('primeiro_acesso')
        localStorage.removeItem('perfil_completo')
      }
    }

    dispatch({
      type: 'LOADING',
      payload: false
    })
  }, [])

  const checkPerfilCompleto = async (usuarioId, token) => {
    try {
      const response = await fetch('/api/perfil', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        return false
      }

      const { perfil, disponibilidade } = await response.json()

      return Boolean(
        perfil &&
          perfil.areas_foco &&
          disponibilidade &&
          disponibilidade.length > 0
      )
    } catch (error) {
      console.error('Erro ao verificar perfil:', error)
      return false
    }
  }

  const login = async (email, senha) => {
    try {
      dispatch({
        type: 'LOADING',
        payload: true
      })

      const response = await authService.login(email, senha)

      const usuarioId =
        response.usuario.id_usuario || response.usuario.id

      const isGestor = ['dono', 'admin', 'adm', 'docente'].includes(response.usuario.tipo)
      const perfilCompleto = isGestor ? true : await checkPerfilCompleto(usuarioId, response.token)

      localStorage.setItem('token', response.token)

      localStorage.setItem(
        'user',
        JSON.stringify(response.usuario)
      )

      localStorage.setItem(
        'primeiro_acesso',
        response.primeiro_acesso ? 'true' : 'false'
      )

      localStorage.setItem(
        'perfil_completo',
        perfilCompleto ? 'true' : 'false'
      )

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token: response.token,
          user: response.usuario,
          primeiro_acesso: response.primeiro_acesso,
          perfil_completo: perfilCompleto
        }
      })

      toast.success('Login realizado com sucesso!')

      if (response.primeiro_acesso) {
        navigate('/primeiro-acesso')
      } else if (!perfilCompleto) {
        navigate('/onboarding')
      } else {
        navigate('/dashboard')
      }

      return response
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.message ||
          'Erro ao fazer login'
      )

      throw error
    } finally {
      dispatch({
        type: 'LOADING',
        payload: false
      })
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('primeiro_acesso')
    localStorage.removeItem('perfil_completo')

    dispatch({
      type: 'LOGOUT'
    })

    toast.success('Até logo!')
    navigate('/')
  }

  const updatePerfilCompleto = (completo) => {
    localStorage.setItem(
      'perfil_completo',
      completo ? 'true' : 'false'
    )

    dispatch({
      type: 'UPDATE_PERFIL_COMPLETO',
      payload: completo
    })
  }

  const updateUser = (data) => {
    const updatedUser = {
      ...state.user,
      ...data
    }

    localStorage.setItem(
      'user',
      JSON.stringify(updatedUser)
    )

    dispatch({
      type: 'UPDATE_USER',
      payload: updatedUser
    })
  }

  const isAdmin =
    state.user?.tipo === 'admin' ||
    state.user?.tipo === 'adm' ||
    state.user?.tipo === 'dono'

  const isDocente = state.user?.tipo === 'docente'

  const isDono =
    state.user?.tipo === 'dono'

  const isGestor = isAdmin || isDono || isDocente

  const value = {
    ...state,

    login,
    logout,

    updateUser,
    updatePerfilCompleto,

    isAuthenticated: !!state.token,

    isAdmin,
    isDocente,
    isDono,
    isGestor,

    isPrimeiroAcesso: state.primeiroAcesso
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth deve ser usado dentro de AuthProvider'
    )
  }

  return context
}
