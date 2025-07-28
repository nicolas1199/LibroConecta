import { useState, useEffect } from "react";
import { getMyRatings } from "../api/ratings";
import { getMatches } from "../api/matches";
import { getPublishedBooksByUser } from "../api/publishedBooks";
import BarChart from "../components/icons/BarChart";
import TrendingUp from "../components/icons/TrendingUp";
import Users from "../components/icons/Users";
import BookOpen from "../components/icons/BookOpen";
import Star from "../components/icons/Star";
import ArrowLeftRight from "../components/icons/ArrowLeftRight";

export default function Stats() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalMatches: 0,
    totalExchanges: 0,
    averageRating: 0,
    totalRatings: 0,
    booksAvailable: 0,
    booksSold: 0,
    ratingDistribution: [0, 0, 0, 0, 0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const userId = currentUser.user_id;

      // Cargar datos en paralelo
      const [ratingsResponse, matchesResponse, booksResponse, exchangeHistoryResponse] = await Promise.all([
        getMyRatings({ type: 'received', limit: 1000 }).catch(() => ({ data: [] })),
        getMatches().catch(() => ({ data: [] })),
        getPublishedBooksByUser(userId).catch(() => ({ data: [] })),
        fetch('/api/exchanges/history', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] }))
      ]);

      const ratings = ratingsResponse.data || [];
      const matches = matchesResponse.data || [];
      const books = booksResponse.data || [];
      const exchanges = exchangeHistoryResponse.data || [];

      // Calcular estadísticas
      const totalRatings = ratings.length;
      const averageRating = totalRatings > 0 
        ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / totalRatings 
        : 0;

      // Distribución de calificaciones
      const distribution = [0, 0, 0, 0, 0];
      ratings.forEach(rating => {
        if (rating.rating >= 1 && rating.rating <= 5) {
          distribution[rating.rating - 1]++;
        }
      });

      // Estado de libros
      const booksAvailable = books.filter(book => book.status === 'available').length;
      const booksSold = books.filter(book => book.status === 'sold').length;

      setStats({
        totalBooks: books.length,
        totalMatches: matches.length,
        totalExchanges: exchanges.length,
        averageRating: Math.round(averageRating * 10) / 10,
        totalRatings,
        booksAvailable,
        booksSold,
        ratingDistribution: distribution
      });

    } catch (error) {
      console.error("Error loading stats:", error);
      setError("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <BarChart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar estadísticas</h3>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-600">Resumen de tu actividad en LibroConecta</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Books */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Libros Publicados</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalBooks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {stats.booksAvailable} disponibles • {stats.booksSold} vendidos
          </div>
        </div>

        {/* Total Matches */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Matches</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMatches}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Conexiones establecidas
          </div>
        </div>

        {/* Total Exchanges */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Intercambios</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalExchanges}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowLeftRight className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Intercambios completados
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Calificación</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "N/A"}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {stats.totalRatings} reseña{stats.totalRatings !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Detailed Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Distribución de Calificaciones
          </h3>
          
          {stats.totalRatings > 0 ? (
            <div className="space-y-3">
              {stats.ratingDistribution.map((count, index) => {
                const percentage = stats.totalRatings > 0 ? (count / stats.totalRatings) * 100 : 0;
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1 w-16">
                      <span className="text-sm text-gray-600">{index + 1}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-8">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Star className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">Aún no tienes calificaciones</p>
            </div>
          )}
        </div>

        {/* Activity Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Resumen de Actividad
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-gray-700">Tasa de venta</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats.totalBooks > 0 ? Math.round((stats.booksSold / stats.totalBooks) * 100) : 0}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-gray-700">Ratio Match/Intercambio</span>
              </div>
              <span className="font-semibold text-gray-900">
                {stats.totalMatches > 0 ? Math.round((stats.totalExchanges / stats.totalMatches) * 100) : 0}%
              </span>
            </div>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-gray-700">Reputación</span>
              </div>
              <div className="flex items-center space-x-2">
                {stats.averageRating > 0 && renderStars(Math.round(stats.averageRating))}
                <span className="font-semibold text-gray-900">
                  {stats.averageRating >= 4.5 ? "Excelente" : 
                   stats.averageRating >= 3.5 ? "Buena" : 
                   stats.averageRating > 0 ? "Regular" : "Sin datos"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}