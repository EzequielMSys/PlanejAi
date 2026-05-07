import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'

import ProtectedRoute from './routes/ProtectedRoute'
import Layout from './layouts/Layout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import PrimeiroAcesso from './pages/PrimeiroAcesso'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Cronograma from './pages/Cronograma'
import Perfil from './pages/Perfil'
import AlterarSenha from './pages/AlterarSenha'
import EsqueciSenha from './pages/EsqueciSenha'
import UsuariosAdmin from './pages/UsuariosAdmin'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/esqueci-senha" element={<EsqueciSenha />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/primeiro-acesso" element={<PrimeiroAcesso />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/inicio" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/cronograma" element={<Cronograma />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/alterar-senha" element={<AlterarSenha />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route element={<Layout />}>
            <Route path="/usuarios" element={<UsuariosAdmin />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  )
}

export default App