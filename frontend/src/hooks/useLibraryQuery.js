import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserLibrary,
  getReadingStats,
  removeFromLibrary,
} from "../api/userLibrary";

// Constante para el tamaño de página por defecto
const DEFAULT_BOOKS_PER_PAGE = 12;

// Hook principal para la biblioteca con React Query
// NOTA: Para añadir/actualizar libros, usa useAddToLibrary y useUpdateLibraryBook
export const useLibraryQuery = (
  filters = {},
  page = 1,
  limit = DEFAULT_BOOKS_PER_PAGE,
) => {
  const queryClient = useQueryClient();

  // Query key que incluye todos los filtros y paginación
  const queryKey = ["library", { ...filters, page, limit }];

  // Query para obtener los libros de la biblioteca
  const libraryQuery = useQuery({
    queryKey,
    queryFn: () => getUserLibrary({ ...filters, page, limit }),
    placeholderData: (previousData) => previousData, // Mantener datos anteriores mientras carga nuevos
    staleTime: 2 * 60 * 1000, // 2 minutos para los datos de la biblioteca
  });

  // Query separada para las estadísticas (menos frecuente)
  const statsQuery = useQuery({
    queryKey: ["libraryStats"],
    queryFn: getReadingStats,
    staleTime: 5 * 60 * 1000, // 5 minutos para las estadísticas
  });

  // Mutation para eliminar un libro - Mantenido para compatibilidad temporal
  const deleteBookMutation = useMutation({
    mutationFn: removeFromLibrary,
    onSuccess: () => {
      // Invalidar y refrescar las queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["library"] });
      queryClient.invalidateQueries({ queryKey: ["libraryStats"] });
    },
  });

  // Calcular estadísticas globales
  const globalStats = statsQuery.data
    ? {
        total:
          (statsQuery.data.por_leer || 0) +
          (statsQuery.data.leyendo || 0) +
          (statsQuery.data.leido || 0) +
          (statsQuery.data.abandonado || 0),
        toRead: statsQuery.data.por_leer || 0,
        reading: statsQuery.data.leyendo || 0,
        read: statsQuery.data.leido || 0,
        abandoned: statsQuery.data.abandonado || 0,
      }
    : {};

  return {
    // Datos
    library: libraryQuery.data?.books || [],
    pagination: libraryQuery.data?.pagination || {
      currentPage: page,
      totalPages: 1,
      totalBooks: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    stats: statsQuery.data || {},
    globalStats,

    // Estados de carga
    isLoading: libraryQuery.isLoading,
    isLoadingStats: statsQuery.isLoading,
    isFetching: libraryQuery.isFetching,
    isError: libraryQuery.isError || statsQuery.isError,
    error: libraryQuery.error || statsQuery.error,

    // Acciones de eliminación (mantenido para compatibilidad)
    deleteBook: deleteBookMutation.mutate,
    isDeletingBook: deleteBookMutation.isPending,
    deleteBookError: deleteBookMutation.error,

    // Funciones de refetch
    refetch: libraryQuery.refetch,
    refetchStats: statsQuery.refetch,
  };
};

// Hook simplificado para usar en componentes
export const useLibraryWithFilters = (
  activeTab,
  searchTerm,
  otherFilters,
  currentPage,
) => {
  const filters = {};

  // Aplicar filtros
  if (activeTab !== "todos") {
    filters.status = activeTab;
  }

  if (searchTerm && searchTerm.trim().length >= 2) {
    filters.search = searchTerm.trim();
  }

  // Combinar con otros filtros
  Object.assign(filters, otherFilters);

  return useLibraryQuery(filters, currentPage, DEFAULT_BOOKS_PER_PAGE);
};
