"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import Search from "../icons/Search"
import Bell from "../icons/Bell"
import Plus from "../icons/Plus"
import ChevronDown from "../icons/ChevronDown"
import { getPublishedBooks } from "../../api/publishedBooks"

export default function DashboardHeader({ user }) {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Debounce search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery)
      }, 300)
      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  const handleSearch = async (query) => {
    if (!query.trim()) return

    setIsSearching(true)
    try {
      const response = await getPublishedBooks({
        search: query,
        limit: 10,
      })
      setSearchResults(response.publishedBooks || [])
      setShowResults(true)
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/dashboard/explore?search=${encodeURIComponent(searchQuery)}`)
      setShowResults(false)
    }
  }

  const handleResultClick = (bookId) => {
    navigate(`/dashboard/book/${bookId}`)
    setShowResults(false)
    setSearchQuery("")
  }

  const clearSearch = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LC</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">LibroConecta</h1>
            <p className="text-xs text-gray-500">Tu biblioteca conectada</p>
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar libros, autores, usuarios..."
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="p-3 border-b border-gray-100">
                    <span className="text-sm text-gray-600">
                      {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
                      {searchResults.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {searchResults.map((book) => (
                    <button
                      key={book.published_book_id}
                      onClick={() => handleResultClick(book.published_book_id)}
                      className="w-full p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 text-left"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                          {book.PublishedBookImages?.[0]?.image_url ? (
                            <img
                              src={book.PublishedBookImages[0].image_url || "/placeholder.svg"}
                              alt={book.Book?.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none"
                                e.target.nextSibling.style.display = "flex"
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-400 text-xs">📚</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {book.Book?.title || "Título no disponible"}
                          </h4>
                          <p className="text-sm text-gray-600 truncate">{book.Book?.author || "Autor desconocido"}</p>
                          <p className="text-xs text-gray-500 truncate">
                            Por {book.User?.first_name} {book.User?.last_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-medium text-blue-600">${book.price || "N/A"}</span>
                          <p className="text-xs text-gray-500">{book.TransactionType?.type_name || "N/A"}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  <div className="p-3 border-t border-gray-100">
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Ver todos los resultados →
                    </button>
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No se encontraron resultados para "{searchQuery}"</p>
                  <p className="text-xs mt-1">Intenta con otros términos de búsqueda</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-4">
          {/* Publish Button */}
          <Link
            to="/dashboard/publish"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Publicar</span>
          </Link>

          {/* Notifications */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              1
            </span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">{user?.first_name?.[0]?.toUpperCase() || "U"}</span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.first_name || "Usuario"}</p>
                <p className="text-xs text-gray-500">{user?.UserType?.type_name || "Lector"}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}