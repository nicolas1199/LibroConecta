"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { getPublishedBooks } from "../../api/publishedBooks"

function DashboardHeader() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  // Función de búsqueda con debounce
  useEffect(() => {
    const delayedSearch = setTimeout(async () => {
      if (searchTerm.trim()) {
        setIsSearching(true)
        try {
          const response = await getPublishedBooks({
            search: searchTerm.trim(),
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
      } else {
        setSearchResults([])
        setShowResults(false)
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".search-container")) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        <div className="relative flex-1 max-w-md search-container">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Buscar libros, autores, usuarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {/* Dropdown de resultados de búsqueda */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-600">
                    {searchResults.length} resultado{searchResults.length !== 1 ? "s" : ""} encontrado
                    {searchResults.length !== 1 ? "s" : ""}
                  </div>
                  {searchResults.map((book) => (
                    <Link
                      key={book.published_book_id}
                      to={`/dashboard/book/${book.published_book_id}`}
                      className="flex items-center p-3 hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                      onClick={() => {
                        setShowResults(false)
                        setSearchTerm("")
                      }}
                    >
                      <img
                        src={book.Book?.cover_image || "/images/book-placeholder.png"}
                        alt={book.Book?.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div className="ml-3 flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{book.Book?.title}</h4>
                        <p className="text-gray-600 text-xs">{book.Book?.author}</p>
                        <p className="text-gray-500 text-xs">
                          Por {book.User?.first_name} {book.User?.last_name}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-blue-600">${book.price}</span>
                        <p className="text-xs text-gray-500">{book.TransactionType?.type_name}</p>
                      </div>
                    </Link>
                  ))}
                </>
              ) : (
                <div className="p-4 text-center text-gray-500">No se encontraron resultados para "{searchTerm}"</div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader