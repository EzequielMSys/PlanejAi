import { Outlet, useLocation } from 'react-router-dom'
import { lazy, Suspense, useState, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ConnectionStatus from '../components/ConnectionStatus'
import Deferred from '../components/Deferred'
import RouteLoading from '../components/RouteLoading'
import ErrorBoundary from '../components/ErrorBoundary'
import '../components/LearningSurfaces.css'
import '../components/WorkspaceUtilities.css'

// Widgets secundários: não participam da primeira pintura. O lazy() tira o
// código deles do bundle de entrada (index.js) e o Deferred garante que os
// imports sejam disparados só depois do paint, em ociosidade — a página fica
// utilizável antes deles e o peso crítico cai em todas as rotas.
const FocusTimer = lazy(() => import('../components/FocusTimer'))
const InstallApp = lazy(() => import('../components/InstallApp'))

/** Deferred + Suspense num só ponto: import lazy em si, sem indicador visível. */
function CarregadoAposPintura({ children }) {
  return (
    <ErrorBoundary silent>
      <Deferred>
        <Suspense fallback={null}>{children}</Suspense>
      </Deferred>
    </ErrorBoundary>
  )
}

function Layout() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const closeSidebar = useCallback(() => setSidebarOpen(false), [])

  return (
    <div className={`app-shell sd-workspace min-h-screen${sidebarOpen ? ' has-open-menu' : ''}`}>
      {isAuthenticated && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={closeSidebar}
          />
        </>
      )}

      <div className={isAuthenticated ? 'app-workspace' : ''}>
        {isAuthenticated && (
          <Navbar
            onMenuClick={() => setSidebarOpen((value) => !value)}
            sidebarOpen={sidebarOpen}
          />
        )}

        <div id="conteudo-principal" className="app-main" tabIndex="-1">
          <ConnectionStatus />
          <div className="app-route-outlet sd-route">
            <ErrorBoundary resetKey={location.pathname}>
              <Suspense fallback={<RouteLoading embedded />}><Outlet /></Suspense>
            </ErrorBoundary>
          </div>
        </div>
        {isAuthenticated && (
          <>
          <CarregadoAposPintura><FocusTimer /></CarregadoAposPintura>
          <CarregadoAposPintura><InstallApp /></CarregadoAposPintura>
          </>
        )}
      </div>
    </div>
  )
}

export default Layout
