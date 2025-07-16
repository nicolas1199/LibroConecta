"use client";

import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { Link } from "react-router-dom";
import {
  getUserLibrary,
  getReadingStats,
  removeFromLibrary,
} from "../api/userLibrary";

import BookOpen from "../components/icons/BookOpen";
import TrendingUp from "../components/icons/TrendingUp";

import Plus from "../components/icons/Plus";
import Search from "../components/icons/Search";
import Edit from "../components/icons/Edit";
import Trash from "../components/icons/Trash";
import Star from "../components/icons/Star";
import CustomSelect from "../components/CustomSelect";
import SearchableSelect from "../components/SearchableSelect";
import { BOOK_GENRES } from "../utils/constants";

// Componente memoizado para las tarjetas de libros
const BookCard = memo(({ userBook, onEdit, onDelete, getStatusBadge }) => {
  const imageRef = useRef(null);

  useEffect(() => {
    const img = imageRef.current;
    if (img && img.dataset.src) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const target = entry.target;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                target.removeAttribute("data-src");
                observer.unobserve(target);
              }
            }
          });
        },
        { rootMargin: "50px" },
      );
      observer.observe(img);
      return () => observer.disconnect();
    }
  }, [userBook.image_url]);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-3 md:p-4 min-w-0">
      <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm md:text-base leading-tight">
            {userBook.title}
          </h3>
          <p className="text-xs md:text-sm text-gray-600 truncate">
            {userBook.author}
          </p>
        </div>
        <div className="flex space-x-1 flex-shrink-0">
          <Link
            to={`/dashboard/library/edit/${userBook.user_library_id}`}
            className="p-1.5 md:p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
          >
            <Edit className="w-3 h-3 md:w-4 md:h-4" />
          </Link>
          <button
            onClick={() => onDelete(userBook)}
            className="p-1.5 md:p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash className="w-3 h-3 md:w-4 md:h-4" />
          </button>
        </div>
      </div>

      {/* Detalles del libro */}
      <div className="flex gap-2 md:gap-3 mb-3 md:mb-4">
        {userBook.image_url ? (
          <img
            ref={imageRef}
            data-src={userBook.image_url}
            alt={`Portada de ${userBook.title}`}
            className="w-12 h-16 md:w-16 md:h-20 object-cover rounded-md flex-shrink-0 bg-gray-100"
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="w-12 h-16 md:w-16 md:h-20 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center">
            <BookOpen className="w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1 md:space-y-1.5">
          {userBook.isbn && (
            <p className="text-xs text-gray-500 truncate">
              ISBN: {userBook.isbn}
            </p>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-xs md:text-sm text-gray-600 flex-shrink-0">
              Estado:
            </span>
            <div className="flex-shrink-0">
              {getStatusBadge(userBook.reading_status)}
            </div>
          </div>
          {userBook.rating && (
            <div className="flex flex-col gap-1">
              <span className="text-xs md:text-sm text-gray-600 flex-shrink-0">
                Valoración:
              </span>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 ${i < userBook.rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {userBook.review && (
        <div className="mb-3 md:mb-4">
          <p className="text-xs md:text-sm text-gray-600 mb-1">Notas:</p>
          <p className="text-xs md:text-sm text-gray-800 bg-gray-50 p-2 rounded leading-relaxed">
            {userBook.review.length > 80
              ? `${userBook.review.substring(0, 80)}...`
              : userBook.review}
          </p>
        </div>
      )}

      <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
        <span className="truncate">
          Agregado: {new Date(userBook.createdAt).toLocaleDateString()}
        </span>
        {userBook.finishedAt && (
          <span className="truncate ml-2">
            Terminado: {new Date(userBook.finishedAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
});

BookCard.displayName = "BookCard";

export default function MyLibrary() {
  const [library, setLibrary] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [quickGenreFilter, setQuickGenreFilter] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    author: "",
    rating: "",
    year: "",
    genre: "",
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [booksPerPage] = useState(4);

  // Referencias para optimización
  const loadingRef = useRef(false);
  const searchTimeoutRef = useRef(null);
  const searchCacheRef = useRef(new Map()); // Cache para resultados de búsqueda
  const imageObserverRef = useRef(null);

  // Configurar Intersection Observer para lazy loading de imágenes
  useEffect(() => {
    imageObserverRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const realSrc = img.dataset.src;
            if (realSrc) {
              img.src = realSrc;
              img.removeAttribute("data-src");
              imageObserverRef.current?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: "50px" },
    );

    return () => {
      imageObserverRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    loadLibraryData();
    loadStats();

    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      loadingRef.current = false;
      // Limpiar cache al desmontar componente
      searchCacheRef.current.clear();
    };
  }, []);

  const loadLibraryData = useCallback(
    async (status = null, useAdvancedFilters = false) => {
      // Evitar múltiples llamadas simultáneas
      if (loadingRef.current) return;

      try {
        loadingRef.current = true;
        setLoading(true);

        const params = status ? { status } : {};

        // Agregar filtros avanzados si están activos
        if (useAdvancedFilters || showAdvancedSearch) {
          if (searchTerm) params.search = searchTerm;
          if (advancedFilters.author) params.author = advancedFilters.author;
          if (advancedFilters.rating) params.rating = advancedFilters.rating;
          if (advancedFilters.year) params.year = advancedFilters.year;
          if (advancedFilters.genre) params.genre = advancedFilters.genre;
          if (advancedFilters.sortBy) params.sortBy = advancedFilters.sortBy;
          if (advancedFilters.sortOrder)
            params.sortOrder = advancedFilters.sortOrder;
        } else {
          // Para búsqueda normal, incluir término de búsqueda y filtro rápido de género
          if (searchTerm) params.search = searchTerm;
          if (quickGenreFilter) params.genre = quickGenreFilter;
        }

        // Agregar parámetros de paginación
        params.page = currentPage;
        params.limit = booksPerPage;

        // Crear clave de cache
        const cacheKey = JSON.stringify(params);

        // Verificar cache primero (solo para consultas no críticas)
        if (searchCacheRef.current.has(cacheKey) && !useAdvancedFilters) {
          const cachedResult = searchCacheRef.current.get(cacheKey);
          const cacheAge = Date.now() - cachedResult.timestamp;

          // Usar cache si tiene menos de 2 minutos
          if (cacheAge < 120000) {
            setLibrary(cachedResult.data.books || []);
            if (cachedResult.data.pagination) {
              setTotalPages(cachedResult.data.pagination.totalPages || 1);
              setTotalBooks(cachedResult.data.pagination.totalBooks || 0);
            }
            return;
          }
        }

        const response = await getUserLibrary(params);
        setLibrary(response.books || []);

        // Actualizar información de paginación
        if (response.pagination) {
          setTotalPages(response.pagination.totalPages || 1);
          setTotalBooks(response.pagination.totalBooks || 0);
        }

        // Guardar en cache (límite de 50 entradas para evitar memory leaks)
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
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [
      searchTerm,
      showAdvancedSearch,
      advancedFilters,
      quickGenreFilter,
      currentPage,
      booksPerPage,
    ],
  );

  // Efecto optimizado para búsqueda en tiempo real y filtros
  useEffect(() => {
    // Limpiar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Evitar búsquedas innecesarias
    if (loadingRef.current) return;

    // Si están activos los filtros avanzados, no aplicar filtros automáticos
    if (showAdvancedSearch) {
      return; // No hacer nada, esperar a que se presione "Aplicar filtros"
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        const statusMap = {
          todos: null,
          por_leer: "por_leer",
          leyendo: "leyendo",
          leido: "leido",
          abandonado: "abandonado",
        };

        loadLibraryData(statusMap[activeTab], false);
      }
    }, 500); // Aumentar debounce a 500ms para menos llamadas

    // Cleanup
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [
    searchTerm,
    quickGenreFilter,
    activeTab,
    showAdvancedSearch,
    loadLibraryData,
  ]);

  // Efecto para resetear la página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, quickGenreFilter, activeTab, advancedFilters]);

  const loadStats = async () => {
    try {
      const response = await getReadingStats();
      setStats(response);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleTabChange = useCallback(
    (tab) => {
      // Cancelar búsquedas pendientes
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      setActiveTab(tab);
      setCurrentPage(1); // Resetear página al cambiar tab

      const statusMap = {
        todos: null,
        por_leer: "por_leer",
        leyendo: "leyendo",
        leido: "leido",
        abandonado: "abandonado",
      };

      // Llamar con debounce mínimo para cambios de tab
      searchTimeoutRef.current = setTimeout(() => {
        loadLibraryData(statusMap[tab]);
      }, 100);
    },
    [loadLibraryData],
  );

  const handleDeleteBook = async (bookId) => {
    try {
      await removeFromLibrary(bookId);

      // Limpiar cache después de eliminar un libro
      searchCacheRef.current.clear();

      const statusMap = {
        todos: null,
        por_leer: "por_leer",
        leyendo: "leyendo",
        leido: "leido",
        abandonado: "abandonado",
      };
      await Promise.all([loadLibraryData(statusMap[activeTab]), loadStats()]);
      setShowDeleteModal(false);
      setBookToDelete(null);
    } catch (error) {
      console.error("Error removing book:", error);
    }
  };

  const openDeleteModal = (book) => {
    setBookToDelete(book);
    setShowDeleteModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      por_leer: {
        label: "Quiero leer",
        color: "bg-blue-100 text-blue-800",
      },
      leyendo: { label: "Leyendo", color: "bg-green-100 text-green-800" },
      leido: { label: "Leído", color: "bg-purple-100 text-purple-800" },
      abandonado: { label: "Abandonado", color: "bg-red-100 text-red-800" },
    };
    const statusInfo = statusMap[status] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  // Memoizar tabs para evitar recálculos
  const tabs = useMemo(
    () => [
      {
        id: "todos",
        label: "Todos",
        count:
          (stats?.por_leer || 0) +
          (stats?.leyendo || 0) +
          (stats?.leido || 0) +
          (stats?.abandonado || 0),
      },
      {
        id: "por_leer",
        label: "Quiero leer",
        count: stats?.por_leer || 0,
      },
      { id: "leyendo", label: "Leyendo", count: stats?.leyendo || 0 },
      { id: "leido", label: "Leídos", count: stats?.leido || 0 },
      { id: "abandonado", label: "Abandonados", count: stats?.abandonado || 0 },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Mi Biblioteca
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Gestiona tu colección personal de libros
          </p>
        </div>
        <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-3">
          <Link
            to="/dashboard/library/insights"
            className="btn btn-secondary text-sm md:text-base"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Insights
          </Link>
          <Link
            to="/dashboard/library/add"
            className="btn btn-primary text-sm md:text-base"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Libro
          </Link>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        {/* Layout responsivo mejorado */}
        <div className="space-y-4">
          {/* Tabs con scroll horizontal en móvil - ancho automático */}
          <div className="overflow-x-auto">
            <div className="inline-flex space-x-1 bg-gray-100 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
          </div>

          {/* Controles de filtros - stack en móvil, fila en desktop */}
          <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
            {/* Filtro rápido de género - solo si NO están activos los filtros avanzados */}
            {!showAdvancedSearch && (
              <div className="w-full lg:w-48 flex-shrink-0">
                <SearchableSelect
                  label=""
                  value={quickGenreFilter}
                  onChange={(value) => {
                    // Cancelar búsqueda anterior si existe
                    if (searchTimeoutRef.current) {
                      clearTimeout(searchTimeoutRef.current);
                    }

                    setQuickGenreFilter(value);
                    // La página se resetea automáticamente por el useEffect

                    // Aplicar filtro con debounce optimizado
                    searchTimeoutRef.current = setTimeout(() => {
                      const statusMap = {
                        todos: null,
                        por_leer: "por_leer",
                        leyendo: "leyendo",
                        leido: "leido",
                        abandonado: "abandonado",
                      };

                      const params = statusMap[activeTab]
                        ? { status: statusMap[activeTab] }
                        : {};
                      if (searchTerm) params.search = searchTerm;
                      if (value) params.genre = value;
                      params.page = 1; // Siempre empezar en página 1
                      params.limit = booksPerPage;
                      params.sortBy = "updatedAt";
                      params.sortOrder = "DESC";

                      // Evitar llamada si ya está cargando
                      if (!loadingRef.current) {
                        loadingRef.current = true;
                        setLoading(true);
                        getUserLibrary(params)
                          .then((response) => {
                            setLibrary(response.books || []);
                            if (response.pagination) {
                              setTotalPages(
                                response.pagination.totalPages || 1,
                              );
                              setTotalBooks(
                                response.pagination.totalBooks || 0,
                              );
                            }
                          })
                          .catch((error) => {
                            console.error(
                              "Error loading library with quick filter:",
                              error,
                            );
                            setError("Error al cargar la biblioteca");
                          })
                          .finally(() => {
                            loadingRef.current = false;
                            setLoading(false);
                          });
                      }
                    }, 200); // Debounce más corto para filtros directos
                  }}
                  options={[
                    { value: "", label: "Todos los géneros" },
                    ...BOOK_GENRES.sort().map((genre) => ({
                      value: genre,
                      label: genre,
                    })),
                  ]}
                  placeholder="Filtrar por género"
                  searchPlaceholder="Buscar género..."
                  className="w-full"
                />
              </div>
            )}

            {/* Contenedor de búsqueda y filtros avanzados */}
            <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 lg:flex-1">
              {/* Búsqueda */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Buscar libros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>

              {/* Botón filtros avanzados */}
              <button
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  showAdvancedSearch
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="hidden sm:inline">Filtros avanzados</span>
                <span className="sm:hidden">Filtros avanzados</span>
              </button>
            </div>
          </div>
        </div>

        {/* Panel de filtros avanzados */}
        {showAdvancedSearch && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor específico
                </label>
                <input
                  type="text"
                  placeholder="Buscar por autor..."
                  value={advancedFilters.author}
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      author: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>

              <div>
                <SearchableSelect
                  label="Género"
                  value={advancedFilters.genre}
                  onChange={(value) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      genre: value,
                    }))
                  }
                  options={[
                    { value: "", label: "Todos los géneros" },
                    ...BOOK_GENRES.sort().map((genre) => ({
                      value: genre,
                      label: genre,
                    })),
                  ]}
                  placeholder="Seleccionar género"
                  searchPlaceholder="Buscar género..."
                />
              </div>

              <div>
                <CustomSelect
                  label="Calificación mínima"
                  value={advancedFilters.rating}
                  onChange={(value) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      rating: value,
                    }))
                  }
                  options={[
                    { value: "", label: "Todas las calificaciones" },
                    { value: "5", label: "5 estrellas" },
                    { value: "4", label: "4+ estrellas" },
                    { value: "3", label: "3+ estrellas" },
                    { value: "2", label: "2+ estrellas" },
                    { value: "1", label: "1+ estrella" },
                  ]}
                  placeholder="Seleccionar calificación"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año de publicación
                </label>
                <input
                  type="number"
                  placeholder="Ej: 2020"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={advancedFilters.year}
                  onChange={(e) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      year: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <CustomSelect
                  label="Ordenar por"
                  value={advancedFilters.sortBy}
                  onChange={(value) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      sortBy: value,
                    }))
                  }
                  options={[
                    { value: "updatedAt", label: "Última actualización" },
                    { value: "title", label: "Título" },
                    { value: "author", label: "Autor" },
                    { value: "rating", label: "Calificación" },
                    { value: "date_started", label: "Fecha de inicio" },
                    { value: "date_finished", label: "Fecha de finalización" },
                  ]}
                  placeholder="Seleccionar ordenamiento"
                />
              </div>

              <div>
                <CustomSelect
                  label="Orden"
                  value={advancedFilters.sortOrder}
                  onChange={(value) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      sortOrder: value,
                    }))
                  }
                  options={[
                    { value: "DESC", label: "Descendente" },
                    { value: "ASC", label: "Ascendente" },
                  ]}
                  placeholder="Seleccionar orden"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mt-4">
              <button
                onClick={() => {
                  // La página se resetea automáticamente por el useEffect
                  const statusMap = {
                    todos: null,
                    por_leer: "por_leer",
                    leyendo: "leyendo",
                    leido: "leido",
                    abandonado: "abandonado",
                  };
                  loadLibraryData(statusMap[activeTab], true);
                }}
                className="btn btn-primary"
              >
                Aplicar filtros
              </button>
              <button
                onClick={() => {
                  // Limpiar cache al resetear filtros
                  searchCacheRef.current.clear();

                  setAdvancedFilters({
                    author: "",
                    rating: "",
                    year: "",
                    genre: "",
                    sortBy: "updatedAt",
                    sortOrder: "DESC",
                  });
                  setQuickGenreFilter(""); // Limpiar también el filtro rápido
                  setShowAdvancedSearch(false);
                  // La página se resetea automáticamente por el useEffect

                  const statusMap = {
                    todos: null,
                    por_leer: "por_leer",
                    leyendo: "leyendo",
                    leido: "leido",
                    abandonado: "abandonado",
                  };
                  loadLibraryData(statusMap[activeTab]);
                }}
                className="btn btn-secondary"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Books Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="spinner border-gray-300 border-t-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      ) : library.length === 0 ? (
        <div className="text-center py-8 md:py-12">
          <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">
            {searchTerm
              ? "No se encontraron libros"
              : "Tu biblioteca está vacía"}
          </h3>
          <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 px-4">
            {searchTerm
              ? "Intenta con otros términos de búsqueda"
              : "Comienza agregando libros a tu biblioteca personal"}
          </p>
          {!searchTerm && (
            <Link
              to="/dashboard/library/add"
              className="btn btn-primary text-sm md:text-base"
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar tu primer libro
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
          {library.map((userBook) => (
            <BookCard
              key={userBook.user_library_id}
              userBook={userBook}
              onEdit={() => {}} // Manejado por Link interno
              onDelete={openDeleteModal}
              getStatusBadge={getStatusBadge}
            />
          ))}
        </div>
      )}

      {/* Paginación */}
      {library.length > 0 && totalPages > 1 && (
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mt-6 p-4 bg-white rounded-lg shadow">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            Mostrando {(currentPage - 1) * booksPerPage + 1} -{" "}
            {Math.min(currentPage * booksPerPage, totalBooks)} de {totalBooks}{" "}
            libros
          </div>

          <div className="flex items-center justify-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Anterior</span>
              <span className="sm:hidden">‹</span>
            </button>

            <div className="flex items-center space-x-1">
              {/* Primera página */}
              {currentPage > 3 && (
                <>
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    1
                  </button>
                  {currentPage > 4 && (
                    <span className="px-1 sm:px-2 text-gray-500">...</span>
                  )}
                </>
              )}

              {/* Páginas alrededor de la actual */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                if (pageNum < 1 || pageNum > totalPages) return null;

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 sm:px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white border border-blue-600"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Última página */}
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && (
                    <span className="px-1 sm:px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-2 sm:px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <span className="sm:hidden">›</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que quieres eliminar &quot;
              {bookToDelete
                ? bookToDelete["title"] || "este libro"
                : "este libro"}
              &quot; de tu biblioteca? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleDeleteBook(
                    bookToDelete ? bookToDelete["user_library_id"] || 0 : 0,
                  )
                }
                className="btn btn-danger"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
