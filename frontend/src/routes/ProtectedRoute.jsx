import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, adminOnly = false, donoOnly = false }) => {
  const {
    isAuthenticated,
    isAdmin,
    isDono,
    isDocente,
    isGestor,
    isPrimeiroAcesso,
    perfilCompleto,
    loading
  } = useAuth()

  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isPrimeiroAcessoRoute = location.pathname === '/primeiro-acesso'
  const isOnboardingRoute = location.pathname === '/onboarding'

  if (isPrimeiroAcesso && !isPrimeiroAcessoRoute) {
    return <Navigate to="/primeiro-acesso" replace />
  }

  if (!isPrimeiroAcesso && !perfilCompleto && !isOnboardingRoute && !isPrimeiroAcessoRoute && !isGestor) {
    return <Navigate to="/onboarding" replace />
  }

  if (perfilCompleto && isOnboardingRoute) {
    return <Navigate to="/dashboard" replace />
  }

  if (!isPrimeiroAcesso && isPrimeiroAcessoRoute) {
    return <Navigate to="/dashboard" replace />
  }

  if (donoOnly && !isDono) {
    return <Navigate to="/dashboard" replace />
  }

  if (adminOnly && !isAdmin && !isDono) {
    return <Navigate to="/dashboard" replace />
  }

  return children || <Outlet />
}

export default ProtectedRoute