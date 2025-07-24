import { error } from "../utils/responses.util.js";

export default function errorHandler(err, req, res, next) {
  // Log error details without sensitive data
  console.error("Error capturado por middleware:", {
    name: err.name,
    message: err.message,
    stack: err.stack?.split('\n')[0], // Only first line of stack trace
    code: err.code,
    status: err.status
  });

  // Aquí podrías personalizar mensajes para ciertos tipos de error
  if (err.name === "SequelizeValidationError") {
    return error(res, err.errors.map(e => e.message).join(", "), 400);
  }

  // Error genérico
  return error(res, err.message || "Error interno del servidor", 500);
}
