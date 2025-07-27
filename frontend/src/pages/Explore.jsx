"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import ArrowLeft from "../components/icons/ArrowLeft"
import Filter from "../components/icons/Filter"
import Search from "../components/icons/Search"
import BookCard from "../components/BookCard"
import { getPublishedBooks, getTransactionTypes, getBookConditions, getLocations } from "../api/publishedBooks"

export default function Explore() {
  const [publishedBooks, setPublishedBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    search: "",
    transaction_type_id: "",
    condition_id: "",
    location_id: "",
  })
  const [showFilters, setShowFilters] = useState(false)

  // Datos de referencia para filtros
  const [transactionTypes, setTransactionTypes] = useState([])
  const [bookConditions, setBookConditions] = useState([])
  const [locations, setLocations] = useState([])

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [transactionTypesData, bookConditionsData, locationsData] = await Promise.all([
          getTransactionTypes(),
          getBookConditions(),
          getLocations(),
        ])

        setTransactionTypes(transactionTypesData)
        setBookConditions(bookConditionsData)
        setLocations(locationsData)
      } catch (error) {
        console.error("Error loading reference data:", error)
      }
    }

    loadReferenceData()
  }, [])

  useEffect(() => {
    const loadPublishedBooks = async () => {
      try {
        setLoading(true)
        const response = await getPublishedBooks({
          limit: 20,
          ...filters,
        })
        setPublishedBooks(response.publishedBooks || [])
      } catch (error) {
        console.error("Error loading published books:", error)
        setError("Error al cargar los libros")
      } finally {
        setLoading(false)
      }
    }

    loadPublishedBooks()
  }, [filters])

  useEffect(() => {
    // Debounce para la búsqueda
    const timeoutId = setTimeout(() => {
      if (filters.search.trim() !== "") {
        // La búsqueda ya se maneja en el useEffect principal
        // Este timeout evita llamadas excesivas a la API
      }
    }, 500) // 500ms de delay

    return () => clearTimeout(timeoutId)
  }, [filters.search])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      transaction_type_id: "",
      condition_id: "",
      location_id: "",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Explorar libros</h1>
              <p className="text-gray-600">Descubre libros disponibles para intercambio, regalo o venta</p>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de transacción</label>
                <select
                  value={filters.transaction_type_id}
                  onChange={(e) => handleFilterChange("transaction_type_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {transactionTypes.map((type) => (
                    <option key={type.transaction_type_id} value={type.transaction_type_id}>
                      {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado del libro</label>
                <select
                  value={filters.condition_id}
                  onChange={(e) => handleFilterChange("condition_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todos</option>
                  {bookConditions.map((condition) => (
                    <option key={condition.condition_id} value={condition.condition_id}>
                      {condition.condition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ubicación</label>
                <select
                  value={filters.location_id}
                  onChange={(e) => handleFilterChange("location_id", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Todas</option>
                  {locations.map((location) => (
                    <option key={location.location_id} value={location.location_id}>
                      {location.comuna}, {location.region}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 flex justify-end">
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {publishedBooks.length} libro{publishedBooks.length !== 1 ? "s" : ""} encontrado
              {publishedBooks.length !== 1 ? "s" : ""}
            </h2>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center py-12">
              <div className="spinner border-gray-300 border-t-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Books Grid */}
          {!loading && !error && publishedBooks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publishedBooks.map((book) => (
                <BookCard key={book.published_book_id} book={book} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && publishedBooks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No se encontraron libros</h3>
              <p className="text-gray-600 mb-6">Intenta ajustar los filtros o buscar con otros términos</p>
              <button onClick={clearFilters} className="btn btn-primary">
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}