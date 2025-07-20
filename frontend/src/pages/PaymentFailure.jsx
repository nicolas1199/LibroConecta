import { useState, useEffect } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPaymentStatus } from '../api/payments.js';

// Icons - importación individual
import X from '../components/icons/X';
import ArrowLeft from '../components/icons/ArrowLeft';
import RefreshCw from '../components/icons/RefreshCw';
import BookOpen from '../components/icons/BookOpen';

export default function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const collectionId = searchParams.get('collection_id');
  const collectionStatus = searchParams.get('collection_status');

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!paymentId) {
        setError('No se encontró información del pago');
        setLoading(false);
        return;
      }

      try {
        const { data: payment } = await getPaymentStatus(paymentId);
        setPaymentData(payment);
      } catch (err) {
        console.error('Error obteniendo datos del pago:', err);
        setError('Error al obtener información del pago');
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentData();
  }, [paymentId]);

  // Redireccionar si no hay payment_id
  if (!paymentId) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando estado del pago...</p>
        </div>
      </div>
    );
  }

  const book = paymentData?.PublishedBook?.Book;
  const seller = paymentData?.Seller;

  // Obtener mensaje de error según el estado
  const getErrorMessage = (status) => {
    const messages = {
      'rejected': 'El pago fue rechazado por la entidad financiera.',
      'cancelled': 'El pago fue cancelado.',
      'failed': 'Ocurrió un error durante el procesamiento del pago.',
      'pending': 'El pago está pendiente de aprobación.'
    };
    return messages[status] || 'No se pudo procesar el pago.';
  };

  const getErrorReason = (status) => {
    const reasons = {
      'rejected': [
        'Fondos insuficientes',
        'Tarjeta bloqueada o vencida',
        'Límite de compra excedido',
        'Datos incorrectos'
      ],
      'cancelled': [
        'Operación cancelada por el usuario',
        'Tiempo de sesión agotado'
      ],
      'failed': [
        'Error técnico temporal',
        'Problemas de conexión',
        'Error del sistema de pagos'
      ]
    };
    return reasons[status] || ['Error desconocido'];
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header de error */}
        <div className="bg-red-50 px-8 py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Pago no procesado
          </h1>
          <p className="text-gray-600">
            {getErrorMessage(paymentData?.status || 'failed')}
          </p>
        </div>

        {/* Detalles del error */}
        <div className="p-8 space-y-6">
          {/* Información del libro */}
          {book && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-gray-600" />
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

          {/* Posibles razones */}
          <div className="border-l-4 border-orange-400 bg-orange-50 p-4">
            <h3 className="font-semibold text-orange-900 mb-2">Posibles causas:</h3>
            <ul className="text-sm text-orange-800 space-y-1">
              {getErrorReason(paymentData?.status || 'failed').map((reason, index) => (
                <li key={index}>• {reason}</li>
              ))}
            </ul>
          </div>

          {/* Detalles técnicos */}
          {paymentData && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-3">Información técnica</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Pago:</span>
                  <span className="font-mono text-gray-900">
                    {paymentData.payment_id}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    {paymentData.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Monto:</span>
                  <span className="text-gray-900">
                    ${paymentData.amount?.toLocaleString('es-CL')} CLP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="text-gray-900">
                    {new Date(paymentData.created_at).toLocaleDateString('es-CL')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Qué puedes hacer?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Verifica que tu tarjeta tenga fondos suficientes</li>
              <li>• Intenta con otro método de pago</li>
              <li>• Contacta a tu banco si el problema persiste</li>
              <li>• Prueba nuevamente en unos minutos</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to={`/book/${paymentData?.published_book_id || ''}`}
              className="flex-1 bg-green-600 text-white text-center py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Intentar de nuevo</span>
            </Link>
            <Link
              to="/dashboard/explore"
              className="flex-1 bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Buscar otros libros
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