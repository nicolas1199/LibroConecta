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

// Obtener historial de intercambios
export const getExchangeHistory = async () => {
  try {
    const response = await api.get("/exchanges/history");
    return response.data;
  } catch (error) {
    console.error("Error al obtener historial de intercambios:", error);
    throw error;
  }
};
