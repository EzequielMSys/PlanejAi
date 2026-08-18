import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import ConnectionStatus from '../components/ConnectionStatus'
import FocusTimer from '../components/FocusTimer'
import '../components/ThemeCorrections.css'
import InstallApp from '../components/InstallApp'
import StudyAudioDockV2 from '../components/StudyAudioDockV2'
import WorkspaceRail from '../components/WorkspaceRail'

function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell min-h-screen text-black dark:text-white">
      {isAuthenticated && (
        <>
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <div className={isAuthenticated ? 'transition-[padding] duration-300 lg:pl-64' : ''}>
        {isAuthenticated && (
          <Navbar
            onMenuClick={() => setSidebarOpen((value) => !value)}
            sidebarOpen={sidebarOpen}
          />
        )}

        {isAuthenticated && <WorkspaceRail />}
        <main id="conteudo-principal" tabIndex="-1">
          <ConnectionStatus />
          <div className="min-h-[calc(100vh-4rem)] w-full">
            <Outlet />
          </div>
        </main>
        {isAuthenticated && <FocusTimer />}
        {isAuthenticated && <InstallApp />}
        {isAuthenticated && <StudyAudioDockV2 />}
      </div>
    </div>
  )
}

export default Layout
