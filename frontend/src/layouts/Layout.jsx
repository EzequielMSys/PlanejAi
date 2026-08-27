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
import AccessibilityToolbar from '../components/AccessibilityToolbar'

function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-shell min-h-screen text-black dark:text-white">
      <a href="#conteudo-principal" className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-full bg-white px-4 py-3 font-black text-black shadow-xl transition focus:translate-y-0">Pular para o conteúdo</a>
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
        <AccessibilityToolbar />
      </div>
    </div>
  )
}

export default Layout
