import React, { useState, useEffect } from 'react';
import { 
  getMyRatings, 
  getPendingRatings 
} from '../api/ratings';
import WriteReviewModal from '../components/WriteReviewModal';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';

const RatingsWithReviews = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [ratings, setRatings] = useState([]);
  const [pendingRatings, setPendingRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedPending, setSelectedPending] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pendingResponse, receivedResponse] = await Promise.all([
        getPendingRatings(),
        getMyRatings({ type: 'received' }),
      ]);

      setPendingRatings(pendingResponse.data || []);
      setRatings(receivedResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = (pendingRating) => {
    setSelectedPending(pendingRating);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    // Recargar datos después de enviar una review
    loadData();
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case 'exchange':
        return 'Intercambio';
      case 'sale':
        return 'Venta';
      case 'purchase':
        return 'Compra';
      default:
        return type;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'pending', label: 'Pendientes', count: pendingRatings.length },
    { id: 'received', label: 'Recibidas', count: ratings.length },
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2 mb-3"></div>
                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Calificaciones y Reseñas
        </h1>
        <p className="text-gray-600">
          Gestiona las calificaciones pendientes y revisa las reseñas recibidas
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Pending Ratings Tab */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Calificaciones Pendientes
                </h2>
                <p className="text-sm text-gray-500">
                  {pendingRatings.length} pendiente(s)
                </p>
              </div>

              {pendingRatings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No hay calificaciones pendientes
                  </h3>
                  <p className="text-gray-500">
                    Cuando completes transacciones, aparecerán aquí para que puedas calificar a otros usuarios.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRatings.map((pending) => (
                    <div key={`${pending.other_user_id}-${pending.transaction_type}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {pending.other_user_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {pending.other_user_name || 'Usuario'}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {formatTransactionType(pending.transaction_type)}
                              {pending.transaction_date && (
                                <span> • {formatDate(pending.transaction_date)}</span>
                              )}
                            </p>
                            {pending.book_title && (
                              <p className="text-sm text-gray-500">
                                Libro: {pending.book_title}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleWriteReview(pending)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                          Calificar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Received Ratings Tab */}
          {activeTab === 'received' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Calificaciones Recibidas
                </h2>
                <p className="text-sm text-gray-500">
                  {ratings.length} reseña(s)
                </p>
              </div>

              {ratings.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No has recibido calificaciones todavía
                  </h3>
                  <p className="text-gray-500">
                    Cuando otros usuarios te califiquen después de transacciones, aparecerán aquí.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {ratings.map((rating) => (
                    <ReviewCard 
                      key={rating.rating_id} 
                      review={rating}
                      showRaterInfo={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && selectedPending && (
        <WriteReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedPending(null);
          }}
          ratedUserId={selectedPending.other_user_id}
          ratedUserName={selectedPending.other_user_name}
          exchangeId={selectedPending.transaction_type === 'exchange' ? selectedPending.transaction_id : null}
          sellId={selectedPending.transaction_type === 'sale' ? selectedPending.transaction_id : null}
          transactionId={selectedPending.transaction_id}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default RatingsWithReviews;
