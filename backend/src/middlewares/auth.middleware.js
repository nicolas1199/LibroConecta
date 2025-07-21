import jwt from "jsonwebtoken";
import { JWT } from "../config/configEnv.js";

export const authenticateToken = (req, res, next) => {
  console.log('🔐 AUTH MIDDLEWARE - URL:', req.url, 'METHOD:', req.method);
  
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log('🔐 AUTH MIDDLEWARE - No token provided');
    return res.status(401).json({
      error: "Token de acceso requerido",
      message: "Debe proporcionar un token de autenticación válido",
    });
  }

  // Validar formato básico del token JWT (debe tener 3 partes separadas por puntos)
  if (token.split(".").length !== 3) {
    console.error(
      "Token malformado - formato inválido:",
      token.substring(0, 20) + "..."
    );
    return res.status(403).json({
      error: "Token malformado",
      message:
        "El formato del token no es válido. Por favor, inicie sesión nuevamente.",
    });
  }

  jwt.verify(token, JWT.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.error("Error de verificación JWT:", err.message);

      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "Token expirado",
          message: "Su sesión ha expirado. Por favor, inicie sesión nuevamente",
        });
      } else if (err.name === "JsonWebTokenError") {
        return res.status(403).json({
          error: "Token inválido",
          message:
            "El token proporcionado no es válido. Por favor, inicie sesión nuevamente.",
        });
      } else if (err.name === "NotBeforeError") {
        return res.status(403).json({
          error: "Token no válido aún",
          message: "El token aún no es válido",
        });
      } else {
        return res.status(403).json({
          error: "Error de autenticación",
          message:
            "No se pudo verificar su identidad. Por favor, inicie sesión nuevamente.",
        });
      }
    }

    // Validar que el token tenga la información necesaria
    if (!user.user_id) {
      return res.status(403).json({
        error: "Token malformado",
        message: "El token no contiene información de usuario válida",
      });
    }

    // Normalizar la estructura del usuario para compatibilidad
    req.user = {
      id: user.user_id,
      user_id: user.user_id,
      username: user.username,
      user_type_id: user.user_type_id,
    };
    next();
  });
};

// Middleware para verificar que el usuario sea administrador
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "No autenticado",
      message: "Debe estar autenticado para acceder a este recurso",
    });
  }

  // Verificar si el usuario es administrador (user_type_id: 1)
  if (req.user.user_type_id !== 1) {
    return res.status(403).json({
      error: "Acceso denegado",
      message: "Solo los administradores pueden realizar esta acción",
    });
  }

  next();
};

// Middleware para verificar que el usuario sea propietario del recurso o administrador
export const requireOwnershipOrAdmin = (resourceUserId) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "No autenticado",
        message: "Debe estar autenticado para acceder a este recurso",
      });
    }

    const isOwner = req.user.user_id === resourceUserId;
    const isAdmin = req.user.user_type_id === 1;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        error: "Acceso denegado",
        message: "Solo puede acceder a sus propios recursos",
      });
    }

    next();
  };
};
