import { Op } from "sequelize";
import { User, Message, Match, sequelize } from "../db/modelIndex.js";
import { createResponse } from "../utils/responses.util.js";

export const getMessages = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { match_id } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verificar que el usuario tiene acceso al match
    const match = await Match.findOne({
      where: {
        match_id,
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
    });

    if (!match) {
      return res
        .status(404)
        .json(
          createResponse(404, "Match no encontrado o no autorizado", null, null)
        );
    }

    // Obtener mensajes del match
    const messages = await Message.findAll({
      where: {
        match_id,
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

    // Marcar mensajes como leídos si el usuario es el receptor
    const unreadMessages = messages.filter(
      (message) => message.receiver_id === user_id && !message.read_at
    );

    if (unreadMessages.length > 0) {
      await Message.update(
        { read_at: new Date() },
        {
          where: {
            message_id: {
              [Op.in]: unreadMessages.map((msg) => msg.message_id),
            },
          },
        }
      );
    }

    return res.json(
      createResponse(200, "Mensajes obtenidos exitosamente", messages, null, {
        total: messages.length,
        unread_count: unreadMessages.length,
      })
    );
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { match_id } = req.params;
    const { message_text } = req.body;

    if (!message_text || message_text.trim() === "") {
      return res
        .status(400)
        .json(
          createResponse(400, "El mensaje no puede estar vacío", null, null)
        );
    }

    // Verificar que el usuario tiene acceso al match
    const match = await Match.findOne({
      where: {
        match_id,
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
    });

    if (!match) {
      return res
        .status(404)
        .json(
          createResponse(404, "Match no encontrado o no autorizado", null, null)
        );
    }

    // Determinar el receptor (el otro usuario en el match)
    const receiver_id =
      match.get("user_id_1") === user_id
        ? match.get("user_id_2")
        : match.get("user_id_1");

    // Crear el mensaje
    const newMessage = await Message.create({
      sender_id: user_id,
      receiver_id,
      match_id,
      message_text: message_text.trim(),
      sent_at: new Date(),
    });

    // Obtener el mensaje creado con información de los usuarios
    const messageWithUsers = await Message.findByPk(newMessage.message_id, {
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

    return res
      .status(201)
      .json(
        createResponse(
          201,
          "Mensaje enviado exitosamente",
          messageWithUsers,
          null
        )
      );
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const getConversations = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { limit = 20, offset = 0 } = req.query;

    // Obtener todas las conversaciones del usuario
    const conversations = await sequelize.query(
      `
      SELECT 
        m.match_id,
        m.user_id_1,
        m.user_id_2,
        m.date_match,
        u1.first_name AS user1_first_name,
        u1.last_name AS user1_last_name,
        u2.first_name AS user2_first_name,
        u2.last_name AS user2_last_name,
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
          userId: user_id,
          limit: parseInt(limit),
          offset: parseInt(offset),
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    // Formatear respuesta
    const formattedConversations = conversations.map((conv) => {
      const otherUser =
        conv.user_id_1 === user_id
          ? {
              user_id: conv.user_id_2,
              first_name: conv.user2_first_name,
              last_name: conv.user2_last_name,
            }
          : {
              user_id: conv.user_id_1,
              first_name: conv.user1_first_name,
              last_name: conv.user1_last_name,
            };

      return {
        match_id: conv.match_id,
        date_match: conv.date_match,
        other_user: otherUser,
        last_message: conv.last_message,
        last_message_date: conv.last_message_date,
        last_message_sender_id: conv.last_message_sender_id,
        unread_count: conv.unread_count || 0,
      };
    });

    return res.json(
      createResponse(
        200,
        "Conversaciones obtenidas exitosamente",
        formattedConversations,
        null,
        { total: formattedConversations.length }
      )
    );
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { message_id } = req.params;

    const message = await Message.findOne({
      where: {
        message_id,
        sender_id: user_id,
        is_deleted: false,
      },
    });

    if (!message) {
      return res
        .status(404)
        .json(
          createResponse(
            404,
            "Mensaje no encontrado o no autorizado",
            null,
            null
          )
        );
    }

    // Marcar como eliminado en lugar de eliminar físicamente
    await message.update({ is_deleted: true });

    return res.json(
      createResponse(200, "Mensaje eliminado exitosamente", null, null)
    );
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};

export const markMessagesAsRead = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { match_id } = req.params;

    // Verificar que el usuario tiene acceso al match
    const match = await Match.findOne({
      where: {
        match_id,
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
    });

    if (!match) {
      return res
        .status(404)
        .json(
          createResponse(404, "Match no encontrado o no autorizado", null, null)
        );
    }

    // Marcar todos los mensajes no leídos como leídos
    const [updatedCount] = await Message.update(
      { read_at: new Date() },
      {
        where: {
          match_id,
          receiver_id: user_id,
          read_at: null,
          is_deleted: false,
        },
      }
    );

    return res.json(
      createResponse(
        200,
        "Mensajes marcados como leídos exitosamente",
        null,
        null,
        { updated_count: updatedCount }
      )
    );
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
    return res
      .status(500)
      .json(
        createResponse(500, "Error interno del servidor", null, error.message)
      );
  }
};
