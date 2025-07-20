import { useState, useCallback, useEffect } from "react";
import { useLibrary } from "../hooks/useLibrary";
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

  // Custom hooks
  const {
    library,
    stats,
    globalStats,
    loading,
    error,
    currentPage,
    totalPages,
    totalBooks,
    booksPerPage,
    loadLibraryData,
    deleteBook,
    setCurrentPage,
    setError,
  } = useLibrary();

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
  } = useLibraryFilters();

  // Función para manejar búsqueda con filtros
  const handleSearch = useCallback(() => {
    const filterParams = getFilterParams();
    loadLibraryData(filterParams);
  }, [getFilterParams, loadLibraryData]);

  // Efecto para cargar datos cuando cambien los filtros
  useEffect(() => {
    handleSearch();
  }, [activeTab, quickGenreFilter, showAdvancedSearch, advancedFilters]);

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
    if (!bookToDelete) return;

    try {
      const result = await deleteBook(bookToDelete.user_library_id);
      if (result.success) {
        setShowDeleteModal(false);
        setBookToDelete(null);
        // Mostrar mensaje de éxito (aquí podrías integrar un sistema de notificaciones)
        console.log("Libro eliminado exitosamente");
      } else {
        setError(result.error || "Error al eliminar el libro");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      setError("Error al eliminar el libro");
    }
  }, [bookToDelete, deleteBook, setError]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
    setBookToDelete(null);
  }, []);

  // Manejo de paginación
  const handlePageChange = useCallback(
    (newPage) => {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setCurrentPage],
  );

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
            setActiveTab={setActiveTab}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showAdvancedSearch={showAdvancedSearch}
            setShowAdvancedSearch={setShowAdvancedSearch}
            quickGenreFilter={quickGenreFilter}
            setQuickGenreFilter={setQuickGenreFilter}
            advancedFilters={advancedFilters}
            updateAdvancedFilter={updateAdvancedFilter}
            resetFilters={resetFilters}
            onSearch={handleSearch}
            globalStats={globalStats}
          />

          {/* Grid de libros */}
          <LibraryGrid
            library={library}
            loading={loading}
            error={error}
            onDelete={handleDeleteClick}
            getStatusBadge={getStatusBadge}
          />

          {/* Paginación */}
          <LibraryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalBooks={totalBooks}
            booksPerPage={booksPerPage}
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
              </div>
              <div className="items-center px-4 py-3">
                <div className="flex space-x-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300"
                  >
                    Eliminar
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
