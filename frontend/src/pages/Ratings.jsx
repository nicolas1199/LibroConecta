import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  getMyRatings, 
  getPendingRatings, 
  createRating, 
  updateRating, 
  deleteRating 
} from "../api/ratings";
import { getMatchInfo } from "../api/matches";
import Star from "../components/icons/Star";
import Clock from "../components/icons/Clock";
import Users from "../components/icons/Users";
import Edit from "../components/icons/Edit";
import Trash from "../components/icons/Trash";

export default function Ratings() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("pending");
  const [ratings, setRatings] = useState([]);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);
  const [ratingForm, setRatingForm] = useState({
    rating: 5,
    comment: "",
  });

  // Obtener parámetros de URL para calificación desde chat
  const reviewUserId = searchParams.get('review_user');
  const matchId = searchParams.get('match_id');

  useEffect(() => {
    loadData();
  }, []);

  // Separar el useEffect para la redirección automática
  useEffect(() => {
    // Si viene de un chat, abrir directamente el modal de calificación
    if (reviewUserId && matchId && pendingRatings.length > 0 && !showRatingModal) {
      // Buscar la calificación pendiente correspondiente
      const pendingForUser = pendingRatings.find(p => 
        p.other_user_id === reviewUserId && p.match_id && p.match_id.toString() === matchId
      );
      
      if (pendingForUser) {
        handleOpenRatingModal(pendingForUser);
      } else {
        // Obtener información del match para mostrar el nombre correcto
        const fetchMatchInfo = async () => {
          try {
            const matchInfo = await getMatchInfo(matchId);
            const otherUser = matchInfo.data.users.find(u => u.user_id === reviewUserId);
            
            const artificialPending = {
              other_user_id: reviewUserId,
              match_id: parseInt(matchId),
              transaction_type: 'match',
              other_user_first_name: otherUser?.first_name || 'Usuario',
              other_user_last_name: otherUser?.last_name || '',
              transaction_date: new Date().toISOString(),
            };
            handleOpenRatingModal(artificialPending);
          } catch (error) {
            console.error("Error obteniendo info del match:", error);
            // Fallback con datos básicos
            const artificialPending = {
              other_user_id: reviewUserId,
              match_id: parseInt(matchId),
              transaction_type: 'match',
              other_user_first_name: 'Usuario',
              other_user_last_name: '',
              transaction_date: new Date().toISOString(),
            };
            handleOpenRatingModal(artificialPending);
          }
        };
        
        fetchMatchInfo();
      }
    }
  }, [reviewUserId, matchId, pendingRatings, showRatingModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, receivedResponse] = await Promise.all([
        getPendingRatings(),
        getMyRatings({ type: "received" }),
      ]);

      setPendingRatings(pendingResponse.data || []);
      setRatings(receivedResponse.data || []);
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Error al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

  const loadRatings = async (type) => {
    try {
      setLoading(true);
      const response = await getMyRatings({ type });
      setRatings(response.data || []);
    } catch (error) {
      console.error("Error loading ratings:", error);
      setError("Error al cargar las calificaciones");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "received") {
      loadRatings("received");
    } else if (tab === "given") {
      loadRatings("given");
    }
  };

  const handleOpenRatingModal = (pendingRating) => {
    setSelectedPending(pendingRating);
    setRatingForm({
      rating: 5,
      comment: "",
    });
    setShowRatingModal(true);
  };

  const handleCloseModal = useCallback(() => {
    setShowRatingModal(false);
    setSelectedPending(null);
    
    // Si venía del chat, regresar al chat
    if (matchId) {
      navigate(`/dashboard/messages/${matchId}`);
    }
  }, [matchId, navigate]);

  const handleSubmitRating = useCallback(async (e) => {
    e.preventDefault();
    if (!selectedPending) return;

    try {
      setActionLoading("submit");
      
      const ratingData = {
        rated_user_id: selectedPending.other_user_id,
        rating: ratingForm.rating,
        comment: ratingForm.comment,
      };

      if (selectedPending.transaction_type === "exchange" && selectedPending.exchange_id) {
        ratingData.exchange_id = selectedPending.exchange_id;
      } else if (selectedPending.transaction_type === "match" || selectedPending.match_id) {
        ratingData.match_id = selectedPending.match_id;
      } else if (selectedPending.transaction_type === "sell" && selectedPending.sell_id) {
        ratingData.sell_id = selectedPending.sell_id;
      }

      await createRating(ratingData);
      
      // Remover de pendientes
      setPendingRatings(prev => 
        prev.filter(p => 
          p.other_user_id !== selectedPending.other_user_id ||
          p.transaction_type !== selectedPending.transaction_type
        )
      );
      
      setShowRatingModal(false);
      setSelectedPending(null);
      
      // Si venía del chat, regresar al chat
      if (matchId) {
        navigate(`/dashboard/messages/${matchId}`);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    } finally {
      setActionLoading(null);
    }
  }, [selectedPending, ratingForm, matchId, navigate]);

  const handleDeleteRating = async (ratingId) => {
    try {
      setActionLoading(ratingId);
      await deleteRating(ratingId);
      
      // Remover de la lista
      setRatings(prev => prev.filter(r => r.rating_id !== ratingId));
    } catch (error) {
      console.error("Error deleting rating:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange = null) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRatingChange && onRatingChange(star)}
            className={`${
              interactive ? "cursor-pointer hover:scale-110" : "cursor-default"
            } transition-transform`}
            disabled={!interactive}
          >
            <Star
              className={`h-5 w-5 ${
                star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const tabs = [
    { id: "pending", label: "Pendientes", icon: Clock },
    { id: "received", label: "Recibidas", icon: Star },
    { id: "given", label: "Dadas", icon: Users },
  ];

  const PendingRatings = () => (
    <div className="space-y-4">
      {pendingRatings.length > 0 ? (
        pendingRatings.map((pending) => (
          <div key={`${pending.other_user_id}-${pending.transaction_type}`} className="card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {pending.other_user_first_name} {pending.other_user_last_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {pending.transaction_type === "exchange" ? "Intercambio" : 
                     pending.transaction_type === "match" ? "Match/Intercambio" : "Venta"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(pending.transaction_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleOpenRatingModal(pending)}
                className="btn btn-primary btn-sm"
              >
                Calificar
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay calificaciones pendientes
          </h3>
          <p className="text-gray-600">
            Todas tus transacciones han sido calificadas
          </p>
        </div>
      )}
    </div>
  );

  const RatingsList = () => (
    <div className="space-y-4">
      {ratings.length > 0 ? (
        ratings.map((rating) => (
          <div key={rating.rating_id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {activeTab === "received" 
                      ? `${rating.Rater.first_name} ${rating.Rater.last_name}`
                      : `${rating.Rated.first_name} ${rating.Rated.last_name}`
                    }
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    {renderStars(rating.rating)}
                    <span className="text-sm text-gray-600">
                      {new Date(rating.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {rating.comment && (
                    <p className="text-sm text-gray-700 mt-2 max-w-md">
                      "{rating.comment}"
                    </p>
                  )}
                </div>
              </div>
              
              {activeTab === "given" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteRating(rating.rating_id)}
                    disabled={actionLoading === rating.rating_id}
                    className="btn btn-danger btn-sm flex items-center space-x-1"
                  >
                    <Trash className="h-4 w-4" />
                    <span>{actionLoading === rating.rating_id ? "..." : "Eliminar"}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-12">
          <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay calificaciones {activeTab === "received" ? "recibidas" : "dadas"}
          </h3>
          <p className="text-gray-600">
            {activeTab === "received" 
              ? "Aún no has recibido calificaciones" 
              : "Aún no has calificado a nadie"
            }
          </p>
        </div>
      )}
    </div>
  );

  const RatingModal = useCallback(() => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Calificar a {selectedPending?.other_user_first_name} {selectedPending?.other_user_last_name}
        </h3>
        
        <form onSubmit={handleSubmitRating} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Calificación
            </label>
            {renderStars(ratingForm.rating, true, (rating) => 
              setRatingForm(prev => ({ ...prev, rating }))
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={ratingForm.comment}
              onChange={(e) => setRatingForm(prev => ({ ...prev, comment: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe tu experiencia..."
              autoFocus={false}
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleCloseModal}
              className="btn btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={actionLoading === "submit"}
              className="btn btn-primary flex-1"
            >
              {actionLoading === "submit" ? "Enviando..." : "Enviar calificación"}
            </button>
          </div>
        </form>
      </div>
    </div>
  ), [selectedPending, ratingForm, actionLoading, handleSubmitRating, handleCloseModal]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calificaciones</h1>
          <p className="text-gray-600">Gestiona las calificaciones de tus transacciones</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
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
            {activeTab === "pending" && <PendingRatings />}
            {(activeTab === "received" || activeTab === "given") && <RatingsList />}
          </>
        )}
      </div>

      {/* Rating Modal */}
      {showRatingModal && <RatingModal />}
    </div>
  );
} 