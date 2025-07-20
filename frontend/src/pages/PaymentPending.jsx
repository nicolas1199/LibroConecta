import { useState, useEffect } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPaymentStatus } from '../api/payments.js';

// Icons
import { Clock, ArrowLeft, RefreshCw, BookOpen } from '../components/icons';

export default function PaymentPending() {
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const paymentId = searchParams.get('payment_id');

  const fetchPaymentData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    if (!paymentId) {
      setError('No se encontró información del pago');
      setLoading(false);
      return;
    }

    try {
      const { data: payment } = await getPaymentStatus(paymentId);
      setPaymentData(payment);
      
      // Si el pago ya fue procesado, redirigir
      if (payment.status === 'paid') {
        window.location.href = `/payment/success?payment_id=${paymentId}`;
        return;
      }
      if (payment.status === 'failed' || payment.status === 'cancelled') {
        window.location.href = `/payment/failure?payment_id=${paymentId}`;
        return;
      }
    } catch (err) {
      console.error('Error obteniendo datos del pago:', err);
      setError('Error al obtener información del pago');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
    
    // Verificar estado cada 10 segundos
    const interval = setInterval(() => {
      if (!refreshing) {
        fetchPaymentData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [paymentId]);

  // Redireccionar si no hay payment_id
  if (!paymentId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  const book = paymentData?.PublishedBook?.Book;
  const seller = paymentData?.Seller;

  const getPendingMessage = (status) => {
    const messages = {
      'pending': 'Tu pago está siendo procesado.',
      'in_process': 'El pago está en proceso de verificación.'
    };
    return messages[status] || 'Tu pago está pendiente de procesamiento.';
  };

  const handleRefresh = () => {
    fetchPaymentData(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header de pendiente */}
        <div className="bg-yellow-50 px-8 py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-yellow-600 animate-pulse" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pago Pendiente
          </h1>
          <p className="text-gray-600">
            {getPendingMessage(paymentData?.status || 'pending')}
          </p>
        </div>

        {/* Detalles del pago pendiente */}
        <div className="p-8 space-y-6">
          {/* Información del libro */}
          {book && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-16 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {book.title}
                  </h3>
                  <p className="text-sm text-gray-600">por {book.author}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Vendedor: {seller?.first_name} {seller?.last_name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Estado actual */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Estado del Pago</h3>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="text-sm">Actualizar</span>
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID de Pago:</span>
                <span className="font-mono text-gray-900">
                  {paymentData?.mp_payment_id || paymentData?.payment_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                  Pendiente
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto:</span>
                <span className="font-semibold text-gray-900">
                  ${paymentData?.amount?.toLocaleString('es-CL')} CLP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="text-gray-900">
                  {new Date(paymentData?.created_at || Date.now()).toLocaleDateString('es-CL')}
                </span>
              </div>
            </div>
          </div>

          {/* Información sobre pagos pendientes */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Por qué está pendiente?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El banco está verificando la transacción</li>
              <li>• Puede tomar entre 1-3 días hábiles</li>
              <li>• Recibirás una notificación cuando se complete</li>
              <li>• El dinero puede aparecer temporalmente retenido</li>
            </ul>
          </div>

          {/* Actualización automática */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full"></div>
              <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full animation-delay-75"></div>
              <div className="animate-pulse w-2 h-2 bg-blue-600 rounded-full animation-delay-150"></div>
            </div>
            <p className="text-sm text-gray-600">
              Verificando estado automáticamente cada 10 segundos
            </p>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:bg-blue-400"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Verificando...' : 'Verificar Estado'}</span>
            </button>
            <Link
              to="/dashboard"
              className="flex-1 bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Continuar navegando
            </Link>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors w-full"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al Dashboard</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 