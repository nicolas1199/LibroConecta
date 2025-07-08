// Middleware para validar datos de mensajes
export const validateMessageCreation = (req, res, next) => {
  const { message_text } = req.body;

  // Validar que se proporcione el texto del mensaje
  if (!message_text) {
    return res.status(400).json({
      error: "Datos incompletos",
      message: "Se requiere el texto del mensaje",
    });
  }

  // Validar que el mensaje no esté vacío
  if (typeof message_text !== "string" || message_text.trim() === "") {
    return res.status(400).json({
      error: "Mensaje inválido",
      message: "El mensaje no puede estar vacío",
    });
  }

  // Validar longitud del mensaje
  if (message_text.length > 1000) {
    return res.status(400).json({
      error: "Mensaje muy largo",
      message: "El mensaje no puede exceder 1000 caracteres",
    });
  }

  // Limpiar el mensaje (trimear espacios)
  req.body.message_text = message_text.trim();

  next();
};

// Middleware para validar parámetros de mensaje
export const validateMessageParams = (req, res, next) => {
  const { match_id } = req.params;

  if (!match_id) {
    return res.status(400).json({
      error: "Parámetro faltante",
      message: "Se requiere el ID del match",
    });
  }

  if (!Number.isInteger(parseInt(match_id))) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El ID del match debe ser un número entero válido",
    });
  }

  next();
};

// Middleware para validar parámetros de mensaje específico
export const validateMessageIdParams = (req, res, next) => {
  const { message_id } = req.params;

  if (!message_id) {
    return res.status(400).json({
      error: "Parámetro faltante",
      message: "Se requiere el ID del mensaje",
    });
  }

  if (!Number.isInteger(parseInt(message_id))) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El ID del mensaje debe ser un número entero válido",
    });
  }

  next();
};

// Middleware para validar acceso a conversación
export const validateConversationAccess = async (req, res, next) => {
  const { match_id } = req.params;
  const userId = req.user.user_id; // Corregido: usar user_id del token JWT

  try {
    const { Match } = await import("../db/modelIndex.js");
    const match = await Match.findByPk(match_id);

    if (!match) {
      return res.status(404).json({
        error: "Match no encontrado",
        message: "El match especificado no existe",
      });
    }

    // Verificar que el usuario sea parte del match (corregido: usar user_id_1 y user_id_2)
    if (match.user_id_1 !== userId && match.user_id_2 !== userId) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Solo puedes acceder a tus propias conversaciones",
      });
    }

    req.match = match;
    next();
  } catch (error) {
    console.error("Error al verificar acceso a conversación:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      message: "No se pudo verificar el acceso a la conversación",
    });
  }
};

// Middleware para validar ownership de mensaje
export const validateMessageOwnership = async (req, res, next) => {
  const { message_id } = req.params;
  const userId = req.user.user_id; // Corregido: usar user_id del token JWT

  try {
    const { Message } = await import("../db/modelIndex.js");
    const message = await Message.findByPk(message_id);

    if (!message) {
      return res.status(404).json({
        error: "Mensaje no encontrado",
        message: "El mensaje especificado no existe",
      });
    }

    // Verificar que el usuario sea el dueño del mensaje
    if (message.sender_id !== userId) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Solo puedes eliminar tus propios mensajes",
      });
    }

    req.message = message;
    next();
  } catch (error) {
    console.error("Error al verificar ownership del mensaje:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      message: "No se pudo verificar el acceso al mensaje",
    });
  }
}; 