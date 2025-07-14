// Middleware para validar datos de matches
export const validateMatchCreation = (req, res, next) => {
  const { user_library_id, matched_user_library_id } = req.body;

  // Validar que se proporcionen los IDs necesarios
  if (!user_library_id || !matched_user_library_id) {
    return res.status(400).json({
      error: "Datos incompletos",
      message: "Se requieren user_library_id y matched_user_library_id",
    });
  }

  // Validar que los IDs sean números válidos
  if (
    !Number.isInteger(user_library_id) ||
    !Number.isInteger(matched_user_library_id)
  ) {
    return res.status(400).json({
      error: "IDs inválidos",
      message: "Los IDs deben ser números enteros válidos",
    });
  }

  // Validar que no se haga match consigo mismo
  if (user_library_id === matched_user_library_id) {
    return res.status(400).json({
      error: "Match inválido",
      message: "No puedes hacer match contigo mismo",
    });
  }

  next();
};

// Middleware para validar parámetros de match
export const validateMatchParams = (req, res, next) => {
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

// Middleware para validar ownershipde match
export const validateMatchOwnership = async (req, res, next) => {
  const { match_id } = req.params;
  const userId = req.user.user_id;

  try {
    const { Match } = await import("../db/modelIndex.js");
    const match = await Match.findByPk(match_id);

    if (!match) {
      return res.status(404).json({
        error: "Match no encontrado",
        message: "El match especificado no existe",
      });
    }

    // Verificar que el usuario sea parte del match
    if (
      match.get("user_id_1") !== userId &&
      match.get("user_id_2") !== userId
    ) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Solo puedes acceder a tus propios matches",
      });
    }

    req.match = match;
    next();
  } catch (error) {
    console.error("Error al verificar ownership del match:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      message: "No se pudo verificar el acceso al match",
    });
  }
};
