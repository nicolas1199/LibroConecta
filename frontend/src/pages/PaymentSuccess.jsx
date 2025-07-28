import { useState, useEffect } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getPaymentStatus } from '../api/payments.js';

// Icons - importación individual
import CheckCircle from '../components/icons/CheckCircle';
import BookOpen from '../components/icons/BookOpen';
import ArrowLeft from '../components/icons/ArrowLeft';
import X from '../components/icons/X';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const paymentId = searchParams.get('payment_id');
  const collectionId = searchParams.get('collection_id');
  const collectionStatus = searchParams.get('collection_status');
  const preference_id = searchParams.get('preference_id');

  // Log de debug para ver todos los parámetros
  useEffect(() => {
    const allParams = {};
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }
    console.log('🔍 PaymentSuccess - Parámetros URL:', allParams);
  }, [searchParams]);

  useEffect(() => {
    const fetchPaymentData = async () => {
      if (!paymentId) {
        setError('No se encontró información del pago');
        setLoading(false);
        return;
      }

      try {
        console.log('🔍 Obteniendo estado del pago:', paymentId);
        const { data: payment } = await getPaymentStatus(paymentId);
        console.log('💳 Datos del pago recibidos:', payment);
        setPaymentData(payment);
        
        // Si el pago aún está pendiente, intentar refrescar en unos segundos
        if (payment.status === 'pending') {
          console.log('⏳ Pago pendiente, reintentando en 3 segundos...');
          setTimeout(() => {
            fetchPaymentData();
          }, 3000);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error obteniendo datos del pago:', err);
        
        // Si es 404, es posible que el pago aún no se haya sincronizado
        if (err.response?.status === 404) {
          console.log('⏳ Pago no encontrado, reintentando en 2 segundos...');
          setTimeout(() => {
            fetchPaymentData();
          }, 2000);
        } else {
          setError('Error al obtener información del pago');
          setLoading(false);
        }
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando pago...</p>
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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header de éxito */}
        <div className="bg-green-50 px-8 py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Pago Exitoso!
          </h1>
          <p className="text-gray-600">
            Tu compra se ha procesado correctamente
          </p>
        </div>

        {/* Detalles del pago */}
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
                    Vendido por: {seller?.first_name} {seller?.last_name}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Detalles del pago */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Detalles del Pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID de Pago:</span>
                <span className="font-mono text-gray-900">
                  {paymentData?.mp_payment_id || paymentData?.payment_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monto:</span>
                <span className="font-semibold text-gray-900">
                  ${paymentData?.amount?.toLocaleString('es-CL')} CLP
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Método de Pago:</span>
                <span className="text-gray-900 capitalize">
                  {paymentData?.payment_method || 'MercadoPago'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Pagado
                </span>
              </div>
              {paymentData?.payment_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha:</span>
                  <span className="text-gray-900">
                    {new Date(paymentData.payment_date).toLocaleDateString('es-CL')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">¿Qué sigue?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• El vendedor será notificado de tu compra</li>
              <li>• Podrás coordinar la entrega mediante el chat</li>
              <li>• Recibirás una confirmación por email</li>
              <li>• Puedes ver el estado en tu historial de transacciones</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard/messages"
              className="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Contactar Vendedor
            </Link>
            <Link
              to="/dashboard/history"
              className="flex-1 bg-gray-100 text-gray-700 text-center py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Ver Historial
            </Link>
          </div>

          {/* Debug info - solo en desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="border-t pt-4">
              <Link
                to={`/payment/debug?${searchParams.toString()}`}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                🐛 Ver información de debug
              </Link>
            </div>
          )}

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