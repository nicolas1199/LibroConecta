import api from "./api.js";

// Crear una nueva solicitud de chat
export const createChatRequest = async (receiverId, bookId = null, message = null) => {
  try {
    const response = await api.post("/chat-requests", {
      receiver_id: receiverId,
      book_id: bookId,
      message: message
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Obtener solicitudes recibidas
export const getReceivedChatRequests = async (status = "pending", limit = 20, offset = 0) => {
  try {
    const response = await api.get("/chat-requests/received", {
      params: { status, limit, offset }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Obtener solicitudes enviadas
export const getSentChatRequests = async (limit = 20, offset = 0) => {
  try {
    const response = await api.get("/chat-requests/sent", {
      params: { limit, offset }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Obtener conteo de solicitudes pendientes
export const getPendingChatRequestsCount = async () => {
  try {
    const response = await api.get("/chat-requests/pending-count");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Responder a una solicitud de chat
export const respondToChatRequest = async (requestId, response) => {
  try {
    const responseData = await api.put(`/chat-requests/${requestId}/respond`, {
      response: response // 'accepted' o 'rejected'
    });
    return responseData.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Obtener conteo de solicitudes pendientes
export const getPendingChatRequestsCount = async () => {
  try {
    const response = await api.get("/chat-requests/pending-count");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 