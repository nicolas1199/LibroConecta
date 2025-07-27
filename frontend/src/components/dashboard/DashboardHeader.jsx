"use client"

import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import BookOpen from "../icons/BookOpen"
import Search from "../icons/Search"
import Bell from "../icons/Bell"
import Plus from "../icons/Plus"
import Menu from "../icons/Menu"
import NotificationDropdown from "../NotificationDropdown"
import { searchPublishedBooks } from "../../api/publishedBooks"

export default function DashboardHeader({ user, onToggleSidebar, searchTerm, onSearchChange, onSearchResults }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef(null)
  const searchResultsRef = useRef(null)
  const navigate = useNavigate()

  // Función para realizar la búsqueda
  const performSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      if (onSearchResults) onSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      console.log(`🔍 Realizando búsqueda: "${query}"`)
      const response = await searchPublishedBooks({
        q: query.trim(),
        limit: 10, // Limitar resultados para el dropdown
      })

      console.log(`✅ Resultados obtenidos:`, response.searchResults?.length || 0)
      setSearchResults(response.searchResults || [])
      setShowSearchResults(true)

      // Notificar al componente padre sobre los resultados
      if (onSearchResults) {
        onSearchResults(response.searchResults || [])
      }
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setSearchResults([])
      setShowSearchResults(false)
      if (onSearchResults) onSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounce para la búsqueda
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchTerm)
    }, 300) // Esperar 300ms después de que el usuario deje de escribir

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Cerrar resultados al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Manejar cambio en el input de búsqueda
  const handleSearchChange = (value) => {
    onSearchChange(value)
    if (!value.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      if (onSearchResults) onSearchResults([])
    }
  }

  // Manejar selección de resultado
  const handleResultClick = (result) => {
    setShowSearchResults(false)
    // Navegar al detalle del libro
    navigate(`/dashboard/book/${result.published_book_id}`)
    console.log("Navegando a libro:", result.published_book_id)
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

        {/* Search Bar con resultados */}
        <div className="search-container mx-8 relative" ref={searchResultsRef}>
          <Search className="search-icon h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar libros, autores, usuarios..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
          />

          {/* Indicador de carga */}
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Dropdown de resultados */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
              <div className="p-2">
                <div className="text-xs text-gray-500 mb-2">
                  {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
                  {searchResults.length !== 1 ? "s" : ""}
                </div>
                {searchResults.map((result) => (
                  <div
                    key={result.published_book_id}
                    onClick={() => handleResultClick(result)}
                    className="flex items-center p-3 hover:bg-gray-50 cursor-pointer rounded-lg border-b border-gray-100 last:border-b-0"
                  >
                    {/* Imagen del libro */}
                    <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 mr-3 overflow-hidden">
                      {result.PublishedBookImages?.[0]?.image_base64 ? (
                        <img
                          src={`data:image/jpeg;base64,${result.PublishedBookImages[0].image_base64}`}
                          alt={result.Book?.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <BookOpen className="h-6 w-6" />
                        </div>
                      )}
                    </div>

                    {/* Información del libro */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{result.Book?.title}</h4>
                      <p className="text-sm text-gray-600 truncate">por {result.Book?.author}</p>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>
                          {result.User?.first_name} {result.User?.last_name}
                        </span>
                        {result.LocationBook && (
                          <>
                            <span className="mx-1">•</span>
                            <span>{result.LocationBook.comuna}</span>
                          </>
                        )}
                        {result.TransactionType && (
                          <>
                            <span className="mx-1">•</span>
                            <span className="capitalize">{result.TransactionType.name}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Precio si es venta */}
                    {result.price && (
                      <div className="text-right">
                        <span className="text-lg font-semibold text-green-600">
                          ${Number(result.price).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay resultados */}
          {showSearchResults && searchResults.length === 0 && searchTerm.trim().length >= 2 && !isSearching && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-4 text-center text-gray-500">No se encontraron resultados para "{searchTerm}"</div>
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