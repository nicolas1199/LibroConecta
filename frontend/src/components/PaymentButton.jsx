import { useState } from 'react';
import { loadMercadoPago } from '@mercadopago/sdk-js';
import { createPaymentPreference } from '../api/payments.js';
import { DollarSign } from './icons/DollarSign';

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

      // Crear preferencia de pago
      const { data: preference } = await createPaymentPreference(publishedBookId);
      
      console.log('✅ Preferencia creada:', preference.preference_id);

      // Cargar SDK de MercadoPago
      await loadMercadoPago();

      // Crear checkout
      const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, {
        locale: 'es-CL'
      });

      // Configurar checkout
      const checkout = mp.checkout({
        preference: {
          id: preference.preference_id
        },
        render: {
          container: '.cho-container',
          label: 'Pagar con MercadoPago'
        }
      });

      setIsProcessing(true);

      // Abrir checkout en modal/redirect
      if (preference.init_point) {
        // Redireccionar a MercadoPago
        window.location.href = preference.init_point;
      }

    } catch (error) {
      console.error('❌ Error en el proceso de pago:', error);
      
      let errorMessage = 'Error procesando el pago';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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