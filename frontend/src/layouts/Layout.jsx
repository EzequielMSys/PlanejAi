import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ConnectionStatus from '../components/ConnectionStatus'
import FocusTimer from '../components/FocusTimer'
import InstallApp from '../components/InstallApp'
import StudyAudioDockV2 from '../components/StudyAudioDockV2'
import AccessibilityToolbar from '../components/AccessibilityToolbar'

function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
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
            <Outlet />
          </div>
        </main>
        {isAuthenticated && <FocusTimer />}
        {isAuthenticated && <InstallApp />}
        {isAuthenticated && <StudyAudioDockV2 />}
        <AccessibilityToolbar />
      </div>
    </div>
  )
}

export default Layout
