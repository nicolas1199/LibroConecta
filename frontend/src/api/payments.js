import api from './api.js';

/**
 * Crear preferencia de pago para un libro
 * @param {number|string} publishedBookId - ID del libro publicado
 * @returns {Promise<Object>} Preferencia de pago
 */
export async function createPaymentPreference(publishedBookId) {
  try {
    console.log('🔍 Creando preferencia para libro:', publishedBookId);
    console.log('🔍 Token de auth:', localStorage.getItem('token') ? 'Presente' : 'Ausente');
    
    const response = await api.post(`/payments/preferences/${publishedBookId}`);
    console.log('✅ Respuesta de preferencia:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Error creando preferencia de pago:', error);
    console.error('❌ Detalles del error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url
    });
    throw error;
  }
}

/**
 * Obtener estado de un pago
 * @param {string} paymentId - ID del pago
 * @returns {Promise<Object>} Estado del pago
 */
export async function getPaymentStatus(paymentId) {
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
 * @param {Object} params - Parámetros de consulta
 * @param {string} params.type - Tipo: 'purchases', 'sales', 'all'
 * @param {string} params.status - Estado del pago
 * @param {number} params.limit - Límite de resultados
 * @param {number} params.offset - Offset para paginación
 * @returns {Promise<Object>} Historial de pagos
 */
export async function getUserPayments({ type = 'all', status, limit = 20, offset = 0 } = {}) {
  try {
    const params = new URLSearchParams();
    params.append('type', type);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());
    
    if (status) {
      params.append('status', status);
    }

    const response = await api.get(`/payments/user?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    throw error;
  }
} 