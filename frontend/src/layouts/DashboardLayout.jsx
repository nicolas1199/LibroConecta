"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import DashboardSidebar from "../components/dashboard/DashboardSidebar"
import DashboardHeader from "../components/dashboard/DashboardHeader"
import { useAuth } from "../hooks/useAuth"
import { performLogout } from "../utils/auth"
import { getPublishedBooks } from "../api/publishedBooks"

export default function DashboardLayout({ children }) {
  const { user, isLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
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

  // Debounce search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch(searchTerm)
      } else {
        setSearchResults([])
        setShowSearchDropdown(false)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  const handleSearch = async (term) => {
    if (!term.trim()) return

    setIsSearching(true)
    setShowSearchDropdown(true)

    try {
      const response = await getPublishedBooks({
        search: term.trim(),
        limit: 10,
      })
      setSearchResults(response.publishedBooks || [])
    } catch (error) {
      console.error("Error searching books:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

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

  const handleSearchChange = (value) => {
    setSearchTerm(value)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowSearchDropdown(false)
      }
    }

    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  // Mostrar loading mientras se cargan los datos del usuario
  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <DashboardSidebar
        user={user}
        onLogout={handleLogout}
        currentPath={location.pathname}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        isLoggingOut={isLoggingOut}
      />

      {/* Main Content */}
      <div className="lg:ml-64">
        <DashboardHeader
          user={user}
          onToggleSidebar={toggleSidebar}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          searchResults={searchResults}
          isSearching={isSearching}
          showSearchDropdown={showSearchDropdown}
          onCloseSearch={() => setShowSearchDropdown(false)}
        />

        <main className="p-6 dashboard-main">{children}</main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={closeSidebar} />}
    </div>
  )
}