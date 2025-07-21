import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';

const POLLING_INTERVAL = 2000; // 2 segundos
const MAX_POLLING_TIME = 300000; // 5 minutos

/**
 * Hook personalizado para manejar la redirección automática después del pago
 * @param {string} identifier - ID del pago o external_reference a monitorear
 * @param {boolean} enabled - Si el polling debe estar activo
 * @param {boolean} useExternalReference - Si debe usar external_reference en lugar de payment_id
 */
export function usePaymentRedirect(identifier, enabled = true, useExternalReference = false) {
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!identifier || !enabled) return;

    let pollCount = 0;
    const maxPolls = MAX_POLLING_TIME / POLLING_INTERVAL;
    
    console.log(`🔄 Iniciando polling para ${useExternalReference ? 'external_reference' : 'payment_id'}: ${identifier}`);

    const checkPaymentStatus = async () => {
      try {
        // Construir la URL según el tipo de identificador
        const endpoint = useExternalReference 
          ? `/payments/reference/${identifier}/redirect-status`
          : `/payments/${identifier}/redirect-status`;
          
        const response = await api.get(endpoint);
        const data = response.data;

        console.log(`📊 Estado del ${useExternalReference ? 'external_reference' : 'pago'} ${identifier}:`, data);

        if (data.success && data.data.ready) {
          console.log(`✅ Pago completado, redirigiendo...`);
          setStatus('completed');
          
          // Extraer parámetros de la URL de redirección
          const url = new URL(data.data.redirectUrl);
          const searchParams = url.searchParams.toString();
          
          // Navegar a la página de éxito
          navigate(`/payment/success?${searchParams}`);
          return true; // Detener polling
        } else {
          setStatus(data.data.status || 'pending');
          pollCount++;
          
          if (pollCount >= maxPolls) {
            console.log(`⏰ Timeout del polling para ${useExternalReference ? 'external_reference' : 'pago'}: ${identifier}`);
            setStatus('timeout');
            setError('El tiempo de espera ha expirado');
            return true; // Detener polling
          }
          
          return false; // Continuar polling
        }
      } catch (err) {
        console.error(`❌ Error verificando estado del ${useExternalReference ? 'external_reference' : 'pago'} ${identifier}:`, err);
        setError(err.message);
        pollCount++;
        
        // Si hay muchos errores consecutivos, detener
        if (pollCount >= 5) {
          setStatus('error');
          return true;
        }
        
        return false;
      }
    };

    // Verificar inmediatamente
    checkPaymentStatus().then(shouldStop => {
      if (shouldStop) return;

      // Configurar polling
      const interval = setInterval(async () => {
        const shouldStop = await checkPaymentStatus();
        if (shouldStop) {
          clearInterval(interval);
        }
      }, POLLING_INTERVAL);

      // Cleanup
      return () => {
        clearInterval(interval);
      };
    });

  }, [identifier, enabled, useExternalReference, navigate]);

  return { status, error };
}

/**
 * Componente que muestra el estado del pago mientras se procesa
 */
export default function PaymentPolling({ 
  paymentId, 
  externalReference, 
  useExternalReference = false, 
  onComplete, 
  onError 
}) {
  const identifier = useExternalReference ? externalReference : paymentId;
  const { status, error } = usePaymentRedirect(identifier, !!identifier, useExternalReference);

  if (error) {
    onError?.(error);
    return (
      <div className="text-center p-8">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error verificando pago</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center p-8">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Procesando pago...</h3>
        <p className="text-gray-600 mb-4">
          {status === 'checking' && 'Verificando el estado de tu pago'}
          {status === 'pending' && 'Tu pago está siendo procesado'}
          {status === 'timeout' && 'El pago está tardando más de lo esperado'}
          {status === 'completed' && 'Pago completado, redirigiendo...'}
        </p>
        <div className="w-64 bg-gray-200 rounded-full h-2 mx-auto">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: status === 'completed' ? '100%' : 
                     status === 'timeout' ? '95%' : '60%' 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
