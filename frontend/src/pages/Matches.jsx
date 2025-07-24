import { useState, useEffect } from "react";
import { getMatches, getSuggestedMatches, createMatch, deleteMatch } from "../api/matches";
import { getUserRatings } from "../api/ratings";
import Users from "../components/icons/Users";
import Heart from "../components/icons/Heart";
import X from "../components/icons/X";
import MessageCircle from "../components/icons/MessageCircle";
import Star from "../components/icons/Star";
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

    return (
      <div className="card p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <ProfileImage user={user} size="lg" />
            <div>
              <h3 className="font-semibold text-gray-900">
                {user.first_name} {user.last_name}
              </h3>
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
                <p className="text-sm text-gray-500">
                  Match desde: {new Date(match.date_match).toLocaleDateString()}
                </p>
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
        {loading && (
          <div className="flex justify-center py-12">
            <div className="spinner border-gray-300 border-t-blue-600"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === "current" && (
              <div className="space-y-4">
                {matches.length > 0 ? (
                  matches.map((match) => (
                    <MatchCard key={match.match_id} match={match} type="current" />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No tienes matches aún
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Explora los usuarios sugeridos para encontrar tu primer match
                    </p>
                    <button
                      onClick={() => setActiveTab("suggested")}
                      className="btn btn-primary"
                    >
                      Ver sugeridos
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "suggested" && (
              <div className="space-y-4">
                {suggestedMatches.length > 0 ? (
                  suggestedMatches.map((match) => (
                    <MatchCard 
                      key={match.user.user_id} 
                      match={match} 
                      type="suggested" 
                    />
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No hay sugerencias disponibles
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Publica más libros para obtener mejores sugerencias de matches
                    </p>
                    <Link to="/dashboard/publish" className="btn btn-primary">
                      Publicar libro
                    </Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 