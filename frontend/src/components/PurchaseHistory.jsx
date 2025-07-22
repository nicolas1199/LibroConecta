import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WriteReviewModal from '../components/WriteReviewModal';
import StarRating from '../components/StarRating';

const PurchaseHistory = () => {
  const [activeTab, setActiveTab] = useState('purchases');
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:1234/api';

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  const loadTransactionHistory = async () => {
    try {
      setLoading(true);
      // Usar los endpoints que creamos en Payment.controller.js
      const [purchasesResponse, salesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/payments/history/purchases`),
        axios.get(`${API_BASE_URL}/payments/history/sales`)
      ]);

      setPurchases(purchasesResponse.data.data || []);
      setSales(salesResponse.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error loading transaction history:', error);
      setError('Error al cargar el historial de transacciones');
    } finally {
      setLoading(false);
    }
  };

  const handleWriteReview = (transaction) => {
    setSelectedTransaction(transaction);
    setShowReviewModal(true);
  };

  const handleReviewSubmitted = () => {
    setShowReviewModal(false);
    setSelectedTransaction(null);
    // Recargar datos para actualizar el estado de las reviews
    loadTransactionHistory();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      'approved': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };

    const statusTexts = {
      'approved': 'Completado',
      'pending': 'Pendiente',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles['pending']}`}>
        {statusTexts[status] || status}
      </span>
    );
  };

  const TransactionCard = ({ transaction, type }) => {
    const isCompleted = transaction.status === 'approved';
    const canReview = isCompleted && !transaction.has_rating;
    const otherUser = type === 'purchases' ? transaction.seller : transaction.buyer;
    const bookInfo = transaction.PublishedBook?.Book;

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
              {transaction.PublishedBook?.PublishedBookImages?.[0]?.image_url ? (
                <img 
                  src={transaction.PublishedBook.PublishedBookImages[0].image_url}
                  alt={bookInfo?.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="font-semibold text-gray-900">
                  {bookInfo?.title || 'Libro no disponible'}
                </h3>
                {getStatusBadge(transaction.status)}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {bookInfo?.author && `por ${bookInfo.author}`}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                {type === 'purchases' ? 'Comprado a' : 'Vendido a'}: {otherUser?.first_name} {otherUser?.last_name}
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>{formatDate(transaction.created_at)}</span>
                <span className="font-medium text-lg text-gray-900">
                  {formatPrice(transaction.amount)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-2">
            {isCompleted && transaction.rating && (
              <div className="flex items-center space-x-1">
                <StarRating rating={transaction.rating} size="sm" />
              </div>
            )}
            
            {canReview && (
              <button
                onClick={() => handleWriteReview(transaction)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Calificar
              </button>
            )}
          </div>
        </div>

        {transaction.description && (
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            {transaction.description}
          </p>
        )}
      </div>
    );
  };

  const tabs = [
    { 
      id: 'purchases', 
      label: 'Mis Compras', 
      count: purchases.length,
      icon: '🛒'
    },
    { 
      id: 'sales', 
      label: 'Mis Ventas', 
      count: sales.length,
      icon: '💰'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-300 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-20 bg-gray-300 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Historial de Transacciones
        </h1>
        <p className="text-gray-600">
          Revisa tus compras y ventas, y califica a otros usuarios
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
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
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

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Mis Compras
                </h2>
                <p className="text-sm text-gray-500">
                  {purchases.length} compra(s)
                </p>
              </div>

              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🛒</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No has realizado compras todavía
                  </h3>
                  <p className="text-gray-500">
                    Explora libros disponibles para empezar tu colección.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => (
                    <TransactionCard 
                      key={purchase.payment_id} 
                      transaction={purchase} 
                      type="purchases"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">
                  Mis Ventas
                </h2>
                <p className="text-sm text-gray-500">
                  {sales.length} venta(s)
                </p>
              </div>

              {sales.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">💰</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No has realizado ventas todavía
                  </h3>
                  <p className="text-gray-500">
                    Publica libros en venta para generar ingresos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales.map((sale) => (
                    <TransactionCard 
                      key={sale.payment_id} 
                      transaction={sale} 
                      type="sales"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {showReviewModal && selectedTransaction && (
        <WriteReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedTransaction(null);
          }}
          ratedUserId={
            activeTab === 'purchases' 
              ? selectedTransaction.seller?.user_id 
              : selectedTransaction.buyer?.user_id
          }
          ratedUserName={
            activeTab === 'purchases'
              ? `${selectedTransaction.seller?.first_name} ${selectedTransaction.seller?.last_name}`
              : `${selectedTransaction.buyer?.first_name} ${selectedTransaction.buyer?.last_name}`
          }
          transactionId={selectedTransaction.payment_id}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default PurchaseHistory;
