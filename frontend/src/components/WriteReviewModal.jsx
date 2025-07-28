import React, { useState } from 'react';
import { createRating } from '../api/ratings';

const WriteReviewModal = ({ 
  isOpen, 
  onClose, 
  ratedUserId, 
  ratedUserName,
  exchangeId = null,
  matchId = null,
  sellId = null,
  transactionId = null,
  onReviewSubmitted 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const reviewData = {
        rated_user_id: ratedUserId,
        rating,
        comment: comment.trim() || null,
      };

      // Agregar IDs de transacción según corresponda
      if (exchangeId) reviewData.exchange_id = exchangeId;
      if (matchId) reviewData.match_id = matchId;
      if (sellId) reviewData.sell_id = sellId;
      if (transactionId) reviewData.transaction_id = transactionId;

      await createRating(reviewData);
      
      // Notificar que se creó la review
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
      
      // Cerrar modal y resetear formulario
      onClose();
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error al crear review:', error);
      setError(
        error.response?.data?.message || 
        'Error al enviar la calificación. Inténtalo de nuevo.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Calificar Usuario
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Información del usuario a calificar */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
              {ratedUserName?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{ratedUserName}</h3>
              <p className="text-sm text-gray-500">¿Cómo fue tu experiencia?</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Calificación con estrellas */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Calificación *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleStarClick(star)}
                  className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
                >
                  <svg
                    className={`w-8 h-8 transition-colors ${
                      star <= rating
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300 fill-gray-300 hover:text-yellow-200 hover:fill-yellow-200'
                    }`}
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                {rating === 1 && 'Muy malo'}
                {rating === 2 && 'Malo'}
                {rating === 3 && 'Regular'}
                {rating === 4 && 'Bueno'}
                {rating === 5 && 'Excelente'}
              </p>
            )}
          </div>

          {/* Comentario */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Comparte tu experiencia con este usuario..."
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/500 caracteres
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Enviando...' : 'Enviar Calificación'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WriteReviewModal;
