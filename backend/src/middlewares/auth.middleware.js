import jwt from "jsonwebtoken";
import { JWT } from "../config/configEnv.js";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token de acceso requerido",
      message: "Debe proporcionar un token de autenticación válido",
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
          message: "El token proporcionado no es válido",
        });
      } else {
        return res.status(403).json({
          error: "Error de autenticación",
          message: "No se pudo verificar su identidad",
        });
      }
    }

    // Validar que el token tenga la información necesaria
    if (!user.id) {
      return res.status(403).json({
        error: "Token malformado",
        message: "El token no contiene información de usuario válida",
      });
    }

    req.user = user;
    next();
  });
};
