import { error } from "../utils/responses.util.js";

export default function errorHandler(err, req, res, next) {
  console.error("Error capturado por middleware:", err);

  // Aquí podrías personalizar mensajes para ciertos tipos de error
  if (err.name === "SequelizeValidationError") {
    return error(res, err.errors.map(e => e.message).join(", "), 400);
  }

  // Error genérico
  return error(res, err.message || "Error interno del servidor", 500);
}
