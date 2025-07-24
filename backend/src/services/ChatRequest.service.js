import { Op } from "sequelize";
import { ChatRequest, User, PublishedBooks, Match, sequelize } from "../db/modelIndex.js";

// Crear una nueva solicitud de chat
export async function createChatRequestService(requesterId, receiverId, bookId = null, message = null) {
  try {
    // Validar que el usuario no se envíe solicitud a sí mismo
    if (requesterId === receiverId) {
      throw new Error("No puedes enviar una solicitud de chat a ti mismo");
    }

    // Verificar que ambos usuarios existen
    const [requester, receiver] = await Promise.all([
      User.findByPk(requesterId),
      User.findByPk(receiverId)
    ]);

    if (!requester || !receiver) {
      throw new Error("Uno o ambos usuarios no existen");
    }

    // Verificar que no existe ya un match entre estos usuarios
    const existingMatch = await Match.findOne({
      where: {
        [Op.or]: [
          { user_id_1: requesterId, user_id_2: receiverId },
          { user_id_1: receiverId, user_id_2: requesterId }
        ]
      }
    });

    if (existingMatch) {
      throw new Error("Ya existe un match entre estos usuarios");
    }

    // Verificar que no existe ya una solicitud pendiente
    const existingRequest = await ChatRequest.findOne({
      where: {
        requester_id: requesterId,
        receiver_id: receiverId,
        status: "pending"
      }
    });

    if (existingRequest) {
      throw new Error("Ya existe una solicitud de chat pendiente");
    }

    // Si se especifica un libro, verificar que existe y pertenece al receptor
    if (bookId) {
      const book = await PublishedBooks.findOne({
        where: {
          published_book_id: bookId,
          user_id: receiverId
        }
      });

      if (!book) {
        throw new Error("El libro especificado no existe o no pertenece al usuario");
      }
    }

    // Crear la solicitud
    const chatRequest = await ChatRequest.create({
      requester_id: requesterId,
      receiver_id: receiverId,
      book_id: bookId,
      message: message,
      status: "pending",
      created_at: new Date()
    });

    // Obtener la solicitud con información de usuarios y libro
    const requestWithDetails = await ChatRequest.findByPk(chatRequest.request_id, {
      include: [
        {
          model: User,
          as: "Requester",
          attributes: ["user_id", "first_name", "last_name", "username"]
        },
        {
          model: User,
          as: "Receiver",
          attributes: ["user_id", "first_name", "last_name", "username"]
        },
        {
          model: PublishedBooks,
          as: "Book",
          include: [
            {
              model: sequelize.models.Book,
              attributes: ["title", "author"]
            }
          ]
        }
      ]
    });

    return requestWithDetails;
  } catch (error) {
    console.error("Error al crear solicitud de chat:", error);
    throw error;
  }
}

// Obtener solicitudes recibidas por un usuario
export async function getReceivedChatRequestsService(userId, options = {}) {
  try {
    const { limit = 20, offset = 0, status = "pending" } = options;

    const requests = await ChatRequest.findAll({
      where: {
        receiver_id: userId,
        status: status
      },
      include: [
        {
          model: User,
          as: "Requester",
          attributes: ["user_id", "first_name", "last_name", "username"]
        },
        {
          model: PublishedBooks,
          as: "Book",
          include: [
            {
              model: sequelize.models.Book,
              attributes: ["title", "author"]
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      requests,
      total: requests.length
    };
  } catch (error) {
    console.error("Error al obtener solicitudes recibidas:", error);
    throw error;
  }
}

// Obtener solicitudes enviadas por un usuario
export async function getSentChatRequestsService(userId, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;

    const requests = await ChatRequest.findAll({
      where: {
        requester_id: userId
      },
      include: [
        {
          model: User,
          as: "Receiver",
          attributes: ["user_id", "first_name", "last_name", "username"]
        },
        {
          model: PublishedBooks,
          as: "Book",
          include: [
            {
              model: sequelize.models.Book,
              attributes: ["title", "author"]
            }
          ]
        }
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return {
      requests,
      total: requests.length
    };
  } catch (error) {
    console.error("Error al obtener solicitudes enviadas:", error);
    throw error;
  }
}

// Responder a una solicitud de chat (aceptar o rechazar)
export async function respondToChatRequestService(requestId, receiverId, response) {
  try {
    if (!["accepted", "rejected"].includes(response)) {
      throw new Error("Respuesta inválida. Debe ser 'accepted' o 'rejected'");
    }

    // Buscar la solicitud
    const chatRequest = await ChatRequest.findOne({
      where: {
        request_id: requestId,
        receiver_id: receiverId,
        status: "pending"
      }
    });

    if (!chatRequest) {
      throw new Error("Solicitud no encontrada o ya respondida");
    }

    // Actualizar el estado de la solicitud
    await chatRequest.update({
      status: response,
      responded_at: new Date()
    });

    // Si se acepta, crear un match automáticamente
    if (response === "accepted") {
      const newMatch = await Match.create({
        user_id_1: chatRequest.requester_id,
        user_id_2: chatRequest.receiver_id,
        date_match: new Date()
      });

      return {
        chatRequest: await ChatRequest.findByPk(requestId, {
          include: [
            {
              model: User,
              as: "Requester",
              attributes: ["user_id", "first_name", "last_name", "username"]
            },
            {
              model: User,
              as: "Receiver",
              attributes: ["user_id", "first_name", "last_name", "username"]
            }
          ]
        }),
        match: newMatch
      };
    }

    return {
      chatRequest: await ChatRequest.findByPk(requestId, {
        include: [
          {
            model: User,
            as: "Requester",
            attributes: ["user_id", "first_name", "last_name", "username"]
          },
          {
            model: User,
            as: "Receiver",
            attributes: ["user_id", "first_name", "last_name", "username"]
          }
        ]
      })
    };
  } catch (error) {
    console.error("Error al responder a solicitud de chat:", error);
    throw error;
  }
}

// Obtener conteo de solicitudes pendientes para un usuario
export async function getPendingChatRequestsCountService(userId) {
  try {
    const count = await ChatRequest.count({
      where: {
        receiver_id: userId,
        status: "pending"
      }
    });

    return count;
  } catch (error) {
    console.error("Error al obtener conteo de solicitudes pendientes:", error);
    throw error;
  }
} 