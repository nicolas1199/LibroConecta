import { Op } from "sequelize";
import { Match, User, Message, Rating, ChatRequest, sequelize } from "../db/modelIndex.js";

// Servicio para obtener notificaciones del usuario
export async function getUserNotificationsService(userId) {
  try {
    const notifications = [];

    // 1. Solicitudes de chat pendientes
    const pendingChatRequests = await ChatRequest.count({
      where: {
        receiver_id: userId,
        status: "pending"
      }
    });

    if (pendingChatRequests > 0) {
      notifications.push({
        type: "chat_request",
        title: "Solicitudes de chat pendientes",
        message: `Tienes ${pendingChatRequests} solicitud${pendingChatRequests > 1 ? 'es' : ''} de chat pendiente${pendingChatRequests > 1 ? 's' : ''}`,
        count: pendingChatRequests,
        priority: 1
      });
    }

    // 2. Mensajes no leídos
    const unreadMessages = await Message.count({
      where: {
        receiver_id: userId,
        read_at: null,
        is_deleted: false
      }
    });

    if (unreadMessages > 0) {
      notifications.push({
        type: "unread_message",
        title: "Mensajes no leídos",
        message: `Tienes ${unreadMessages} mensaje${unreadMessages > 1 ? 's' : ''} sin leer`,
        count: unreadMessages,
        priority: 2
      });
    }

    // 3. Nuevos matches (menos de 24 horas)
    const newMatches = await Match.count({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
        date_match: {
          [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
        }
      }
    });

    if (newMatches > 0) {
      notifications.push({
        type: "new_match",
        title: "Nuevos matches",
        message: `Tienes ${newMatches} nuevo${newMatches > 1 ? 's' : ''} match${newMatches > 1 ? 'es' : ''}`,
        count: newMatches,
        priority: 3
      });
    }

    // 4. Calificaciones pendientes
    const pendingRatings = await sequelize.query(`
      SELECT COUNT(*) as count FROM (
        SELECT DISTINCT
          CASE 
            WHEN m.user_id_1 = :userId THEN m.user_id_2
            ELSE m.user_id_1
          END as other_user_id
        FROM "Match" m
        WHERE (m.user_id_1 = :userId OR m.user_id_2 = :userId)
          AND NOT EXISTS (
            SELECT 1 FROM "Rating" r 
            WHERE r.rater_id = :userId 
              AND r.match_id = m.match_id
              AND r.rated_id = CASE 
                WHEN m.user_id_1 = :userId THEN m.user_id_2
                ELSE m.user_id_1
              END
          )
      ) as pending
    `, {
      replacements: { userId },
      type: sequelize.QueryTypes.SELECT
    });

    const pendingRatingsCount = pendingRatings[0]?.count || 0;

    if (pendingRatingsCount > 0) {
      notifications.push({
        type: "pending_rating",
        title: "Calificaciones pendientes",
        message: `Tienes ${pendingRatingsCount} calificación${pendingRatingsCount > 1 ? 'es' : ''} pendiente${pendingRatingsCount > 1 ? 's' : ''}`,
        count: pendingRatingsCount,
        priority: 4
      });
    }

    // Ordenar por prioridad
    notifications.sort((a, b) => a.priority - b.priority);

    return {
      notifications,
      total: notifications.reduce((sum, notif) => sum + notif.count, 0),
      summary: {
        chatRequests: pendingChatRequests,
        unreadMessages,
        newMatches,
        pendingRatings: pendingRatingsCount
      }
    };
  } catch (error) {
    console.error("Error al obtener notificaciones del usuario:", error);
    throw error;
  }
}

// Servicio para crear notificación de nuevo match
export async function createMatchNotificationService(matchId, userId1, userId2) {
  try {
    // Obtener información del match
    const match = await Match.findByPk(matchId, {
      include: [
        {
          model: User,
          as: "User1",
          attributes: ["user_id", "first_name", "last_name"]
        },
        {
          model: User,
          as: "User2",
          attributes: ["user_id", "first_name", "last_name"]
        }
      ]
    });

    if (!match) {
      throw new Error("Match no encontrado");
    }

    // Crear notificación para ambos usuarios
    const notifications = [];

    // Notificación para user1
    if (match.User2) {
      notifications.push({
        type: "new_match",
        title: "¡Nuevo Match!",
        message: `Tienes un nuevo match con ${match.User2.first_name} ${match.User2.last_name}`,
        userId: userId1,
        matchId: matchId,
        timestamp: new Date()
      });
    }

    // Notificación para user2
    if (match.User1) {
      notifications.push({
        type: "new_match",
        title: "¡Nuevo Match!",
        message: `Tienes un nuevo match con ${match.User1.first_name} ${match.User1.last_name}`,
        userId: userId2,
        matchId: matchId,
        timestamp: new Date()
      });
    }

    return notifications;
  } catch (error) {
    console.error("Error al crear notificación de match:", error);
    throw error;
  }
}

// Servicio para marcar notificación como leída
export async function markNotificationAsReadService(userId, notificationType, referenceId = null) {
  try {
    // Aquí podrías implementar una tabla de notificaciones para tracking
    // Por ahora, solo registramos en logs
    console.log(`Notificación marcada como leída: ${notificationType} para usuario ${userId}`);
    
    return { success: true };
  } catch (error) {
    console.error("Error al marcar notificación como leída:", error);
    throw error;
  }
} 