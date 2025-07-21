import { useState, useCallback } from "react";
import { useLibraryWithFilters } from "../hooks/useLibraryQuery";
import { useLibraryFilters } from "../hooks/useLibraryFilters";
import { Link } from "react-router-dom";
import TrendingUp from "../components/icons/TrendingUp";
import Plus from "../components/icons/Plus";
import LibraryFilters from "../components/library/LibraryFilters";
import LibraryGrid from "../components/library/LibraryGrid";
import LibraryPagination from "../components/library/LibraryPagination";

export default function MyLibrary() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [appliedAdvancedFilters, setAppliedAdvancedFilters] = useState({});

  // Hooks para filtros
  const {
    activeTab,
    searchTerm,
    showAdvancedSearch,
    quickGenreFilter,
    advancedFilters,
    setActiveTab,
    setSearchTerm,
    setShowAdvancedSearch,
    setQuickGenreFilter,
    updateAdvancedFilter,
    resetFilters,
    getFilterParams,
    getAdvancedFilterParams,
  } = useLibraryFilters();

  // Obtener filtros básicos (sin avanzados por defecto)
  const basicFilterParams = getFilterParams();
  const { status, ...basicFilters } = basicFilterParams;

  // Combinar filtros básicos con filtros avanzados aplicados
  const allFilters = { ...basicFilters, ...appliedAdvancedFilters };

  // Hook de React Query para obtener datos de la biblioteca
  const {
    library,
    pagination,
    stats,
    globalStats,
    isLoading,
    isError,
    error,
    deleteBook,
    isDeletingBook,
    deleteBookError,
    refetch,
  } = useLibraryWithFilters(activeTab, searchTerm, allFilters, currentPage);

  // Función para manejar búsqueda con filtros
  const handleSearch = useCallback(() => {
    setCurrentPage(1); // Resetear página al buscar
    refetch();
  }, [refetch]);

  // Función para aplicar filtros avanzados
  const handleApplyAdvancedFilters = useCallback(() => {
    // Obtener filtros avanzados actuales
    const advancedFilterParams = getAdvancedFilterParams();
    const { status, ...advancedFiltersOnly } = advancedFilterParams;

    // Guardar solo los filtros avanzados (excluyendo búsqueda y género rápido)
    const newAdvancedFilters = {};
    if (advancedFilters.author && advancedFilters.author.trim().length >= 2) {
      newAdvancedFilters.author = advancedFilters.author.trim();
    }
    if (advancedFilters.rating && !isNaN(Number(advancedFilters.rating))) {
      const rating = Number(advancedFilters.rating);
      if (rating >= 1 && rating <= 5) {
        newAdvancedFilters.rating = rating;
      }
    }
    if (advancedFilters.year && !isNaN(Number(advancedFilters.year))) {
      const year = Number(advancedFilters.year);
      if (year >= 1000 && year <= new Date().getFullYear()) {
        newAdvancedFilters.year = year;
      }
    }
    if (advancedFilters.genre && advancedFilters.genre.trim()) {
      newAdvancedFilters.genre = advancedFilters.genre.trim();
    }
    if (advancedFilters.sortBy && advancedFilters.sortBy.trim()) {
      newAdvancedFilters.sortBy = advancedFilters.sortBy;
    }
    if (
      advancedFilters.sortOrder &&
      ["ASC", "DESC"].includes(advancedFilters.sortOrder.toUpperCase())
    ) {
      newAdvancedFilters.sortOrder = advancedFilters.sortOrder;
    }

    setAppliedAdvancedFilters(newAdvancedFilters);
    setCurrentPage(1);
  }, [advancedFilters, setAppliedAdvancedFilters]);

  // Resetear página cuando cambien los filtros principales
  const handleTabChange = useCallback(
    (newTab) => {
      setActiveTab(newTab);
      setCurrentPage(1);
    },
    [setActiveTab],
  );

  // Función personalizada para resetear todos los filtros
  const handleResetFilters = useCallback(() => {
    resetFilters(); // Resetear filtros del hook
    setAppliedAdvancedFilters({}); // Limpiar filtros avanzados aplicados
    setCurrentPage(1);
  }, [resetFilters, setAppliedAdvancedFilters]);

  // Función para obtener el badge de estado
  const getStatusBadge = useCallback((status) => {
    const statusConfig = {
      por_leer: { label: "Por leer", color: "bg-purple-100 text-purple-800" },
      leyendo: { label: "Leyendo", color: "bg-yellow-100 text-yellow-800" },
      leido: { label: "Leído", color: "bg-green-100 text-green-800" },
      abandonado: { label: "Abandonado", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  }, []);

  // Manejo de eliminación de libros
  const handleDeleteClick = useCallback((book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!bookToDelete || isDeletingBook) return;

    try {
      await deleteBook(bookToDelete.user_library_id);
      setShowDeleteModal(false);
      setBookToDelete(null);
      // React Query manejará automáticamente la actualización de la UI
    } catch (error) {
      console.error("Error deleting book:", error);
      // El error se mostrará a través del hook de React Query (deleteBookError)
    }
  }, [bookToDelete, deleteBook, isDeletingBook]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setBookToDelete(null);
  }, []);

  // Manejo de paginación
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header principal */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Mi Biblioteca
                </h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tu colección personal de libros
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Link
                  to="/dashboard/library/insights"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Insights
                </Link>
                <Link
                  to="/dashboard/library/add"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar libro
                </Link>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <LibraryFilters
            activeTab={activeTab}
            setActiveTab={handleTabChange}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showAdvancedSearch={showAdvancedSearch}
            setShowAdvancedSearch={setShowAdvancedSearch}
            quickGenreFilter={quickGenreFilter}
            setQuickGenreFilter={setQuickGenreFilter}
            advancedFilters={advancedFilters}
            updateAdvancedFilter={updateAdvancedFilter}
            resetFilters={handleResetFilters}
            onSearch={handleSearch}
            onApplyAdvancedFilters={handleApplyAdvancedFilters}
            globalStats={globalStats}
          />

          {/* Grid de libros */}
          <LibraryGrid
            library={library}
            loading={isLoading}
            error={
              isError ? error?.message || "Error al cargar los libros" : ""
            }
            onDelete={handleDeleteClick}
            getStatusBadge={getStatusBadge}
          />

          {/* Paginación */}
          <LibraryPagination
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">
                Eliminar libro
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Estás seguro de que quieres eliminar "{bookToDelete?.title}"
                  de tu biblioteca? Esta acción no se puede deshacer.
                </p>
                {deleteBookError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">
                      Error al eliminar el libro:{" "}
                      {deleteBookError.message || "Error desconocido"}
                    </p>
                  </div>
                )}
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    disabled={isDeletingBook}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={isDeletingBook}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isDeletingBook && (
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    )}
                    {isDeletingBook ? "Eliminando..." : "Eliminar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
