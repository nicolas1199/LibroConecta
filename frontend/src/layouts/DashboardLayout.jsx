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
    const userData = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!userData || !token) {
      if (location.pathname.startsWith("/dashboard")) {
        navigate("/login")
      }
      return
    }

    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error("Error parsing user data:", error)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      navigate("/login")
    }
  }, [navigate, location.pathname])

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    navigate("/")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
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
