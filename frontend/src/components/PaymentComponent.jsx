import React, { useState, useEffect } from 'react';
import paymentService from '../services/paymentService';

const PaymentComponent = ({ 
  publishedBookId, 
  bookInfo, 
  onSuccess, 
  onError, 
  onPending 
}) => {
  const [preference, setPreference] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mp, setMp] = useState(null);

  // Inicializar MercadoPago SDK
  useEffect(() => {
    const initMercadoPago = () => {
      // Obtener la clave pública desde las variables de entorno
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-1234567890';
      const mercadoPagoInstance = paymentService.initializeMercadoPago(publicKey);
      setMp(mercadoPagoInstance);
    };

    // Cargar el SDK de MercadoPago si no está disponible
    if (!window.MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.async = true;
      script.onload = initMercadoPago;
      document.head.appendChild(script);
    } else {
      initMercadoPago();
    }
  }, []);

  // Crear preferencia de pago
  const createPreference = async () => {
    setLoading(true);
    setError(null);

    try {
      const preferenceData = await paymentService.createPaymentPreference(publishedBookId);
      setPreference(preferenceData.data);
      
      // Crear el botón de pago una vez que tengamos la preferencia
      if (mp && preferenceData.data.preference_id) {
        setTimeout(() => {
          paymentService.createPaymentButton(
            mp, 
            preferenceData.data, 
            'payment-button-container'
          );
        }, 100);
      }
    } catch (err) {
      setError('Error al crear la preferencia de pago');
      console.error('Error:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  // Procesar pago directo (ejemplo usando el snippet)
  const processDirectPayment = async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.processDirectPayment(paymentData);
      
      if (result.data.status === 'approved') {
        if (onSuccess) onSuccess(result.data);
      } else if (result.data.status === 'pending') {
        if (onPending) onPending(result.data);
      } else {
        if (onError) onError(result.data);
      }
    } catch (err) {
      setError('Error al procesar el pago');
      console.error('Error:', err);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-component p-4 border rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Comprar Libro</h3>
        {bookInfo && (
          <div className="text-sm text-gray-600 mb-2">
            <p><strong>{bookInfo.title}</strong></p>
            <p>Autor: {bookInfo.author}</p>
            <p className="text-lg font-bold text-green-600">
              ${bookInfo.price?.toLocaleString('es-CL')}
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {!preference ? (
        <button
          onClick={createPreference}
          disabled={loading}
          className={`w-full py-2 px-4 rounded font-medium ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Cargando...' : 'Comprar con MercadoPago'}
        </button>
      ) : (
        <div>
          <div id="payment-button-container" className="mb-4">
            {/* Aquí se renderizará el botón de MercadoPago */}
          </div>
          
          {/* Información adicional */}
          <div className="text-xs text-gray-500 mt-2">
            <p>✅ Pago seguro con MercadoPago</p>
            <p>✅ Protección al comprador</p>
            <p>✅ Múltiples medios de pago</p>
          </div>
        </div>
      )}

      {/* Ejemplo de pago directo (para desarrollo/testing) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Pago de Prueba (Solo desarrollo)</h4>
          <button
            onClick={() => processDirectPayment({
              transaction_amount: bookInfo?.price || 100,
              description: `Compra de libro: ${bookInfo?.title || 'Libro de prueba'}`,
              payment_method_id: 'visa',
              token: 'test_token', // En producción esto vendría del formulario
              installments: 1,
              payer: {
                email: 'test@example.com'
              },
              external_reference: `LIBRO_${publishedBookId}_TEST_${Date.now()}`
            })}
            disabled={loading}
            className="w-full py-1 px-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded"
          >
            Pago de Prueba
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentComponent;
