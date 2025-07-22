import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ReviewsSection from '../components/ReviewsSection';

const ReviewsPage = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Acceso requerido
          </h2>
          <p className="text-gray-600">
            Debes iniciar sesión para ver tus reseñas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {user.first_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Mis Reseñas
              </h1>
              <p className="text-gray-600">
                Gestiona las calificaciones que has recibido y dado
              </p>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ReviewsSection 
            userId={user.user_id} 
            showMyReviews={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ReviewsPage;
