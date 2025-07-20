"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserMatches } from "../api/publishedBooks";
import ArrowLeft from "../components/icons/ArrowLeft";
import Users from "../components/icons/Users";
import MessageCircle from "../components/icons/MessageCircle";
import Heart from "../components/icons/Heart";

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasMore: false
  });

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async (page = 1) => {
    try {
      setLoading(true);
      const response = await getUserMatches({ page, limit: 20 });
      
      if (page === 1) {
        setMatches(response.matches || []);
      } else {
        setMatches(prev => [...prev, ...(response.matches || [])]);
      }
      
      setPagination(response.pagination || {});
    } catch (error) {
      console.error("Error loading matches:", error);
      setError("Error al cargar los matches");
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (pagination.hasMore && !loading) {
      loadMatches(pagination.page + 1);
    }
  };

  const handleStartChat = (matchId, otherUserId) => {
    // Navegar a la página de chat con el usuario del match
    window.location.href = `/dashboard/messages/new?user=${otherUserId}&match=${matchId}`;
  };

  if (loading && matches.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Error al cargar matches
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => loadMatches()} 
            className="btn btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Matches</h1>
              <p className="text-gray-600">
                Usuarios con los que te has conectado a través de libros
              </p>
            </div>

            <div className="flex items-center space-x-2 text-green-600">
              <Heart className="h-6 w-6" />
              <span className="font-semibold">{matches.length} matches</span>
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {matches.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes matches aún
              </h3>
              <p className="text-gray-600 mb-6">
                ¡Sigue haciendo swipe en libros para encontrar conexiones!
              </p>
              <Link to="/swipe" className="btn btn-primary">
                Ir a Swipe
              </Link>
            </div>
          ) : (
            matches.map((match) => (
              <div
                key={match.match_id}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar del usuario */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {match.other_user?.first_name?.charAt(0) || "U"}
                    </div>

                    {/* Información del usuario */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {match.other_user?.first_name} {match.other_user?.last_name}
                      </h3>
                      <p className="text-gray-600">
                        Se conectaron el {new Date(match.date_match).toLocaleDateString()}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-gray-500">¡Match!</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleStartChat(match.match_id, match.other_user?.user_id)}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Chatear</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {pagination.hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? "Cargando..." : "Cargar más matches"}
            </button>
          </div>
        )}

        {/* Pagination Info */}
        {matches.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            Mostrando {matches.length} de {pagination.total} matches
          </div>
        )}
      </div>
    </div>
  );
} 