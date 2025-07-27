"use client"

import { Link } from "react-router-dom"
import { useState } from "react"
import BookOpen from "../icons/BookOpen"
import Search from "../icons/Search"
import Bell from "../icons/Bell"
import Plus from "../icons/Plus"
import Menu from "../icons/Menu"
import NotificationDropdown from "../NotificationDropdown"

export default function DashboardHeader({
  user,
  onToggleSidebar,
  searchTerm,
  onSearchChange,
  searchResults,
  isSearching,
  showSearchDropdown,
  onCloseSearch,
}) {
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSearchResultClick = (book) => {
    onCloseSearch()
    onSearchChange("")
  }

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
        <div className="search-container mx-8 relative">
          <Search className="search-icon h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar libros, autores, usuarios..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />

          {/* Search Results Dropdown */}
          {showSearchDropdown && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Buscando...
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-3 border-b border-gray-100 text-sm text-gray-600">
                    {searchResults.length} resultados encontrados
                  </div>
                  {searchResults.map((book) => (
                    <Link
                      key={book.published_book_id}
                      to={`/dashboard/book/${book.published_book_id}`}
                      className="block p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSearchResultClick(book)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {book.PublishedBookImages && book.PublishedBookImages.length > 0 ? (
                            <img
                              src={book.PublishedBookImages[0].image_url || book.PublishedBookImages[0].image_base64}
                              alt={book.Book?.title || "Libro"}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "/images/book-placeholder.png"
                              }}
                            />
                          ) : (
                            <img
                              src="/images/book-placeholder.png"
                              alt="Libro"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {book.Book?.title || "Título no disponible"}
                          </h4>
                          <p className="text-sm text-gray-500 truncate">
                            Autor: {book.Book?.author || "Autor desconocido"}
                          </p>
                          <p className="text-sm text-gray-500 truncate">
                            Por: {book.User?.first_name} {book.User?.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">${book.price || "0.00"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </>
              ) : searchTerm.trim() ? (
                <div className="p-4 text-center text-gray-500">No se encontraron libros para "{searchTerm}"</div>
              ) : null}
            </div>
          )}
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
