import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StarRating from './StarRating';
import ReviewCard from './ReviewCard';

const ReviewsSection = ({ userId, showMyReviews = false }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    average_rating: 0,
    distribution: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('received');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1234/api';

  useEffect(() => {
    loadReviews(true);
  }, [userId, activeTab, showMyReviews]);

  const loadReviews = async (reset = false) => {
    try {
      setLoading(true);
      if (reset) {
        setPage(0);
        setReviews([]);
      }

      const currentPage = reset ? 0 : page;
      const limit = 10;
      const offset = currentPage * limit;

      let response;
      if (showMyReviews) {
        // Cargar mis reviews (recibidas o dadas)
        response = await axios.get(`${API_BASE_URL}/ratings/my`, {
          params: {
            type: activeTab,
            limit,
            offset
          }
        });
      } else {
        // Cargar reviews de un usuario específico
        response = await axios.get(`${API_BASE_URL}/ratings/user/${userId}`, {
          params: {
            limit,
            offset
          }
        });
      }

      const newReviews = response.data.data || [];
      const metadata = response.data.metadata || {};

      if (reset) {
        setReviews(newReviews);
        setStats(metadata);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }

      setHasMore(newReviews.length === limit);
      setPage(prev => prev + 1);
      setError(null);
    } catch (error) {
      console.error('Error al cargar reviews:', error);
      setError('Error al cargar las reseñas');
    } finally {
      setLoading(false);
    }
  };

  const renderStatsBar = () => {
    if (!stats.distribution || stats.distribution.length === 0) {
      return null;
    }

    const totalReviews = stats.total || 0;
    const maxCount = Math.max(...stats.distribution.map(d => d.count));

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Resumen de Calificaciones
            </h3>
            <p className="text-sm text-gray-500">
              {totalReviews} {totalReviews === 1 ? 'reseña' : 'reseñas'} en total
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {parseFloat(stats.average_rating || 0).toFixed(1)}
            </div>
            <StarRating 
              rating={parseFloat(stats.average_rating || 0)} 
              size="sm" 
              showRating={false}
            />
          </div>
        </div>

        {/* Distribución por estrellas */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(rating => {
            const ratingData = stats.distribution.find(d => d.rating === rating);
            const count = ratingData ? ratingData.count : 0;
            const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

            return (
              <div key={rating} className="flex items-center space-x-3">
                <div className="flex items-center space-x-1 w-16">
                  <span className="text-sm">{rating}</span>
                  <svg className="w-3 h-3 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTabs = () => {
    if (!showMyReviews) return null;

    return (
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('received')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'received'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recibidas ({stats.total || 0})
          </button>
          <button
            onClick={() => setActiveTab('given')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              activeTab === 'given'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Dadas
          </button>
        </div>
      </div>
    );
  };

  if (loading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {/* Skeleton de estadísticas */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="text-right">
              <div className="h-8 bg-gray-300 rounded w-16 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-20"></div>
            </div>
          </div>
        </div>
        
        {/* Skeleton de reviews */}
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 animate-pulse">
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <div className="h-16 bg-gray-300 rounded mb-3"></div>
            <div className="h-3 bg-gray-300 rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderTabs()}
      {renderStatsBar()}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Lista de reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard 
            key={review.rating_id} 
            review={review}
            showRaterInfo={activeTab === 'received'}
          />
        ))}
      </div>

      {/* Estado vacío */}
      {!loading && reviews.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No hay reseñas todavía
          </h3>
          <p className="text-gray-500">
            {showMyReviews 
              ? 'Aún no has recibido ninguna calificación.'
              : 'Este usuario aún no tiene calificaciones.'
            }
          </p>
        </div>
      )}

      {/* Botón cargar más */}
      {hasMore && reviews.length > 0 && (
        <div className="text-center pt-6">
          <button
            onClick={() => loadReviews(false)}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? 'Cargando...' : 'Cargar más reseñas'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;
