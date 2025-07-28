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
  onPaymentError,
  usePopup = true // 🆕 Nueva opción para usar popup
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentWindow, setPaymentWindow] = useState(null);

  // 🆕 Función para manejar el popup de pago
  const openPaymentPopup = (url, externalReference) => {
    const popup = window.open(
      url,
      'mercadopago_payment',
      'width=800,height=700,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );
    
    setPaymentWindow(popup);
    
    // Monitorear el popup más frecuentemente y detectar redirecciones
    const checkPopup = setInterval(() => {
      try {
        // Verificar si el popup fue cerrado
        if (popup.closed) {
          console.log('🪟 Popup cerrado por usuario, verificando estado del pago...');
          clearInterval(checkPopup);
          setPaymentWindow(null);
          
          // Redirigir a processing con más información
          window.location.href = `/payment/processing?external_reference=${externalReference}&source=popup_closed&timestamp=${Date.now()}`;
          return;
        }

        // Intentar detectar redirecciones de MercadoPago (auto_return)
        try {
          const popupUrl = popup.location.href;
          console.log('🔍 URL actual del popup:', popupUrl);
          
          // Si detectamos que MercadoPago redirigió a nuestra URL
          if (popupUrl && (popupUrl.includes('/payment/processing') || popupUrl.includes('/payment/success'))) {
            console.log('✅ Auto_return detectado, cerrando popup...');
            popup.close();
            clearInterval(checkPopup);
            setPaymentWindow(null);
            
            // Extraer parámetros de la URL del popup
            const urlObj = new URL(popupUrl);
            const params = urlObj.searchParams.toString();
            
            // Redirigir con los parámetros del auto_return
            window.location.href = `/payment/processing?${params}&source=auto_return`;
            return;
          }
        } catch (crossOriginError) {
          // Es normal que esto falle por cross-origin, seguir monitoreando
        }
        
      } catch (error) {
        console.log('🔍 Error monitoreando popup (normal):', error.message);
      }
    }, 500); // Verificar cada 500ms para mejor detección
    
    return popup;
  };

  const handlePayment = async () => {
    if (isLoading || isProcessing || disabled) return;

    try {
      setIsLoading(true);
      onPaymentStart?.();

      console.log('🛒 Iniciando proceso de pago para libro:', publishedBookId);
      console.log('🔧 URL API configurada:', import.meta.env.VITE_API_URL);
      console.log('🔑 Public Key configurada:', import.meta.env.VITE_MP_PUBLIC_KEY);
      console.log('🪟 Modo popup:', usePopup);

      // Crear preferencia de pago
      const response = await createPaymentPreference(publishedBookId);
      const preference = response.data; // Extraer data de la respuesta
      
      console.log('✅ Respuesta completa:', response);
      console.log('✅ Preference data:', preference);
      console.log('✅ Preferencia creada:', preference.preference_id);
      console.log('✅ Init point:', preference.init_point);

      if (preference.init_point) {
        if (usePopup) {
          // 🆕 Abrir en popup
          console.log('🪟 Abriendo pago en popup:', preference.init_point);
          
          // Usar external_reference del backend
          const externalRef = preference.external_reference;
          
          openPaymentPopup(preference.init_point, externalRef);
          setIsProcessing(true); // Mantener botón en estado "procesando"
        } else {
          // Redirección tradicional
          console.log('🚀 Redirigiendo a:', preference.init_point);
          window.location.href = preference.init_point;
        }
      } else {
        console.error('❌ No hay init_point en la preferencia:', preference);
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
      if (!usePopup) {
        setIsLoading(false);
        setIsProcessing(false);
      } else {
        setIsLoading(false);
        // No resetear isProcessing si es popup - se mantiene hasta que se cierre
      }
    }
  };

  // 🆕 Cleanup al desmontar componente
  const handleClosePayment = () => {
    if (paymentWindow && !paymentWindow.closed) {
      paymentWindow.close();
    }
    setPaymentWindow(null);
    setIsProcessing(false);
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

      {/* 🆕 Botón para cancelar pago en popup */}
      {usePopup && isProcessing && paymentWindow && (
        <button
          onClick={handleClosePayment}
          className="mt-2 text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Cancelar pago
        </button>
      )}

      {/* Contenedor para el checkout (si se usa modo embebido) */}
      <div className="cho-container hidden"></div>
    </>
  );
} 