"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { searchPublishedBooks } from "../api/publishedBooks"
import DashboardLayout from "../layouts/DashboardLayout"
import BookCard from "../components/BookCard"
import Search from "../components/icons/Search"
import BookOpen from "../components/icons/BookOpen"

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({})
  const [currentPage, setCurrentPage] = useState(1)

  const searchTerm = searchParams.get("q") || ""

  useEffect(() => {
    if (searchTerm && searchTerm.trim().length >= 2) {
      performSearch(searchTerm, 1)
    } else {
      setLoading(false)
    }
  }, [searchTerm])

  const performSearch = async (term, page = 1) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await searchPublishedBooks(term, page, 20)
      
      setSearchResults(response.searchResults || [])
      setPagination(response.pagination || {})
      setCurrentPage(page)
      
    } catch (error) {
      console.error("Error en búsqueda:", error)
      setError("Error al realizar la búsqueda")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    if (newPage !== currentPage) {
      performSearch(searchTerm, newPage)
    }
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Error en la búsqueda</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="btn btn-primary"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      )
    }

    if (!searchTerm || searchTerm.trim().length < 2) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Buscar libros</h2>
            <p className="text-gray-600">Utiliza la barra de búsqueda para encontrar libros</p>
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button 
              onClick={() => navigate("/dashboard")} 
              className="hover:text-blue-600 transition-colors"
            >
              Dashboard
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Resultados de búsqueda</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resultados para &ldquo;{searchTerm}&rdquo;
              </h1>
              <p className="text-gray-600 mt-1">
                {pagination.totalResults || 0} resultado(s) encontrado(s)
              </p>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {searchResults.length === 0 ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No se encontraron resultados
              </h3>
              <p className="text-gray-600 mb-4">
                Intenta con otros términos de búsqueda
              </p>
              <button 
                onClick={() => navigate("/dashboard/explore")} 
                className="btn btn-primary"
              >
                Explorar todos los libros
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid de libros */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {searchResults.map((book) => (
                <BookCard key={book.published_book_id} book={book} />
              ))}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>

                <span className="px-4 py-2 text-sm text-gray-700">
                  Página {currentPage} de {pagination.totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return <DashboardLayout>{renderContent()}</DashboardLayout>
}
