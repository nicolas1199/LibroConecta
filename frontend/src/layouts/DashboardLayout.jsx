"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import DashboardSidebar from "../components/dashboard/DashboardSidebar"
import DashboardHeader from "../components/dashboard/DashboardHeader"
import { performLogout } from "../utils/auth"

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    // Agregar clase dashboard al body
    document.body.classList.add("dashboard")

    // Cleanup: remover clase cuando se desmonte el componente
    return () => {
      document.body.classList.remove("dashboard")
    }
  }, [])

  useEffect(() => {
    // Solo cargar datos de usuario, la autenticación la maneja PrivateRoute
    const userData = localStorage.getItem("user")

    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error("Error parsing user data:", error)
        // Si hay error en los datos, limpiar y recargar
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        window.location.reload()
      }
    }
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await performLogout(navigate)
    } catch (error) {
      // En caso de error, resetear el estado
      setIsLoggingOut(false)
      console.error("Error durante logout:", error)
    }
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  // Mostrar loading solo si no hay datos de usuario
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader user={user} onToggleSidebar={toggleSidebar} />

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={closeSidebar}></div>
      )}

      <DashboardSidebar
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isLoggingOut={isLoggingOut}
      />
      <main className="dashboard-main">{children}</main>
    </div>
  )
}