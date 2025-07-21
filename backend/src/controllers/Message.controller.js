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
    await Message.update(
      { read_at: new Date() },
      {
        where: {
          match_id,
          receiver_id: user_id,
          read_at: null,
        },
      }
    );

    return res.json(
      createResponse(
        200,
        "Mensajes obtenidos exitosamente",
        messages,
        null,
        { total: messages.length }
      )
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

    // Validar que hay contenido
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
      message_type: 'text',
      sent_at: new Date(),
    });

    // Obtener el mensaje con información del remitente
    const messageWithSender = await Message.findByPk(newMessage.message_id, {
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

    return res.status(201).json(
      createResponse(
        201,
        "Mensaje enviado exitosamente",
        messageWithSender,
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

export const markAsRead = async (req, res) => {
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

    // Marcar mensajes como leídos
    const [updatedCount] = await Message.update(
      { read_at: new Date() },
      {
        where: {
          match_id,
          receiver_id: user_id,
          read_at: null,
        },
      }
    );

    return res.json(
      createResponse(
        200,
        "Mensajes marcados como leídos",
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

export const getConversations = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { limit = 10 } = req.query;

    // Obtener matches del usuario con el último mensaje
    const matches = await Match.findAll({
      where: {
        [Op.or]: [{ user_id_1: user_id }, { user_id_2: user_id }],
      },
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
      order: [["date_match", "DESC"]],
      limit: parseInt(limit),
    });

    // Para cada match, obtener el último mensaje
    const conversations = await Promise.all(
      matches.map(async (match) => {
        const lastMessage = await Message.findOne({
          where: {
            match_id: match.match_id,
            is_deleted: false,
          },
          order: [["sent_at", "DESC"]],
          include: [
            {
              model: User,
              as: "Sender",
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        });

        // Contar mensajes no leídos
        const unreadCount = await Message.count({
          where: {
            match_id: match.match_id,
            receiver_id: user_id,
            read_at: null,
            is_deleted: false,
          },
        });

        // Determinar el otro usuario
        const otherUser =
          match.User1.user_id === user_id ? match.User2 : match.User1;

        return {
          match_id: match.match_id,
          date_match: match.date_match,
          other_user: otherUser,
          last_message: lastMessage,
          unread_count: unreadCount,
        };
      })
    );

    // Ordenar por fecha del último mensaje
    conversations.sort((a, b) => {
      const dateA = a.last_message?.sent_at || a.date_match;
      const dateB = b.last_message?.sent_at || b.date_match;
      return new Date(dateB) - new Date(dateA);
    });

    return res.json(
      createResponse(
        200,
        "Conversaciones obtenidas exitosamente",
        conversations,
        null,
        { total: conversations.length }
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

    // Verificar que el mensaje existe y pertenece al usuario
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

    // Marcar como eliminado
    await Message.update(
      { is_deleted: true },
      {
        where: { message_id },
      }
    );

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
