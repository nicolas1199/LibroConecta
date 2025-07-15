"use client";

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getUserSwipeHistory, updateSwipeInteraction, deleteSwipeInteraction } from "../api/publishedBooks";
import Heart from "../components/icons/Heart";
import X from "../components/icons/X";
import BookOpen from "../components/icons/BookOpen";
import Trash from "../components/icons/Trash";
import PropTypes from "prop-types";

const INTERACTION_TYPES = {
  like: { label: "Me gusta", icon: Heart, color: "green" },
  dislike: { label: "No me gusta", icon: X, color: "red" },
};

export default function SwipeHistory() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 12,
      };

      if (selectedFilter !== "all") {
        params.interaction_type = selectedFilter;
      }

      console.log("Loading history with params:", params);
      const response = await getUserSwipeHistory(params);
      console.log("History response:", response);
      
      if (response.success) {
        setHistory(response.data.interactions);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "Error al cargar el historial");
      }
    } catch (err) {
      console.error("Error loading history:", err);
      setError("Error de conexión al cargar el historial");
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedFilter]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleChangeInteraction = async (interactionId, newType) => {
    try {
      const response = await updateSwipeInteraction(interactionId, {
        interaction_type: newType
      });
      
      if (response.success) {
        // Actualizar el historial localmente
        setHistory(prevHistory => 
          prevHistory.map(item => 
            item.interaction_id === interactionId 
              ? { ...item, interaction_type: newType }
              : item
          )
        );
        // Recargar estadísticas
        loadHistory();
      }
    } catch (err) {
      console.error("Error updating interaction:", err);
    }
  };

  const handleDeleteInteraction = async (interactionId) => {
    try {
      const response = await deleteSwipeInteraction(interactionId);
      
      if (response.success) {
        // Remover del historial local
        setHistory(prevHistory => 
          prevHistory.filter(item => item.interaction_id !== interactionId)
        );
        // Recargar estadísticas
        loadHistory();
        setShowDeleteConfirm(null);
      }
    } catch (err) {
      console.error("Error deleting interaction:", err);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner border-gray-300 border-t-blue-600 w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando historial...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">
            <X className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Historial de Swipes
              </h1>
              <p className="text-gray-600">
                Revisa y modifica tus decisiones anteriores
              </p>
            </div>
            <Link
              to="/dashboard/swipe"
              className="btn btn-secondary"
            >
              Volver
            </Link>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.likes || 0}</div>
              <div className="text-sm text-green-700">Me gusta</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.dislikes || 0}</div>
              <div className="text-sm text-red-700">No me gusta</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-gray-600">{stats.total || 0}</div>
              <div className="text-sm text-gray-700">Total</div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Todos ({stats.total || 0})
            </button>
            <button
              onClick={() => handleFilterChange("like")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "like"
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Me gusta ({stats.likes || 0})
            </button>
            <button
              onClick={() => handleFilterChange("dislike")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === "dislike"
                  ? "bg-red-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              No me gusta ({stats.dislikes || 0})
            </button>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {history.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">
              <BookOpen className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay interacciones aún
            </h3>
            <p className="text-gray-600 mb-4">
              Comienza a hacer swipe para ver tu historial aquí
            </p>
            <Link
              to="/dashboard/swipe"
              className="btn btn-primary"
            >
              Ir a LibroSwipe
            </Link>
          </div>
        ) : (
          <>
            {/* Grid de historial */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <AnimatePresence>
                {history.map((item) => (
                  <HistoryCard
                    key={item.interaction_id}
                    interaction={item}
                    onChangeInteraction={handleChangeInteraction}
                    onDeleteInteraction={() => setShowDeleteConfirm(item.interaction_id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Anterior
                </button>
                
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      page === currentPage
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              ¿Eliminar interacción?
            </h3>
            <p className="text-gray-600 mb-6">
              Esta acción no se puede deshacer. El libro volverá a aparecer en tus recomendaciones.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 btn btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteInteraction(showDeleteConfirm)}
                className="flex-1 btn btn-danger"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function HistoryCard({ interaction, onChangeInteraction, onDeleteInteraction }) {
  const { PublishedBook } = interaction;
  const { Book: book, User: user, PublishedBookImages: images = [] } = PublishedBook;
  
  const primaryImage = images.find(img => img.is_primary) || images[0];
  const imageUrl = primaryImage?.image_url || "/api/placeholder/300/200";
  
  const currentType = INTERACTION_TYPES[interaction.interaction_type];
  const date = new Date(interaction.created_at).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Imagen */}
      <div className="relative h-48">
        <img
          src={imageUrl}
          alt={book.title}
          className="w-full h-full object-cover"
        />
        <div className={`absolute top-3 right-3 bg-${currentType.color}-500 text-white px-3 py-1 rounded-full text-sm font-medium`}>
          {currentType.label}
        </div>
      </div>

      {/* Información */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">
          {book.title}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          por {book.author}
        </p>
        <p className="text-xs text-gray-500 mb-4">
          {date} • Por {user.first_name} {user.last_name}
        </p>

        {/* Acciones */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => onChangeInteraction(interaction.interaction_id, "like")}
              className={`p-2 rounded-full transition-colors ${
                interaction.interaction_type === "like"
                  ? "bg-green-100 text-green-600"
                  : "bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600"
              }`}
              title="Me gusta"
            >
              <Heart className="w-4 h-4" />
            </button>
            <button
              onClick={() => onChangeInteraction(interaction.interaction_id, "dislike")}
              className={`p-2 rounded-full transition-colors ${
                interaction.interaction_type === "dislike"
                  ? "bg-red-100 text-red-600"
                  : "bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600"
              }`}
              title="No me gusta"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={onDeleteInteraction}
            className="text-gray-400 hover:text-red-600 transition-colors text-sm"
            title="Eliminar"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

HistoryCard.propTypes = {
  interaction: PropTypes.shape({
    interaction_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    interaction_type: PropTypes.string.isRequired,
    created_at: PropTypes.string.isRequired,
    PublishedBook: PropTypes.shape({
      Book: PropTypes.shape({
        title: PropTypes.string.isRequired,
        author: PropTypes.string.isRequired,
      }).isRequired,
      User: PropTypes.shape({
        first_name: PropTypes.string.isRequired,
        last_name: PropTypes.string.isRequired,
      }).isRequired,
      PublishedBookImages: PropTypes.arrayOf(
        PropTypes.shape({
          image_url: PropTypes.string,
          is_primary: PropTypes.bool,
        })
      ),
    }).isRequired,
  }).isRequired,
  onChangeInteraction: PropTypes.func.isRequired,
  onDeleteInteraction: PropTypes.func.isRequired,
};
