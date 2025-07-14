"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getRecommendations } from "../api/userLibrary";
import BookOpen from "../components/icons/BookOpen";
import Star from "../components/icons/Star";
import TrendingUp from "../components/icons/TrendingUp";
import Target from "../components/icons/Target";

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const response = await getRecommendations();
      setRecommendations(response);
    } catch (error) {
      console.error("Error loading recommendations:", error);
      setError("Error al cargar recomendaciones");
    } finally {
      setLoading(false);
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
          onClick={() => window.location.reload()}
          className="btn btn-secondary mt-4"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Recomendaciones Personalizadas
        </h1>
        <p className="text-gray-600">
          Descubre nuevos libros basados en tus lecturas previas
        </p>
      </div>

      {/* Mensaje principal */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-blue-900">
              {recommendations?.message || "Recomendaciones generadas"}
            </h3>
            <p className="mt-2 text-blue-700">
              {recommendations?.readingGoals}
            </p>
          </div>
        </div>
      </div>

      {/* Autores recomendados */}
      {recommendations?.recommendedAuthors &&
      recommendations.recommendedAuthors.length > 0 ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Star className="w-5 h-5 text-yellow-500 mr-2" />
            Autores que podrían gustarte
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recommendations.recommendedAuthors.map((author, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
              >
                <h3 className="font-medium text-gray-900">{author.name}</h3>
                <p className="text-sm text-gray-600">
                  {author.count} libro{author.count !== 1 ? "s" : ""} en tu
                  biblioteca
                </p>
                <div className="mt-2">
                  <Link
                    to={`/dashboard/library?author=${encodeURIComponent(author.name)}`}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Ver mis libros de este autor →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡Comienza a construir tu biblioteca!
          </h3>
          <p className="text-gray-600 mb-4">
            Necesitas leer y calificar más libros para recibir recomendaciones
            personalizadas.
          </p>
          <div className="space-y-2 text-sm text-gray-500">
            <p>📚 Lee al menos 2 libros del mismo autor</p>
            <p>⭐ Califícalos con 4 o 5 estrellas</p>
            <p>🎯 Recibe recomendaciones personalizadas</p>
          </div>
          <Link
            to="/dashboard/add-book"
            className="btn btn-primary mt-6 inline-flex items-center"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Agregar libro a mi biblioteca
          </Link>
        </div>
      )}

      {/* Tips para mejores recomendaciones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Target className="w-5 h-5 text-green-500 mr-2" />
          Consejos para mejores recomendaciones
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">1</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Califica tus libros</h3>
              <p className="text-sm text-gray-600">
                Asigna estrellas a los libros que has leído para que entendamos
                tus gustos
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-semibold text-sm">2</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">
                Lee variedad de autores
              </h3>
              <p className="text-sm text-gray-600">
                Explora diferentes autores para recibir recomendaciones más
                diversas
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-semibold text-sm">3</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Actualiza tu estado</h3>
              <p className="text-sm text-gray-600">
                Marca los libros como &quot;leído&quot; cuando los termines
              </p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-semibold text-sm">4</span>
            </div>
            <div className="ml-3">
              <h3 className="font-medium text-gray-900">Escribe reseñas</h3>
              <p className="text-sm text-gray-600">
                Agrega notas personales sobre qué te gustó de cada libro
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="flex justify-center space-x-4">
        <Link to="/dashboard/library" className="btn btn-secondary">
          Ver mi biblioteca
        </Link>
        <Link to="/dashboard/add-book" className="btn btn-primary">
          Agregar nuevo libro
        </Link>
      </div>
    </div>
  );
}
