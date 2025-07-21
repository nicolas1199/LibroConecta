import { useState } from 'react';
import { createPaymentPreference } from '../api/payments.js';
import DollarSign from './icons/DollarSign';

export default function PaymentButton({ 
  publishedBookId, 
  bookTitle, 
  bookAuthor, 
  price, 
  className = "", 
  disabled = false,
  onPaymentStart,
  onPaymentSuccess,
  onPaymentError 
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (isLoading || isProcessing || disabled) return;

    try {
      setIsLoading(true);
      onPaymentStart?.();

      console.log('🛒 Iniciando proceso de pago para libro:', publishedBookId);
      console.log('🔧 URL API configurada:', import.meta.env.VITE_API_URL);
      console.log('🔑 Public Key configurada:', import.meta.env.VITE_MP_PUBLIC_KEY);

      // Crear preferencia de pago
      const { data: preference } = await createPaymentPreference(publishedBookId);
      
      console.log('✅ Preferencia creada:', preference.preference_id);
      console.log('✅ Init point:', preference.init_point);

      // Redirigir directamente a MercadoPago
      if (preference.init_point) {
        window.location.href = preference.init_point;
      } else {
        throw new Error('No se pudo obtener el link de pago');
      }

    } catch (error) {
      console.error('❌ Error en el proceso de pago:', error);
      console.error('❌ Error completo:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          baseURL: error.config?.baseURL
        }
      });
      
      let errorMessage = 'Error procesando el pago';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      onPaymentError?.(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button
        onClick={handlePayment}
        disabled={isLoading || isProcessing || disabled}
        className={`
          flex items-center justify-center space-x-2 px-6 py-3 rounded-lg font-semibold text-white
          ${isLoading || isProcessing 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 transition-colors'
          }
          ${className}
        `}
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Preparando pago...</span>
          </>
        ) : isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Procesando...</span>
          </>
        ) : (
          <>
            <DollarSign className="h-5 w-5" />
            <span>Comprar por ${price?.toLocaleString('es-CL')}</span>
          </>
        )}
      </button>

      {/* Contenedor para el checkout (si se usa modo embebido) */}
      <div className="cho-container hidden"></div>
    </>
  );
} 