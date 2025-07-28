import { useState, useEffect } from "react";
import { getMatches, getSuggestedMatches, createMatch, deleteMatch } from "../api/matches";
import { getUserRatings } from "../api/ratings";
import Users from "../components/icons/Users";
import Heart from "../components/icons/Heart";
import X from "../components/icons/X";
import MessageCircle from "../components/icons/MessageCircle";
import Star from "../components/icons/Star";
import BookOpen from "../components/icons/BookOpen";
import ProfileImage from "../components/ProfileImage";
import { Link } from "react-router-dom";

export default function Matches() {
  const [activeTab, setActiveTab] = useState("current");
  const [matches, setMatches] = useState([]);
  const [suggestedMatches, setSuggestedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [matchesResponse, suggestedResponse] = await Promise.all([
        getMatches(),
        getSuggestedMatches(),
      ]);

      setMatches(matchesResponse.data || []);
      setSuggestedMatches(suggestedResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (userId) => {
    try {
      setActionLoading(userId);
      await createMatch(userId);
      
      // Remover de sugeridos y recargar matches
      setSuggestedMatches(prev => prev.filter(match => match.user.user_id !== userId));
      await loadData();
    } catch (error) {
      console.error("Error creating match:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteMatch = async (matchId) => {
    try {
      setActionLoading(matchId);
      await deleteMatch(matchId);
      
      // Remover de la lista
      setMatches(prev => prev.filter(match => match.match_id !== matchId));
    } catch (error) {
      console.error("Error deleting match:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const tabs = [
    { id: "current", label: "Mis Matches", icon: Heart },
    { id: "suggested", label: "Sugeridos", icon: Users },
  ];

  const MatchCard = ({ match, type }) => {
    const user = type === "suggested" ? match.user : match.user;
    const isActionLoading = actionLoading === (type === "suggested" ? user.user_id : match.match_id);
    const isAutoMatch = match.match_type === "automatic";

    return (
      <div className="card p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <ProfileImage user={user} size="lg" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">
                  {user.first_name} {user.last_name}
                </h3>
                {isAutoMatch && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    <Heart className="h-3 w-3 mr-1" />
                    Auto-Match
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{user.email}</p>
              
              {type === "suggested" && (
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                  <span>Compatibilidad: {match.score} pts</span>
                  <span>Libros: {match.booksCount}</span>
                  {match.locationMatch && (
                    <span className="text-green-600">📍 Ubicación común</span>
                  )}
                </div>
              )}
              
              {type === "current" && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Match desde: {new Date(match.date_match).toLocaleDateString()}
                  </p>
                  {isAutoMatch && match.triggered_by_books && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                      <div className="flex items-center space-x-1 mb-1">
                        <BookOpen className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium text-purple-700">
                          Libro que activó el match:
                        </span>
                      </div>
                      <p className="text-xs text-purple-600 font-medium">
                        "{match.triggered_by_books.user1_liked_book?.title || 'Libro'}"
                      </p>
                      {match.triggered_by_books.user2_liked_books?.length > 1 && (
                        <p className="text-xs text-purple-500 mt-1">
                          +{match.triggered_by_books.user2_liked_books.length - 1} libro(s) más en común
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-2">
            {type === "suggested" ? (
              <>
                <button
                  onClick={() => handleCreateMatch(user.user_id)}
                  disabled={isActionLoading}
                  className="btn btn-primary btn-sm flex items-center space-x-1"
                >
                  <Heart className="h-4 w-4" />
                  <span>{isActionLoading ? "..." : "Match"}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to={`/dashboard/messages/${match.match_id}`}
                  className="btn btn-secondary btn-sm flex items-center space-x-1"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chatear</span>
                </Link>
                <button
                  onClick={() => handleDeleteMatch(match.match_id)}
                  disabled={isActionLoading}
                  className="btn btn-danger btn-sm flex items-center space-x-1"
                >
                  <X className="h-4 w-4" />
                  <span>{isActionLoading ? "..." : "Eliminar"}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {type === "suggested" && match.commonCategories > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>{match.commonCategories}</strong> categorías en común
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Matches</h1>
          <p className="text-gray-600">Conecta con otros lectores</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`dashboard-tab ${activeTab === tab.id ? "active" : ""}`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="min-h-96">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="spinner border-gray-300 border-t-blue-600 w-8 h-8"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
          </div>
        ) : activeTab === "current" ? (
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tienes matches aún
                </h3>
                <p className="text-gray-600">
                  Ve a la sección de Swipe para descubrir libros y hacer matches
                </p>
              </div>
            ) : (
              matches.map((match) => (
                <MatchCard key={match.match_id} match={match} type="current" />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {suggestedMatches.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay sugerencias disponibles
                </h3>
                <p className="text-gray-600">
                  Publica más libros para recibir sugerencias de matches
                </p>
              </div>
            ) : (
              suggestedMatches.map((match) => (
                <MatchCard key={match.user.user_id} match={match} type="suggested" />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
} 