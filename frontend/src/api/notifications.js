import api from "./api.js";

// Obtener notificaciones del usuario
export const getUserNotifications = async () => {
  try {
    const response = await api.get("/notifications");
    return response.data;
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    throw error;
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (notificationType, referenceId = null) => {
  try {
    const response = await api.post("/notifications/read", {
      notificationType,
      referenceId
    });
    return response.data;
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    throw error;
  }
}; 