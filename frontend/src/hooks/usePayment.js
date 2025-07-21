import { useState, useEffect, useCallback } from 'react';
import paymentService from '../services/paymentService';

/**
 * Hook personalizado para manejar pagos con MercadoPago
 */
export const usePayment = () => {
  const [mp, setMp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar MercadoPago
  useEffect(() => {
    const initMercadoPago = () => {
      const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY || 'TEST-1234567890';
      const mercadoPagoInstance = paymentService.initializeMercadoPago(publicKey);
      setMp(mercadoPagoInstance);
    };

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
  const createPreference = useCallback(async (publishedBookId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.createPaymentPreference(publishedBookId);
      return result.data;
    } catch (err) {
      setError(err.message || 'Error al crear la preferencia de pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Procesar pago directo
  const processPayment = useCallback(async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.processDirectPayment(paymentData);
      return result.data;
    } catch (err) {
      setError(err.message || 'Error al procesar el pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener estado del pago
  const getPaymentStatus = useCallback(async (paymentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.getPaymentStatus(paymentId);
      return result.data;
    } catch (err) {
      setError(err.message || 'Error al obtener el estado del pago');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener historial de pagos
  const getUserPayments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.getUserPayments(filters);
      return result.data;
    } catch (err) {
      setError(err.message || 'Error al obtener el historial de pagos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear botón de pago
  const createPaymentButton = useCallback((preferenceData, containerId) => {
    if (!mp) {
      console.error('MercadoPago no está inicializado');
      return null;
    }

    try {
      return paymentService.createPaymentButton(mp, preferenceData, containerId);
    } catch (err) {
      setError(err.message || 'Error al crear el botón de pago');
      throw err;
    }
  }, [mp]);

  // Crear formulario de pago
  const createPaymentForm = useCallback((preferenceData, containerId) => {
    if (!mp) {
      console.error('MercadoPago no está inicializado');
      return null;
    }

    try {
      return paymentService.createPaymentForm(mp, preferenceData, containerId);
    } catch (err) {
      setError(err.message || 'Error al crear el formulario de pago');
      throw err;
    }
  }, [mp]);

  return {
    mp,
    loading,
    error,
    createPreference,
    processPayment,
    getPaymentStatus,
    getUserPayments,
    createPaymentButton,
    createPaymentForm,
    clearError: () => setError(null)
  };
};

export default usePayment;
