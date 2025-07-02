import { UserLibrary, Book } from "../db/modelIndex.js";
import {
  validateRatingService,
  validateReadingStatusService,
  validateBookExistsService,
} from "../services/UserLibrary.service.js";

// Validar que el usuario autenticado pueda acceder al UserLibrary
export async function validateUserLibraryOwnership(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const userLibrary = await UserLibrary.findOne({
      where: {
        user_library_id: id,
        user_id: userId,
      },
    });

    if (!userLibrary) {
      return res.status(404).json({
        error: "Libro no encontrado en tu biblioteca",
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

// Validar que el book_id sea requerido y exista
export async function validateBookId(req, res, next) {
  try {
    const { book_id } = req.body;

    if (!book_id) {
      return res.status(400).json({
        error: "El ID del libro es requerido",
      });
    }

    // Validar que el libro existe
    await validateBookExistsService(book_id);

    next();
  } catch (error) {
    res.status(400).json({
      error: error.message,
    });
  }
}
