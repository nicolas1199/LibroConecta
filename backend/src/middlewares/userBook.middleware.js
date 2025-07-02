import { UserBook } from "../db/modelIndex.js";

// Middleware para validar datos de biblioteca personal
export function validateLibraryData(req, res, next) {
  try {
    const { reading_status, rating, review } = req.body;

    // Validar estado de lectura
    if (reading_status) {
      const validStatuses = ["por_leer", "leyendo", "leido"];
      if (!validStatuses.includes(reading_status)) {
        return res.status(400).json({
          error: `Estado de lectura inválido. Debe ser uno de: ${validStatuses.join(
            ", "
          )}`,
        });
      }
    }

    // Validar calificación
    if (rating !== null && rating !== undefined) {
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return res.status(400).json({
          error: "La calificación debe ser un número entero entre 1 y 5",
        });
      }
    }

    // Validar que la reseña no sea demasiado larga
    if (review && review.length > 2000) {
      return res.status(400).json({
        error: "La reseña no puede exceder los 2000 caracteres",
      });
    }

    next();
  } catch (error) {
    res.status(400).json({ error: "Error en validación de datos" });
  }
}

// Middleware para validar que existe el UserBook y pertenece al usuario
export async function validateUserBookOwnership(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const userBook = await UserBook.findOne({
      where: {
        user_book_id: id,
        user_id: userId,
      },
    });

    if (!userBook) {
      return res.status(404).json({
        error: "Libro no encontrado en tu biblioteca",
      });
    }

    // Agregar el userBook al request para uso posterior
    req.userBook = userBook;
    next();
  } catch (error) {
    console.error("Error en validateUserBookOwnership:", error);
    res.status(500).json({ error: "Error al validar permisos del libro" });
  }
}

// Middleware para validar parámetros de paginación
export function validatePaginationParams(req, res, next) {
  try {
    let { page, limit } = req.query;

    // Convertir a números y establecer valores por defecto
    page = page ? parseInt(page) : 1;
    limit = limit ? parseInt(limit) : 10;

    // Validar rangos
    if (page < 1) {
      return res.status(400).json({
        error: "El número de página debe ser mayor a 0",
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: "El límite debe estar entre 1 y 100",
      });
    }

    // Agregar valores validados al query
    req.query.page = page;
    req.query.limit = limit;

    next();
  } catch (error) {
    res
      .status(400)
      .json({ error: "Error en validación de parámetros de paginación" });
  }
}
