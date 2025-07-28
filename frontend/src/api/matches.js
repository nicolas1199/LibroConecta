import api from "./api.js";

// Obtener matches del usuario
export const getMatches = async (params = {}) => {
  try {
    const response = await api.get("/matches", { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener matches:", error);
    throw error;
  }
};

// Obtener información de un match específico
export const getMatchInfo = async (matchId) => {
  try {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener información del match:", error);
    throw error;
  }
};

// Obtener matches sugeridos
export const getSuggestedMatches = async (params = {}) => {
  try {
    const response = await api.get("/matches/suggested", { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener matches sugeridos:", error);
    throw error;
  }
};

// Crear un nuevo match
export const createMatch = async (targetUserId) => {
  try {
    const response = await api.post("/matches", {
      target_user_id: targetUserId,
    });
    return response.data;
  } catch (error) {
    console.error("Error al crear match:", error);
    throw error;
  }
};

// Eliminar un match
export const deleteMatch = async (matchId) => {
  try {
    const response = await api.delete(`/matches/${matchId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar match:", error);
    throw error;
  }
}; 