import { Op, QueryTypes } from "sequelize";
import { User, Message, Match, sequelize } from "../db/modelIndex.js";

// Servicio para obtener mensajes de una conversación
export async function getMessagesService(matchId, userId, options = {}) {
  try {
    const { limit = 50, offset = 0 } = options;

    // Verificar acceso al match
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Obtener mensajes
    const messages = await Message.findAll({
      where: {
        match_id: matchId,
        is_deleted: false,
      },
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: User,
          as: "Receiver",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
      order: [["sent_at", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Marcar mensajes como leídos automáticamente
    await markMessagesAsReadService(matchId, userId);

    return {
      messages,
      total: messages.length,
      match: {
        match_id: match.get("match_id"),
        date_match: match.get("date_match"),
      },
    };
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    throw error;
  }
}

// Servicio para enviar un mensaje
export async function sendMessageService(matchId, senderId, messageData) {
  try {
    // Verificar acceso al match
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: senderId }, { user_id_2: senderId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Determinar el receptor
    const receiverId =
      match.get("user_id_1") === senderId
        ? match.get("user_id_2")
        : match.get("user_id_1");

    // Validar el tipo de mensaje
    const messageType = messageData.message_type || 'text';
    
    if (messageType === 'text' && (!messageData.message_text || messageData.message_text.trim() === "")) {
      throw new Error("El mensaje de texto no puede estar vacío");
    }
    
    if (messageType === 'image' && (!messageData.image_data || messageData.image_data.trim() === "")) {
      throw new Error("Los datos de la imagen no pueden estar vacíos");
    }

    // Crear el mensaje
    const newMessage = await Message.create({
      sender_id: senderId,
      receiver_id: receiverId,
      match_id: matchId,
      message_text: messageData.message_text ? messageData.message_text.trim() : null,
      message_type: messageType,
      image_data: messageData.image_data || null,
      image_filename: messageData.image_filename || null,
      image_mimetype: messageData.image_mimetype || null,
      image_size: messageData.image_size || null,
      sent_at: new Date(),
    });

    // Obtener el mensaje con información de usuarios
    const messageId = newMessage.get("message_id");
    const messageWithUsers = await Message.findByPk(messageId, {
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: User,
          as: "Receiver",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
    });

    return messageWithUsers;
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
}

// Servicio para obtener todas las conversaciones del usuario
export async function getConversationsService(userId, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;

    // Consulta SQL compleja optimizada para PostgreSQL
    const conversations = await sequelize.query(
      `
      SELECT 
        m.match_id,
        m.user_id_1,
        m.user_id_2,
        m.date_match,
        u1.first_name AS user1_first_name,
        u1.last_name AS user1_last_name,
        u1.profile_image_base64 AS user1_profile_image,
        u2.first_name AS user2_first_name,
        u2.last_name AS user2_last_name,
        u2.profile_image_base64 AS user2_profile_image,
        last_msg.message_text AS last_message,
        last_msg.sent_at AS last_message_date,
        last_msg.sender_id AS last_message_sender_id,
        unread_count.count AS unread_count
      FROM "Match" m
      LEFT JOIN "Users" u1 ON m.user_id_1 = u1.user_id
      LEFT JOIN "Users" u2 ON m.user_id_2 = u2.user_id
      LEFT JOIN LATERAL (
        SELECT message_text, sent_at, sender_id
        FROM "Message"
        WHERE match_id = m.match_id AND is_deleted = false
        ORDER BY sent_at DESC
        LIMIT 1
      ) last_msg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::integer as count
        FROM "Message"
        WHERE match_id = m.match_id 
          AND receiver_id = :userId 
          AND read_at IS NULL 
          AND is_deleted = false
      ) unread_count ON true
      WHERE (m.user_id_1 = :userId OR m.user_id_2 = :userId)
      ORDER BY COALESCE(last_msg.sent_at, m.date_match) DESC
      LIMIT :limit OFFSET :offset
    `,
      {
        replacements: {
          userId: userId,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
        type: QueryTypes.SELECT,
      }
    );

    // Formatear las conversaciones
    const formattedConversations = conversations.map((conv) => {
      const otherUser =
        conv.user_id_1 === userId
          ? {
              user_id: conv.user_id_2,
              first_name: conv.user2_first_name,
              last_name: conv.user2_last_name,
              profile_image_base64: conv.user2_profile_image,
            }
          : {
              user_id: conv.user_id_1,
              first_name: conv.user1_first_name,
              last_name: conv.user1_last_name,
              profile_image_base64: conv.user1_profile_image,
            };

      return {
        match_id: conv.match_id,
        date_match: conv.date_match,
        other_user: otherUser,
        last_message: {
          text: conv.last_message,
          date: conv.last_message_date,
          sender_id: conv.last_message_sender_id,
          is_from_me: conv.last_message_sender_id === userId,
        },
        unread_count: conv.unread_count || 0,
      };
    });

    return {
      conversations: formattedConversations,
      total: conversations.length,
    };
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    throw error;
  }
}

// Servicio para marcar mensajes como leídos
export async function markMessagesAsReadService(matchId, userId) {
  try {
    // Verificar acceso al match
    const match = await Match.findOne({
      where: {
        match_id: matchId,
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    if (!match) {
      throw new Error("Match no encontrado o no autorizado");
    }

    // Marcar mensajes como leídos
    const [affectedRows] = await Message.update(
      { read_at: new Date() },
      {
        where: {
          match_id: matchId,
          receiver_id: userId,
          read_at: null,
          is_deleted: false,
        },
      }
    );

    return {
      marked_as_read: affectedRows,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
    throw error;
  }
}

// Servicio para eliminar un mensaje
export async function deleteMessageService(messageId, userId) {
  try {
    const message = await Message.findByPk(messageId);

    if (!message) {
      throw new Error("Mensaje no encontrado");
    }

    // Verificar que el usuario es el propietario del mensaje
    if (message.get("sender_id") !== userId) {
      throw new Error("No tienes permisos para eliminar este mensaje");
    }

    // Marcar como eliminado (soft delete)
    await message.update({
      is_deleted: true,
      updated_at: new Date(),
    });

    return {
      deleted: true,
      message_id: messageId,
    };
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    throw error;
  }
}

// Servicio para obtener estadísticas de mensajes
export async function getMessageStatsService(userId) {
  try {
    // Total de conversaciones
    const totalConversations = await Match.count({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
    });

    // Mensajes no leídos
    const unreadMessages = await Message.count({
      where: {
        receiver_id: userId,
        read_at: null,
        is_deleted: false,
      },
    });

    // Mensajes enviados (último mes)
    const sentMessages = await Message.count({
      where: {
        sender_id: userId,
        is_deleted: false,
        sent_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
    });

    // Mensajes recibidos (último mes)
    const receivedMessages = await Message.count({
      where: {
        receiver_id: userId,
        is_deleted: false,
        sent_at: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        },
      },
    });

    return {
      totalConversations,
      unreadMessages,
      sentMessages,
      receivedMessages,
    };
  } catch (error) {
    console.error("Error al obtener estadísticas de mensajes:", error);
    throw error;
  }
}

// Servicio para buscar mensajes
export async function searchMessagesService(userId, searchTerm, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;

    // Obtener IDs de matches del usuario
    const userMatches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: userId }, { user_id_2: userId }],
      },
      attributes: ["match_id"],
    });

    const matchIds = userMatches.map((match) => match.get("match_id"));

    if (matchIds.length === 0) {
      return { messages: [], total: 0 };
    }

    // Buscar mensajes que contengan el término
    const messages = await Message.findAll({
      where: {
        match_id: { [Op.in]: matchIds },
        message_text: {
          [Op.iLike]: `%${searchTerm}%`, // Búsqueda case-insensitive
        },
        is_deleted: false,
      },
      include: [
        {
          model: User,
          as: "Sender",
          attributes: ["user_id", "first_name", "last_name"],
        },
        {
          model: Match,
          include: [
            {
              model: User,
              as: "User1",
              attributes: ["user_id", "first_name", "last_name"],
            },
            {
              model: User,
              as: "User2",
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
      ],
      order: [["sent_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      messages,
      total: messages.length,
      searchTerm,
    };
  } catch (error) {
    console.error("Error al buscar mensajes:", error);
    throw error;
  }
}
