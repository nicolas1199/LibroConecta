import api from '../api/config';

/**
 * Servicio para gestionar pagos con MercadoPago
 */
class PaymentService {
  /**
   * Crear preferencia de pago para un libro
   * @param {string} publishedBookId - ID del libro publicado
   * @returns {Promise<Object>} Datos de la preferencia de pago
   */
  async createPaymentPreference(publishedBookId) {
    try {
      const response = await api.post(`/payments/preferences/${publishedBookId}`);
      return response.data;
    } catch (error) {
      console.error('Error creando preferencia de pago:', error);
      throw error;
    }
  }

  /**
   * Procesar pago directo usando MercadoPago Payment API
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} Resultado del pago
   */
  async processDirectPayment(paymentData) {
    try {
      const response = await api.post('/payments/process', paymentData);
      return response.data;
    } catch (error) {
      console.error('Error procesando pago directo:', error);
      throw error;
    }
  }

  /**
   * Obtener estado de un pago
   * @param {string} paymentId - ID del pago
   * @returns {Promise<Object>} Estado del pago
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await api.get(`/payments/${paymentId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estado del pago:', error);
      throw error;
    }
  }

  /**
   * Obtener historial de pagos del usuario
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} Lista de pagos
   */
  async getUserPayments(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get(`/payments/user?${params}`);
      return response.data;
    } catch (error) {
      console.error('Error obteniendo historial de pagos:', error);
      throw error;
    }
  }

  /**
   * Inicializar MercadoPago SDK en el frontend
   * @param {string} publicKey - Clave pública de MercadoPago
   */
  initializeMercadoPago(publicKey) {
    if (typeof window !== 'undefined' && window.MercadoPago) {
      window.mp = new window.MercadoPago(publicKey);
      return window.mp;
    } else {
      console.error('MercadoPago SDK no está cargado');
      return null;
    }
  }

  /**
   * Crear formulario de pago con MercadoPago
   * @param {Object} mp - Instancia de MercadoPago
   * @param {Object} preferenceData - Datos de la preferencia
   * @param {string} containerId - ID del contenedor HTML
   */
  createPaymentForm(mp, preferenceData, containerId) {
    if (!mp) {
      console.error('MercadoPago no está inicializado');
      return;
    }

    try {
      return mp.checkout({
        preference: {
          id: preferenceData.preference_id
        },
        render: {
          container: `#${containerId}`,
          label: 'Pagar con MercadoPago'
        }
      });
    } catch (error) {
      console.error('Error creando formulario de pago:', error);
      throw error;
    }
  }

  /**
   * Crear botón de pago simple
   * @param {Object} mp - Instancia de MercadoPago
   * @param {Object} preferenceData - Datos de la preferencia
   * @param {string} containerId - ID del contenedor HTML
   */
  createPaymentButton(mp, preferenceData, containerId) {
    if (!mp) {
      console.error('MercadoPago no está inicializado');
      return;
    }

    try {
      return mp.bricks().create('wallet', {
        preference: {
          id: preferenceData.preference_id
        }
      }, containerId);
    } catch (error) {
      console.error('Error creando botón de pago:', error);
      throw error;
    }
  }
}

export default new PaymentService();
