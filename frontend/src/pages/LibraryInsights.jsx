"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getLibraryInsights,
  getReadingStats,
  getRecommendations,
  getUserLibrary,
} from "../api/userLibrary";
import { getGoogleBooksRecommendations } from "../services/googleBooks";
import ArrowLeft from "../components/icons/ArrowLeft";
import BookOpen from "../components/icons/BookOpen";
import TrendingUp from "../components/icons/TrendingUp";
import Calendar from "../components/icons/Calendar";
import BarChart from "../components/icons/BarChart";
import Star from "../components/icons/Star";

export default function LibraryInsights() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState({});
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState(null);
  const [googleRecommendations, setGoogleRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [library, setLibrary] = useState([]);
  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [insightsResponse, statsResponse] = await Promise.all([
        getLibraryInsights(),
        getReadingStats(),
      ]);

      setInsights(insightsResponse);
      setStats(statsResponse);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendationsData = async () => {
    try {
      setLoadingRecommendations(true);
      setShowAllRecommendations(false);

      // 1. Obtener análisis de preferencias del backend
      const response = await getRecommendations();
      setRecommendations(response);

      // 2. Si tenemos datos para usar Google Books, obtener recomendaciones
      if (response.useGoogleBooks && response.searchQueries?.length > 0) {
        // Obtener la biblioteca del usuario para filtrar
        const libraryResponse = await getUserLibrary();
        setLibrary(libraryResponse.books || libraryResponse);

        // Obtener títulos de libros del usuario para filtrar
        const booksArray = libraryResponse.books || libraryResponse;
        const userBookTitles = Array.isArray(booksArray)
          ? booksArray.map((book) => book.title)
          : [];

        const googleBooks = await getGoogleBooksRecommendations(
          response.searchQueries,
          userBookTitles,
        );
        setGoogleRecommendations(googleBooks);
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      // En caso de error, mostrar un mensaje amigable
      setRecommendations({
        message: "Error al cargar recomendaciones. Intenta más tarde.",
        useGoogleBooks: false,
        favoriteAuthors: [],
        readingGoals:
          "Agrega más libros a tu biblioteca y califícalos para recibir mejores recomendaciones.",
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate("/dashboard/library")}
          className="btn btn-secondary mt-4"
        >
          Volver a biblioteca
        </button>
      </div>
    );
  }

  // Calcular totales con verificaciones defensivas
  const totalBooks =
    (stats["por_leer"] || 0) +
    (stats["leyendo"] || 0) +
    (stats["leido"] || 0) +
    (stats["abandonado"] || 0);

  const currentYear = new Date().getFullYear().toString();
  const readThisYear =
    stats["monthlyReading"] && Array.isArray(stats["monthlyReading"])
      ? stats["monthlyReading"]
          .filter((month) => month.month && month.month.startsWith(currentYear))
          .reduce((sum, month) => sum + (month.count || 0), 0)
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/dashboard/library")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Insights de tu biblioteca
          </h1>
          <p className="text-gray-600">
            Análisis detallado de tus hábitos de lectura
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total de libros
              </p>
              <p className="text-2xl font-bold text-gray-900">{totalBooks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Libros leídos</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats["leido"] || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Tiempo promedio
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {insights["averageReadingDays"] &&
                insights["averageReadingDays"] > 0
                  ? `${insights["averageReadingDays"]} días`
                  : "Sin libros leídos"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Valoración promedio
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats["averageRating"] || "N/A"}
                {stats["averageRating"] && (
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    /5
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <BarChart className="w-5 h-5 inline mr-2" />
            Estado de libros
          </h3>
          <div className="space-y-3">
            {[
              {
                status: "por_leer",
                label: "Quiero leer",
                color: "bg-blue-500",
              },
              { status: "leyendo", label: "Leyendo", color: "bg-green-500" },
              { status: "leido", label: "Leído", color: "bg-purple-500" },
              {
                status: "abandonado",
                label: "Abandonado",
                color: "bg-red-500",
              },
            ].map((item) => {
              const count = stats[item.status] || 0;
              const percentage =
                totalBooks > 0 ? ((count / totalBooks) * 100).toFixed(1) : 0;

              return (
                <div key={item.status} className="flex items-center">
                  <div className={`w-4 h-4 rounded ${item.color} mr-3`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className="text-sm text-gray-500">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="mt-1 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Reading Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            <Calendar className="w-5 h-5 inline mr-2" />
            Lectura mensual
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Libros leídos este año
                </span>
                <span className="text-sm text-gray-500">{readThisYear}</span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-500 h-3 rounded-full"
                  style={{
                    width: `${Math.min((readThisYear / 12) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Meta: 12 libros al año
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Libros en progreso
                </span>
                <span className="text-sm text-gray-500">
                  {stats["leyendo"] || 0}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full"
                  style={{
                    width: `${Math.min(((stats["leyendo"] || 0) / 3) * 100, 100)}%`,
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recomendado: máximo 3 libros simultáneos
              </p>
            </div>

            {stats["monthlyReading"] &&
              Array.isArray(stats["monthlyReading"]) &&
              stats["monthlyReading"].length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Últimos meses
                  </h4>
                  <div className="space-y-2">
                    {stats["monthlyReading"].slice(0, 6).map((month) => (
                      <div
                        key={month.month}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600">{month.month}</span>
                        <span className="font-medium">
                          {month.count} libros
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Top Authors */}
      {insights["topAuthors"] &&
        Array.isArray(insights["topAuthors"]) &&
        insights["topAuthors"].length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Autores favoritos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights["topAuthors"].map((author, index) => (
                <div
                  key={author.name}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {author.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {author.count} libro{author.count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Insights Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resumen de insights
        </h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Total de libros:</span> {totalBooks}{" "}
              libros en tu biblioteca
            </p>
          </div>
          {(stats["ratedBooks"] || 0) > 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Valoraciones:</span> Has valorado{" "}
                {stats["ratedBooks"]} libros con un promedio de{" "}
                {stats["averageRating"]}/5
              </p>
            </div>
          )}
          {(insights["averageReadingDays"] || 0) > 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Velocidad de lectura:</span>{" "}
                Tardas en promedio {insights["averageReadingDays"]} días en
                terminar un libro
              </p>
            </div>
          )}
          {readThisYear > 0 && (
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">Progreso anual:</span> Has leído{" "}
                {readThisYear} libros este año
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Sección de Recomendaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recomendaciones</h2>
          <button
            onClick={loadRecommendationsData}
            disabled={loadingRecommendations}
            className="btn btn-primary text-sm"
          >
            {loadingRecommendations ? "Cargando..." : "Obtener recomendaciones"}
          </button>
        </div>

        {loadingRecommendations && (
          <div className="flex items-center justify-center py-8">
            <div className="spinner border-gray-300 border-t-blue-600 mr-3"></div>
            <span className="text-gray-600">
              Analizando tus preferencias y buscando recomendaciones...
            </span>
          </div>
        )}

        {recommendations && !loadingRecommendations && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 font-medium">
                💡 {recommendations.message}
              </p>
            </div>

            {/* Recomendaciones de Google Books */}
            {googleRecommendations && googleRecommendations.length > 0 ? (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                  📚 Libros recomendados para ti
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {(showAllRecommendations
                    ? googleRecommendations
                    : googleRecommendations.slice(0, 8)
                  ).map((book, index) => (
                    <div
                      key={`${book.googleId}-${index}`}
                      className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200 hover:scale-105"
                    >
                      <div className="flex gap-3">
                        {book.thumbnail ? (
                          <img
                            src={book.thumbnail}
                            alt={`Portada de ${book.title}`}
                            className="w-16 h-20 object-cover rounded-md flex-shrink-0 shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="w-16 h-20 bg-blue-100 rounded-md flex-shrink-0 flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-blue-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-blue-900 line-clamp-2 leading-tight text-sm mb-1">
                            {book.title}
                          </h4>
                          <p className="text-sm text-blue-700 mb-2 truncate">
                            {book.author}
                          </p>
                          {book.averageRating && (
                            <div className="flex items-center gap-1 mb-2">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < Math.floor(book.averageRating)
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-xs text-gray-600">
                                {book.averageRating.toFixed(1)}
                                {book.ratingsCount && ` (${book.ratingsCount})`}
                              </span>
                            </div>
                          )}
                          {book.mainGenre && (
                            <p className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full mb-1 inline-block">
                              {book.mainGenre}
                            </p>
                          )}
                          {book.reason && (
                            <p className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full line-clamp-1">
                              {book.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {googleRecommendations.length > 8 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() =>
                        setShowAllRecommendations(!showAllRecommendations)
                      }
                      className="btn btn-secondary text-sm"
                    >
                      {showAllRecommendations
                        ? "Ver menos recomendaciones"
                        : "Ver más recomendaciones"}
                    </button>
                  </div>
                )}
              </div>
            ) : null}

            {/* Fallback: Autores favoritos si no hay recomendaciones de Google Books */}
            {(!googleRecommendations || googleRecommendations.length === 0) &&
            recommendations.favoriteAuthors &&
            recommendations.favoriteAuthors.length > 0 ? (
              <div>
                <h3 className="text-md font-medium text-gray-800 mb-3">
                  ✍️ Tus autores favoritos
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {recommendations.favoriteAuthors.map((author, index) => (
                    <div
                      key={index}
                      className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                    >
                      <p className="font-medium text-blue-900">{author.name}</p>
                      <p className="text-sm text-blue-700">
                        {author.count} libro{author.count > 1 ? "s" : ""} leído
                        {author.count > 1 ? "s" : ""} con ⭐ 4+
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Mensaje cuando no hay datos suficientes */}
            {(!googleRecommendations || googleRecommendations.length === 0) &&
            (!recommendations.favoriteAuthors ||
              recommendations.favoriteAuthors.length === 0) ? (
              <div className="text-center py-6">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">
                  {recommendations.readingGoals ||
                    "Lee más libros y califícalos para recibir recomendaciones personalizadas."}
                </p>
              </div>
            ) : null}
          </div>
        )}

        {!recommendations && !loadingRecommendations && (
          <div className="text-center py-8">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Descubre tus recomendaciones personalizadas
            </h3>
            <p className="text-gray-600 mb-4">
              Basadas en tu historial de lectura y calificaciones
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
