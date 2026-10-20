import { Outlet } from 'react-router-dom'
import { lazy, Suspense, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ConnectionStatus from '../components/ConnectionStatus'
import Deferred from '../components/Deferred'
import RouteLoading from '../components/RouteLoading'
import { MotionConfig } from 'framer-motion'
import { useAccessibility } from '../context/AccessibilityContext'

// Widgets secundários: não participam da primeira pintura. O lazy() tira o
// código deles do bundle de entrada (index.js) e o Deferred garante que os
// imports sejam disparados só depois do paint, em ociosidade — a página fica
// utilizável antes deles e o peso crítico cai em todas as rotas.
const FocusTimer = lazy(() => import('../components/FocusTimer'))
const InstallApp = lazy(() => import('../components/InstallApp'))
const StudyAudioDockV2 = lazy(() => import('../components/StudyAudioDockV2'))
const Chatbot = lazy(() => import('../components/Chatbot'))

/** Deferred + Suspense num só ponto: import lazy em si, sem indicador visível. */
function CarregadoAposPintura({ children }) {
  return (
    <Deferred>
      <Suspense fallback={null}>{children}</Suspense>
    </Deferred>
  )
}

function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { settings } = useAccessibility()

  return (
    <MotionConfig reducedMotion={settings.reducedMotion ? 'always' : 'user'}>
    <div className="app-shell min-h-screen">
      {isAuthenticated && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
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

        <main id="conteudo-principal" className="app-main" tabIndex="-1">
          <ConnectionStatus />
          <div className="app-route-outlet">
            <Suspense fallback={<RouteLoading />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        {isAuthenticated && (
          <CarregadoAposPintura>
            <FocusTimer />
            <InstallApp />
            <StudyAudioDockV2 />
            <Chatbot />
          </CarregadoAposPintura>
        )}
      </div>
    </div>
    </MotionConfig>
  )
}

export default Layout
