import api from "./api.js";

// Obtener información del intercambio
export const getExchangeInfo = async (matchId) => {
  try {
    const response = await api.get(`/exchanges/${matchId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener información del intercambio:", error);
    throw error;
  }
};

// Completar intercambio
export const completeExchange = async (matchId) => {
  try {
    const response = await api.post(`/exchanges/${matchId}/complete`);
    return response.data;
  } catch (error) {
    console.error("Error al completar intercambio:", error);
    throw error;
  }
};
