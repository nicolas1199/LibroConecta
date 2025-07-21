import React from 'react';
import StarRating from './StarRating';

const ReviewCard = ({ review, showRaterInfo = true }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTransactionType = (review) => {
    if (review.Exchange) {
      return {
        type: 'Intercambio',
        date: review.Exchange.date_exchange,
        icon: '🔄'
      };
    } else if (review.Sell) {
      return {
        type: 'Venta',
        date: review.Sell.date_sell,
        icon: '💰'
      };
    } else if (review.transaction_id) {
      return {
        type: 'Transacción',
        date: review.created_at,
        icon: '💳'
      };
    }
    return {
      type: 'Calificación',
      date: review.created_at,
      icon: '⭐'
    };
  };

  const transaction = getTransactionType(review);
  const userName = showRaterInfo 
    ? `${review.Rater?.first_name} ${review.Rater?.last_name}`
    : `${review.Rated?.first_name} ${review.Rated?.last_name}`;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Header con información del usuario y rating */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {userName?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">
              {userName || 'Usuario anónimo'}
            </h4>
            <p className="text-sm text-gray-500">
              {formatDate(review.created_at)}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {/* Comentario */}
      {review.comment && (
        <div className="mb-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            "{review.comment}"
          </p>
        </div>
      )}

      {/* Información de la transacción */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span className="text-base">{transaction.icon}</span>
          <span>{transaction.type}</span>
          {transaction.date && (
            <span>• {formatDate(transaction.date)}</span>
          )}
        </div>
        
        {/* Indicador de tipo de calificación */}
        <div className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">
          {showRaterInfo ? 'Recibida' : 'Dada'}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
