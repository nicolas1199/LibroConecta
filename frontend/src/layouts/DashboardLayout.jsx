"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import DashboardSidebar from "../components/dashboard/DashboardSidebar"
import DashboardHeader from "../components/dashboard/DashboardHeader"

export default function DashboardLayout({ children }) {
  const [user, setUser] = useState(null)
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

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
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
      <DashboardHeader user={user} />
      <DashboardSidebar user={user} onLogout={handleLogout} currentPath={location.pathname} />
      <main className="dashboard-main">{children}</main>
    </div>
  )
}
