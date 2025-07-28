import { getUserNotificationsService, markNotificationAsReadService } from "../services/Notification.service.js";
import { createResponse } from "../utils/responses.util.js";

// Obtener notificaciones del usuario
export const getUserNotifications = async (req, res) => {
  try {
    const { user_id } = req.user;

    const notifications = await getUserNotificationsService(user_id);

    return res.json(
      createResponse(200, "Notificaciones obtenidas exitosamente", notifications, null)
    );
  } catch (error) {
    console.error("Error al obtener notificaciones:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

// Marcar notificación como leída
export const markNotificationAsRead = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { notificationType, referenceId } = req.body;

    if (!notificationType) {
      return res.status(400).json(
        createResponse(400, "Tipo de notificación es requerido", null, null)
      );
    }

    await markNotificationAsReadService(user_id, notificationType, referenceId);

    return res.json(
      createResponse(200, "Notificación marcada como leída", null, null)
    );
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
}; 