import { useState, useEffect, useCallback, useRef } from "react";
import {
  getUserLibrary,
  getReadingStats,
  removeFromLibrary,
} from "../api/userLibrary";

export const useLibrary = () => {
  const [library, setLibrary] = useState([]);
  const [stats, setStats] = useState({});
  const [globalStats, setGlobalStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  const booksPerPage = 15;
  const loadingRef = useRef(false);
  const searchCacheRef = useRef(new Map());

  const loadLibraryData = useCallback(
    async (params = {}) => {
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);
        setError("");

        const queryParams = {
          page: currentPage,
          limit: booksPerPage,
          ...params,
        };

        // Crear clave de cache
        const cacheKey = JSON.stringify(queryParams);

        // Verificar cache
        if (searchCacheRef.current.has(cacheKey)) {
          const cachedResult = searchCacheRef.current.get(cacheKey);
          const cacheAge = Date.now() - cachedResult.timestamp;

          if (cacheAge < 120000) {
            // 2 minutos
            setLibrary(cachedResult.data.books || []);
            if (cachedResult.data.pagination) {
              setTotalPages(cachedResult.data.pagination.totalPages || 1);
              setTotalBooks(cachedResult.data.pagination.totalBooks || 0);
            }
            setLoading(false);
            loadingRef.current = false;
            return;
          }
        }

        const response = await getUserLibrary(queryParams);
        setLibrary(response.books || []);

        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalBooks(response.pagination.totalBooks || 0);
        }

        // Guardar en cache (límite de 50 entradas)
        if (searchCacheRef.current.size >= 50) {
          const firstKey = searchCacheRef.current.keys().next().value;
          searchCacheRef.current.delete(firstKey);
        }
        searchCacheRef.current.set(cacheKey, {
          data: response,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Error loading library:", error);
        setError("Error al cargar la biblioteca");
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [currentPage, booksPerPage],
  );

  const loadStats = useCallback(async () => {
    try {
      const response = await getReadingStats();
      setStats(response);

      // Calcular estadísticas globales separadas para el header
      const globalTotals = {
        total:
          (response.por_leer || 0) +
          (response.leyendo || 0) +
          (response.leido || 0) +
          (response.abandonado || 0),
        toRead: response.por_leer || 0,
        reading: response.leyendo || 0,
        read: response.leido || 0,
        abandoned: response.abandonado || 0,
      };
      setGlobalStats(globalTotals);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  }, []);

  const deleteBook = useCallback(
    async (bookId) => {
      try {
        await removeFromLibrary(bookId);
        // Recargar datos después de eliminar
        await loadLibraryData();
        return { success: true };
      } catch (error) {
        console.error("Error deleting book:", error);
        return { success: false, error: "Error al eliminar el libro" };
      }
    },
    [loadLibraryData],
  );

  const refreshLibrary = useCallback(() => {
    // Limpiar cache y recargar
    searchCacheRef.current.clear();
    loadLibraryData();
  }, [loadLibraryData]);

  useEffect(() => {
    loadLibraryData();
    loadStats();

    const currentSearchCache = searchCacheRef.current;
    return () => {
      loadingRef.current = false;
      currentSearchCache.clear();
    };
  }, [loadLibraryData, loadStats]);

  return {
    // Estado
    library,
    stats,
    globalStats,
    loading,
    error,
    currentPage,
    totalPages,
    totalBooks,
    booksPerPage,

    // Acciones
    loadLibraryData,
    deleteBook,
    refreshLibrary,
    setCurrentPage,
    setError,
  };
};
