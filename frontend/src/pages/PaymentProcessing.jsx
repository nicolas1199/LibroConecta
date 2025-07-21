import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PaymentPolling, { usePaymentRedirect } from '../components/PaymentPolling';

export default function PaymentProcessing() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState(null);
  
  const paymentId = searchParams.get('payment_id');
  const preferenceId = searchParams.get('preference_id');
  const externalReference = searchParams.get('external_reference');
  const status = searchParams.get('status');
  
  // Determinar si viene desde MercadoPago (por back_urls) o desde nuestra app
  const isFromMercadoPago = !paymentId && externalReference;
  
  // Log de debug
  useEffect(() => {
    const allParams = {};
    for (const [key, value] of searchParams.entries()) {
      allParams[key] = value;
    }
    console.log('🔍 PaymentProcessing - Parámetros URL:', allParams);
    console.log('🔍 PaymentProcessing - Parámetros extraídos:', {
      paymentId,
      preferenceId,
      externalReference,
      status,
      isFromMercadoPago
    });
  }, [searchParams]);

  // Determinar qué tipo de polling usar
  const shouldUseExternalReference = isFromMercadoPago && externalReference && !paymentId;
  const identifierForPolling = shouldUseExternalReference ? externalReference : paymentId;
  const pollingEnabled = !!(identifierForPolling);

  console.log('🔍 Configuración de polling:', {
    shouldUseExternalReference,
    identifierForPolling,
    pollingEnabled,
    isFromMercadoPago
  });

  // Usar el hook de redirección automática
  const { status: pollStatus, error: redirectError } = usePaymentRedirect(
    identifierForPolling, 
    pollingEnabled, 
    shouldUseExternalReference
  );

      if (!pollingEnabled) {
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
              <p className="text-gray-600 mb-6">
                No se encontró información del pago para procesar
                <br />
                <small className="text-xs">
                  (payment_id: {paymentId || 'No'}, external_reference: {externalReference || 'No'})
                </small>
              </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Volver al Dashboard</span>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-xl shadow-lg overflow-hidden"
      >
        {/* Header */}
        <div className="bg-blue-50 px-8 py-6 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Procesando tu pago
          </h1>
          <p className="text-gray-600">
            Estamos verificando tu transacción con MercadoPago
          </p>
        </div>

        {/* Contenido principal */}
        <div className="p-8">
          <PaymentPolling 
            paymentId={paymentId}
            externalReference={externalReference}
            useExternalReference={shouldUseExternalReference}
            onError={setError}
          />

          {/* Información del pago */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Información del pago</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID de Pago:</span>
                <span className="font-mono text-gray-900 text-xs">
                  {paymentId || 'Se obtendrá del external_reference'}
                </span>
              </div>
              {externalReference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">External Reference:</span>
                  <span className="font-mono text-gray-900 text-xs">
                    {externalReference}
                  </span>
                </div>
              )}
              {preferenceId && (
                <div className="flex justify-between">
                  <span className="text-gray-600">ID de Preferencia:</span>
                  <span className="font-mono text-gray-900 text-xs">
                    {preferenceId}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Estado:</span>
                <span className="text-gray-900 capitalize">
                  {pollStatus === 'checking' ? 'Verificando' :
                   pollStatus === 'pending' ? 'Pendiente' :
                   pollStatus === 'completed' ? 'Completado' :
                   pollStatus === 'timeout' ? 'Tiempo agotado' :
                   pollStatus === 'error' ? 'Error' : pollStatus}
                </span>
              </div>
              {source && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuente:</span>
                  <span className="text-gray-900">
                    {isFromMercadoPago ? 'MercadoPago (back_url)' : 'LibroConecta App'}
                  </span>
                </div>
              )}
              {shouldUseExternalReference && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Método de Polling:</span>
                  <span className="text-gray-900">External Reference</span>
                </div>
              )}
            </div>
          </div>

          {/* Información adicional */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">¿Qué está pasando?</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• MercadoPago está procesando tu pago</li>
              <li>• Estamos verificando el estado cada 2 segundos</li>
              <li>• Te redirigiremos automáticamente cuando esté listo</li>
              <li>• Este proceso usualmente toma menos de 30 segundos</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex flex-col gap-3">
            <Link
              to="/dashboard"
              className="text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Volver al Dashboard
            </Link>
            
            {/* Debug info - solo en desarrollo */}
            {process.env.NODE_ENV === 'development' && (
              <Link
                to={`/payment/debug?${searchParams.toString()}`}
                className="text-xs text-gray-500 hover:text-gray-700 underline text-center"
              >
                🐛 Ver información de debug
              </Link>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
