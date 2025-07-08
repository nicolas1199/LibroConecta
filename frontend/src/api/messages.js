import api from "./api.js";

// Obtener todas las conversaciones del usuario
export const getConversations = async (params = {}) => {
  try {
    const response = await api.get("/messages/conversations", { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener conversaciones:", error);
    throw error;
  }
};

// Obtener mensajes de un match específico
export const getMessages = async (matchId, params = {}) => {
  try {
    const response = await api.get(`/messages/${matchId}`, { params });
    return response.data;
  } catch (error) {
    console.error("Error al obtener mensajes:", error);
    throw error;
  }
};

// Enviar un mensaje
export const sendMessage = async (matchId, messageText) => {
  try {
    const response = await api.post(`/messages/${matchId}`, {
      message_text: messageText,
    });
    return response.data;
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
};

// Marcar mensajes como leídos
export const markMessagesAsRead = async (matchId) => {
  try {
    const response = await api.put(`/messages/${matchId}/read`);
    return response.data;
  } catch (error) {
    console.error("Error al marcar mensajes como leídos:", error);
    throw error;
  }
};

// Eliminar un mensaje
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/messages/message/${messageId}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar mensaje:", error);
    throw error;
  }
}; 