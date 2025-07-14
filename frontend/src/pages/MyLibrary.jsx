"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getUserLibrary,
  getReadingStats,
  removeFromLibrary,
  getRecommendations,
} from "../api/userLibrary";
import BookOpen from "../components/icons/BookOpen";
import TrendingUp from "../components/icons/TrendingUp";
import Calendar from "../components/icons/Calendar";
import Target from "../components/icons/Target";
import Plus from "../components/icons/Plus";
import Search from "../components/icons/Search";
import Edit from "../components/icons/Edit";
import Trash from "../components/icons/Trash";
import Star from "../components/icons/Star";
import CustomSelect from "../components/CustomSelect";
import CustomDatePicker from "../components/CustomDatePicker";

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
  const [advancedFilters, setAdvancedFilters] = useState({
    author: "",
    rating: "",
    year: "",
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });
  const [recommendations, setRecommendations] = useState(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  useEffect(() => {
    loadLibraryData();
    loadStats();
  }, []);

  // Efecto para búsqueda en tiempo real
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length >= 2 || searchTerm.length === 0) {
        const statusMap = {
          todos: null,
          por_leer: "por_leer",
          leyendo: "leyendo",
          leido: "leido",
          abandonado: "abandonado",
        };
        loadLibraryData(statusMap[activeTab], showAdvancedSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, activeTab, showAdvancedSearch]);

  const loadLibraryData = useCallback(
    async (status = null, useAdvancedFilters = false) => {
      try {
        setLoading(true);
        const params = status ? { status } : {};

        // Agregar filtros avanzados si están activos
        if (useAdvancedFilters || showAdvancedSearch) {
          if (searchTerm) params.search = searchTerm;
          if (advancedFilters.author) params.author = advancedFilters.author;
          if (advancedFilters.rating) params.rating = advancedFilters.rating;
          if (advancedFilters.year) params.year = advancedFilters.year;
          if (advancedFilters.sortBy) params.sortBy = advancedFilters.sortBy;
          if (advancedFilters.sortOrder)
            params.sortOrder = advancedFilters.sortOrder;
        } else if (searchTerm) {
          params.search = searchTerm;
        }

        const response = await getUserLibrary(params);
        setLibrary(response.books || []);
      } catch (error) {
        console.error("Error loading library:", error);
        setError("Error al cargar la biblioteca");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, showAdvancedSearch, advancedFilters],
  );

  const loadStats = async () => {
    try {
      const response = await getReadingStats();
      setStats(response);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await getRecommendations();
      console.log("Recommendations response:", response);
      setRecommendations(response);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      // En caso de error, mostrar un mensaje amigable
      setRecommendations({
        message: "Error al cargar recomendaciones. Intenta más tarde.",
        recommendedAuthors: [],
        readingGoals:
          "Agrega más libros a tu biblioteca y califícalos para recibir mejores recomendaciones.",
      });
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const statusMap = {
      todos: null,
      por_leer: "por_leer",
      leyendo: "leyendo",
      leido: "leido",
      abandonado: "abandonado",
    };
    loadLibraryData(statusMap[tab]);
  };

  const handleDeleteBook = async (bookId) => {
    try {
      await removeFromLibrary(bookId);
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

  const tabs = [
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
  ];

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

      {/* Tarjetas de estadisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Total
              </p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">
                {(stats?.por_leer || 0) +
                  (stats?.leyendo || 0) +
                  (stats?.leido || 0) +
                  (stats?.abandonado || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Leídos
              </p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">
                {stats?.leido || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Leyendo
              </p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">
                {stats?.leyendo || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <div className="flex items-center">
            <Target className="w-6 h-6 md:w-8 md:h-8 text-orange-600" />
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Por leer
              </p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">
                {stats?.por_leer || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 col-span-2 md:col-span-1">
          <div className="flex items-center">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 text-xs md:text-sm font-bold">
                ✕
              </span>
            </div>
            <div className="ml-3 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">
                Abandonados
              </p>
              <p className="text-lg md:text-2xl font-bold text-gray-900">
                {stats?.abandonado || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Recomendaciones */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recomendaciones Personalizadas
          </h2>
          <button
            onClick={() => {
              if (!showRecommendations) {
                loadRecommendations();
              }
              setShowRecommendations(!showRecommendations);
            }}
            className="btn btn-secondary text-sm"
          >
            {showRecommendations ? "Ocultar" : "Ver recomendaciones"}
          </button>
        </div>

        {showRecommendations && (
          <div className="space-y-4">
            {recommendations ? (
              <div>
                <p className="text-gray-600 mb-4">{recommendations.message}</p>

                {recommendations.recommendedAuthors &&
                recommendations.recommendedAuthors.length > 0 ? (
                  <div>
                    <h3 className="text-md font-medium text-gray-800 mb-3">
                      Autores recomendados para ti:
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {recommendations.recommendedAuthors.map(
                        (author, index) => (
                          <div
                            key={index}
                            className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                          >
                            <p className="font-medium text-blue-900">
                              {author.name}
                            </p>
                            <p className="text-sm text-blue-700">
                              {author.count} libro{author.count > 1 ? "s" : ""}{" "}
                              leído{author.count > 1 ? "s" : ""}
                            </p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">
                      {recommendations.readingGoals ||
                        "Lee más libros y califícalos para recibir recomendaciones personalizadas."}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-6">
                <div className="spinner border-gray-300 border-t-blue-600 mr-3"></div>
                <span className="text-gray-600">
                  Cargando recomendaciones...
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6">
        <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:justify-between">
          {/* Tabs */}
          <div className="overflow-x-auto">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-2 md:px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
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

          {/* Búsqueda y filtros avanzados */}
          <div className="flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-3 md:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar libros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                showAdvancedSearch
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Filtros avanzados
            </button>
          </div>
        </div>

        {/* Panel de filtros avanzados */}
        {showAdvancedSearch && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  setAdvancedFilters({
                    author: "",
                    rating: "",
                    year: "",
                    sortBy: "updatedAt",
                    sortOrder: "DESC",
                  });
                  setShowAdvancedSearch(false);
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
            <div
              key={userBook.user_library_id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-3 md:p-4 min-w-0"
            >
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
                    onClick={() => openDeleteModal(userBook)}
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
                    src={userBook.image_url}
                    alt={`Portada de ${userBook.title}`}
                    className="w-12 h-16 md:w-16 md:h-20 object-cover rounded-md flex-shrink-0"
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
                  <p className="text-xs md:text-sm text-gray-600 mb-1">
                    Notas:
                  </p>
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
                    Terminado:{" "}
                    {new Date(userBook.finishedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Modal */}
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
