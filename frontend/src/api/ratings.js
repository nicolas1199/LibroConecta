import api from "./api.js";

// Obtener mis calificaciones (recibidas o dadas)
export const getMyRatings = async (params = {}) => {
  try {
    const response = await api.get("/ratings/my", { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener mis calificaciones:", error);
    throw error;
  }
};

// Obtener calificaciones pendientes
export const getPendingRatings = async () => {
  try {
    const response = await api.get("/ratings/pending");
    return response.data;
  } catch (error) {
    console.error("Error al obtener calificaciones pendientes:", error);
    throw error;
  }
};

// Obtener calificaciones de un usuario específico
export const getUserRatings = async (userId, params = {}) => {
  try {
    const response = await api.get(`/ratings/user/${userId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener calificaciones del usuario:", error);
    throw error;
  }
};

// Crear una nueva calificación
export const createRating = async (ratingData) => {
  try {
    const response = await api.post("/ratings", ratingData);
    return response.data;
  } catch (error) {
    console.error("Error al crear calificación:", error);
    throw error;
  }
};

// Actualizar una calificación
export const updateRating = async (ratingId, ratingData) => {
  try {
    const response = await api.put(`/ratings/${ratingId}`, ratingData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar calificación:", error);
    throw error;
  }
};

// Eliminar una calificación
export const deleteRating = async (ratingId) => {
  try {
    const response = await api.delete(`/ratings/${ratingId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar calificación:", error);
    throw error;
  }
}; 