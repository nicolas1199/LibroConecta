import { UserLibrary } from "../db/modelIndex.js";
import {
  validateRatingService,
  validateReadingStatusService,
} from "../services/UserLibrary.service.js";
import { RESPONSE_MESSAGES } from "../utils/constants.util.js";

// Validar que el usuario autenticado pueda acceder al UserLibrary
export async function validateUserLibraryOwnership(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const userLibrary = await UserLibrary.findOne({
      where: {
        user_library_id: id,
        user_id: userId,
      },
    });

    if (!userLibrary) {
      return res.status(404).json({
        error: RESPONSE_MESSAGES.BOOK_NOT_FOUND_IN_LIBRARY,
      });
    }

    req.userLibrary = userLibrary;
    next();
  } catch (error) {
    console.error("Error en validateUserLibraryOwnership:", error);
    res.status(500).json({
      error: "Error al validar acceso al libro",
    });
  }
}

// Validar datos de entrada para la biblioteca
export function validateLibraryData(req, res, next) {
  try {
    const { rating, reading_status } = req.body;

    // Validar rating si está presente
    if (rating !== undefined) {
      validateRatingService(rating);
    }

    // Validar reading_status si está presente
    if (reading_status !== undefined) {
      validateReadingStatusService(reading_status);
    }

    next();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
}

// Validar que los datos del libro sean requeridos
export async function validateBookData(req, res, next) {
  try {
    console.log("Validando datos del libro middleware");

    const { title, author } = req.body;
    console.log(req.body);

    if (!title || title.trim() === "") {
      return res.status(400).json({
        error: "El título del libro es requerido",
      });
    }

    // Normalizar los datos
    req.body.title = title.trim();
    if (author) {
      req.body.author = author.trim();
    }

    next();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
}
