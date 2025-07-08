// Middleware para validar datos de calificaciones
export const validateRatingCreation = (req, res, next) => {
  const { rated_id, rating, comment, exchange_id, sell_id } = req.body;

  // Validar que se proporcionen los datos necesarios
  if (!rated_id || !rating) {
    return res.status(400).json({
      error: "Datos incompletos",
      message: "Se requieren rated_id y rating",
    });
  }

  // Validar que el rating sea un número válido entre 1 y 5
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({
      error: "Rating inválido",
      message: "El rating debe ser un número entero entre 1 y 5",
    });
  }

  // Validar que el rated_id sea un número válido
  if (!Number.isInteger(rated_id)) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El ID del usuario a calificar debe ser un número entero válido",
    });
  }

  // Validar que no se califique a sí mismo
  if (rated_id === req.user.id) {
    return res.status(400).json({
      error: "Calificación inválida",
      message: "No puedes calificarte a ti mismo",
    });
  }

  // Validar que al menos uno de exchange_id o sell_id esté presente
  if (!exchange_id && !sell_id) {
    return res.status(400).json({
      error: "Datos incompletos",
      message: "Se requiere al menos exchange_id o sell_id",
    });
  }

  // Validar que solo uno de exchange_id o sell_id esté presente
  if (exchange_id && sell_id) {
    return res.status(400).json({
      error: "Datos conflictivos",
      message: "No se puede proporcionar tanto exchange_id como sell_id",
    });
  }

  // Validar que los IDs sean números válidos si están presentes
  if (exchange_id && !Number.isInteger(exchange_id)) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El exchange_id debe ser un número entero válido",
    });
  }

  if (sell_id && !Number.isInteger(sell_id)) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El sell_id debe ser un número entero válido",
    });
  }

  // Validar comentario si está presente
  if (comment !== undefined && comment !== null) {
    if (typeof comment !== "string") {
      return res.status(400).json({
        error: "Comentario inválido",
        message: "El comentario debe ser una cadena de texto",
      });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        error: "Comentario muy largo",
        message: "El comentario no puede exceder 500 caracteres",
      });
    }

    // Limpiar el comentario (trimear espacios)
    req.body.comment = comment.trim();
  }

  next();
};

// Middleware para validar actualización de calificación
export const validateRatingUpdate = (req, res, next) => {
  const { rating, comment } = req.body;

  // Validar que se proporcione al menos un campo para actualizar
  if (rating === undefined && comment === undefined) {
    return res.status(400).json({
      error: "Datos incompletos",
      message: "Se requiere al menos rating o comment para actualizar",
    });
  }

  // Validar rating si está presente
  if (rating !== undefined) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: "Rating inválido",
        message: "El rating debe ser un número entero entre 1 y 5",
      });
    }
  }

  // Validar comentario si está presente
  if (comment !== undefined) {
    if (typeof comment !== "string") {
      return res.status(400).json({
        error: "Comentario inválido",
        message: "El comentario debe ser una cadena de texto",
      });
    }

    if (comment.length > 500) {
      return res.status(400).json({
        error: "Comentario muy largo",
        message: "El comentario no puede exceder 500 caracteres",
      });
    }

    // Limpiar el comentario (trimear espacios)
    req.body.comment = comment.trim();
  }

  next();
};

// Middleware para validar parámetros de calificación
export const validateRatingParams = (req, res, next) => {
  const { rating_id } = req.params;

  if (!rating_id) {
    return res.status(400).json({
      error: "Parámetro faltante",
      message: "Se requiere el ID de la calificación",
    });
  }

  if (!Number.isInteger(parseInt(rating_id))) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El ID de la calificación debe ser un número entero válido",
    });
  }

  next();
};

// Middleware para validar parámetros de usuario
export const validateUserParams = (req, res, next) => {
  const { user_id } = req.params;

  if (!user_id) {
    return res.status(400).json({
      error: "Parámetro faltante",
      message: "Se requiere el ID del usuario",
    });
  }

  if (!Number.isInteger(parseInt(user_id))) {
    return res.status(400).json({
      error: "ID inválido",
      message: "El ID del usuario debe ser un número entero válido",
    });
  }

  next();
};

// Middleware para validar ownership de calificación
export const validateRatingOwnership = async (req, res, next) => {
  const { rating_id } = req.params;
  const userId = req.user.id;

  try {
    const { Rating } = await import("../db/modelIndex.js");
    const rating = await Rating.findByPk(rating_id);

    if (!rating) {
      return res.status(404).json({
        error: "Calificación no encontrada",
        message: "La calificación especificada no existe",
      });
    }

    // Verificar que el usuario sea el dueño de la calificación
    if (rating.rater_id !== userId) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Solo puedes modificar tus propias calificaciones",
      });
    }

    req.rating = rating;
    next();
  } catch (error) {
    console.error("Error al verificar ownership de la calificación:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      message: "No se pudo verificar el acceso a la calificación",
    });
  }
};

// Middleware para validar query params de calificaciones
export const validateRatingQueryParams = (req, res, next) => {
  const { type, page, limit } = req.query;

  // Validar type si está presente
  if (type && !["received", "given"].includes(type)) {
    return res.status(400).json({
      error: "Tipo inválido",
      message: "El tipo debe ser 'received' o 'given'",
    });
  }

  // Validar page si está presente
  if (page && (!Number.isInteger(parseInt(page)) || parseInt(page) < 1)) {
    return res.status(400).json({
      error: "Página inválida",
      message: "La página debe ser un número entero mayor a 0",
    });
  }

  // Validar limit si está presente
  if (limit && (!Number.isInteger(parseInt(limit)) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
    return res.status(400).json({
      error: "Límite inválido",
      message: "El límite debe ser un número entero entre 1 y 100",
    });
  }

  next();
}; 