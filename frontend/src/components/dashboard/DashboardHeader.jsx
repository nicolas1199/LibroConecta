"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import BookOpen from "../icons/BookOpen"
import Search from "../icons/Search"
import Bell from "../icons/Bell"
import Plus from "../icons/Plus"
import Menu from "../icons/Menu"
import NotificationDropdown from "../NotificationDropdown"

export default function DashboardHeader({ user, onToggleSidebar, searchTerm, onSearchChange }) {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <header className="dashboard-header">
      <div className="flex items-center justify-between h-full">
        {/* Lado izquierdo - Botón de menú móvil y Logo */}
        <div className="flex items-center space-x-3">
          {/* Botón de menú móvil */}
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-gray-900">LibroConecta</span>
              <p className="text-xs text-gray-500 leading-none">Tu biblioteca conectada</p>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="search-container mx-8">
          <Search className="search-icon h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar libros, autores, usuarios..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <Link to="/dashboard/publish" className="btn btn-primary flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Publicar</span>
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
            >
              <Bell className="h-5 w-5" />
              <span className="notification-badge">2</span>
            </button>

            <NotificationDropdown isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
          </div>
        </div>
      </div>
    </header>
  )
}