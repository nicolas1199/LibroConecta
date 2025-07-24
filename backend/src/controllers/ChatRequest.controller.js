import {
  createChatRequestService,
  getReceivedChatRequestsService,
  getSentChatRequestsService,
  respondToChatRequestService,
  getPendingChatRequestsCountService
} from "../services/ChatRequest.service.js";
import { createResponse } from "../utils/responses.util.js";

// Crear una nueva solicitud de chat
export const createChatRequest = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { receiver_id, book_id, message } = req.body;

    // Validar datos requeridos
    if (!receiver_id) {
      return res.status(400).json(
        createResponse(400, "El ID del usuario receptor es requerido", null, null)
      );
    }

    // Validar longitud del mensaje
    if (message && message.length > 500) {
      return res.status(400).json(
        createResponse(400, "El mensaje no puede exceder 500 caracteres", null, null)
      );
    }

    const chatRequest = await createChatRequestService(
      user_id,
      receiver_id,
      book_id || null,
      message || null
    );

    return res.status(201).json(
      createResponse(201, "Solicitud de chat creada exitosamente", chatRequest, null)
    );
  } catch (error) {
    console.error("Error al crear solicitud de chat:", error);
    return res.status(400).json(
      createResponse(400, error.message, null, error.message)
    );
  }
};

// Obtener solicitudes recibidas por el usuario
export const getReceivedChatRequests = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { limit = 20, offset = 0, status = "pending" } = req.query;

    const result = await getReceivedChatRequestsService(user_id, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      status
    });

    return res.json(
      createResponse(200, "Solicitudes recibidas obtenidas exitosamente", result.requests, null, {
        total: result.total
      })
    );
  } catch (error) {
    console.error("Error al obtener solicitudes recibidas:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

// Obtener solicitudes enviadas por el usuario
export const getSentChatRequests = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { limit = 20, offset = 0 } = req.query;

    const result = await getSentChatRequestsService(user_id, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return res.json(
      createResponse(200, "Solicitudes enviadas obtenidas exitosamente", result.requests, null, {
        total: result.total
      })
    );
  } catch (error) {
    console.error("Error al obtener solicitudes enviadas:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
};

// Responder a una solicitud de chat (aceptar o rechazar)
export const respondToChatRequest = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { request_id } = req.params;
    const { response } = req.body;

    if (!response || !["accepted", "rejected"].includes(response)) {
      return res.status(400).json(
        createResponse(400, "La respuesta debe ser 'accepted' o 'rejected'", null, null)
      );
    }

    const result = await respondToChatRequestService(
      parseInt(request_id),
      user_id,
      response
    );

    const message = response === "accepted" 
      ? "Solicitud aceptada. Se ha creado un match automáticamente."
      : "Solicitud rechazada.";

    return res.json(
      createResponse(200, message, result, null)
    );
  } catch (error) {
    console.error("Error al responder a solicitud de chat:", error);
    return res.status(400).json(
      createResponse(400, error.message, null, error.message)
    );
  }
};

// Obtener conteo de solicitudes pendientes
export const getPendingChatRequestsCount = async (req, res) => {
  try {
    const { user_id } = req.user;

    const count = await getPendingChatRequestsCountService(user_id);

    return res.json(
      createResponse(200, "Conteo obtenido exitosamente", { count }, null)
    );
  } catch (error) {
    console.error("Error al obtener conteo de solicitudes pendientes:", error);
    return res.status(500).json(
      createResponse(500, "Error interno del servidor", null, error.message)
    );
  }
}; 