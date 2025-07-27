"use client"

import { useState, useEffect, useRef } from "react"
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
  const [searchLoading, setSearchLoading] = useState(false)

  // Datos de referencia para filtros
  const [transactionTypes, setTransactionTypes] = useState([])
  const [bookConditions, setBookConditions] = useState([])
  const [locations, setLocations] = useState([])

  // Ref para el timeout del debounce
  const debounceRef = useRef(null)

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

  // Función para cargar libros
  const loadPublishedBooks = async (searchFilters) => {
    try {
      setError(null)

      // Si hay búsqueda activa, mostrar loading específico
      if (searchFilters.search) {
        setSearchLoading(true)
      }

      // Preparar parámetros para la API
      const params = {
        limit: 20,
      }

      // Agregar filtros solo si tienen valor
      if (searchFilters.search && searchFilters.search.trim()) {
        params.search = searchFilters.search.trim()
      }
      if (searchFilters.transaction_type_id) {
        params.transaction_type_id = searchFilters.transaction_type_id
      }
      if (searchFilters.condition_id) {
        params.condition_id = searchFilters.condition_id
      }
      if (searchFilters.location_id) {
        params.location_id = searchFilters.location_id
      }

      console.log("Parámetros enviados a la API:", params)

      const response = await getPublishedBooks(params)

      console.log("Respuesta de la API:", response)

      setPublishedBooks(response.publishedBooks || [])
    } catch (error) {
      console.error("Error loading published books:", error)
      setError("Error al cargar los libros. Por favor, intenta de nuevo.")
      setPublishedBooks([])
    } finally {
      setSearchLoading(false)
      setLoading(false)
    }
  }

  // Efecto para cargar libros con debounce mejorado
  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Determinar el delay basado en si hay búsqueda de texto
    const delay = filters.search ? 800 : 200

    debounceRef.current = setTimeout(() => {
      loadPublishedBooks(filters)
    }, delay)

    // Cleanup function
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [filters])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    handleFilterChange("search", value)
  }

  const clearFilters = () => {
    setFilters({
      search: "",
      transaction_type_id: "",
      condition_id: "",
      location_id: "",
    })
  }

  const clearSearch = () => {
    handleFilterChange("search", "")
  }

  const removeFilter = (filterKey) => {
    handleFilterChange(filterKey, "")
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
              onChange={handleSearchChange}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            {/* Clear search button */}
            {filters.search && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar búsqueda"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {/* Loading indicator for search */}
            {searchLoading && (
              <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {/* Search suggestions/tips */}
          {filters.search && (
            <div className="mb-4 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Consejos de búsqueda:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Busca por título: "Harry Potter", "1984", "El Principito"</li>
                <li>Busca por autor: "J.K. Rowling", "George Orwell"</li>
                <li>Busca por año: "2020", "1949"</li>
                <li>Busca por editorial o usuario que publicó</li>
              </ul>
            </div>
          )}

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

              <div className="md:col-span-3 flex justify-end space-x-2">
                <button onClick={clearSearch} className="btn btn-outline">
                  Limpiar búsqueda
                </button>
                <button onClick={clearFilters} className="btn btn-secondary">
                  Limpiar todos los filtros
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active filters display */}
        {(filters.search || filters.transaction_type_id || filters.condition_id || filters.location_id) && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-700">Filtros activos:</span>

              {filters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Búsqueda: "{filters.search}"
                  <button onClick={clearSearch} className="ml-2 text-blue-600 hover:text-blue-800">
                    ×
                  </button>
                </span>
              )}

              {filters.transaction_type_id && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {
                    transactionTypes.find((t) => t.transaction_type_id.toString() === filters.transaction_type_id)
                      ?.description
                  }
                  <button
                    onClick={() => removeFilter("transaction_type_id")}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.condition_id && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  {bookConditions.find((c) => c.condition_id.toString() === filters.condition_id)?.condition}
                  <button
                    onClick={() => removeFilter("condition_id")}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    ×
                  </button>
                </span>
              )}

              {filters.location_id && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {locations.find((l) => l.location_id.toString() === filters.location_id)?.comuna}
                  <button
                    onClick={() => removeFilter("location_id")}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Results */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading || searchLoading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                  Buscando...
                </span>
              ) : (
                <>
                  {publishedBooks.length} libro{publishedBooks.length !== 1 ? "s" : ""} encontrado
                  {publishedBooks.length !== 1 ? "s" : ""}
                  {filters.search && <span className="text-gray-500 font-normal"> para "{filters.search}"</span>}
                </>
              )}
            </h2>
          </div>

          {/* Loading State */}
          {(loading || searchLoading) && (
            <div className="flex justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-600">{filters.search ? "Buscando libros..." : "Cargando libros..."}</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => loadPublishedBooks(filters)} className="btn btn-primary">
                Reintentar
              </button>
            </div>
          )}

          {/* Books Grid */}
          {!loading && !searchLoading && !error && publishedBooks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {publishedBooks.map((book) => (
                <BookCard key={book.published_book_id} book={book} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !searchLoading && !error && publishedBooks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filters.search ? "No se encontraron libros" : "No hay libros disponibles"}
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.search
                  ? `No encontramos libros que coincidan con "${filters.search}". Intenta con otros términos o ajusta los filtros.`
                  : "Intenta ajustar los filtros o buscar con otros términos"}
              </p>
              <div className="space-x-2">
                {filters.search && (
                  <button onClick={clearSearch} className="btn btn-outline">
                    Limpiar búsqueda
                  </button>
                )}
                <button onClick={clearFilters} className="btn btn-primary">
                  Limpiar todos los filtros
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}