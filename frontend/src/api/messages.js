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
export const sendMessage = async (matchId, messageData) => {
  try {
    const response = await api.post(`/messages/${matchId}`, messageData);
    return response.data;
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    throw error;
  }
};

// Enviar un mensaje de texto
export const sendTextMessage = async (matchId, messageText) => {
  return sendMessage(matchId, {
    message_text: messageText,
    message_type: 'text'
  });
};

// Enviar un mensaje con imagen base64
export const sendImageMessage = async (matchId, imageFile, caption = '') => {
  try {
    // Convertir archivo a base64
    const base64Data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    return sendMessage(matchId, {
      message_text: caption || null,
      message_type: 'image',
      image_data: base64Data,
      image_filename: imageFile.name,
      image_mimetype: imageFile.type,
      image_size: imageFile.size
    });
  } catch (error) {
    console.error("Error al enviar imagen:", error);
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