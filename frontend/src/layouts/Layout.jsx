import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

function Layout() {
  const { isAuthenticated } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black">
      {isAuthenticated && (
        <>
          <Navbar
            onMenuClick={() => setSidebarOpen((v) => !v)}
            sidebarOpen={sidebarOpen}
          />

          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <main
        className={`transition-all duration-300 ${
          isAuthenticated ? 'pt-0' : ''
        }`}
      >
        <div className="min-h-[calc(100vh-4rem)] w-full">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout