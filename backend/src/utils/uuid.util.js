// Utilidades para validación de UUID
// UUID v4 regex pattern
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isValidUUID = (uuid) => {
  if (typeof uuid !== "string") {
    return false;
  }
  return UUID_V4_REGEX.test(uuid);
};

export const areValidUUIDs = (...uuids) => {
  return uuids.every((uuid) => isValidUUID(uuid));
};

export const validateUUIDParam = (paramName) => {
  return (req, res, next) => {
    const value = req.params[paramName];

    if (!value) {
      return res.status(400).json({
        error: "Parámetro faltante",
        message: `Se requiere el parámetro ${paramName}`,
      });
    }

    if (!isValidUUID(value)) {
      return res.status(400).json({
        error: "ID inválido",
        message: `El ${paramName} debe ser un UUID válido`,
      });
    }

    next();
  };
};

export const validateUserIdParam = validateUUIDParam("user_id");

export const validateMultipleUUIDParams = (...paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const value = req.params[paramName];

      if (!value) {
        return res.status(400).json({
          error: "Parámetro faltante",
          message: `Se requiere el parámetro ${paramName}`,
        });
      }

      if (!isValidUUID(value)) {
        return res.status(400).json({
          error: "ID inválido",
          message: `El ${paramName} debe ser un UUID válido`,
        });
      }
    }

    next();
  };
};
