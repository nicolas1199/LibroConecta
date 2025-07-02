// Middleware para validar datos de libros
export function validateBookData(req, res, next) {
  try {
    const { title, author, date_of_pub, location, category_ids } = req.body;

    // Validar título (requerido)
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        error: "El título del libro es requerido",
      });
    }

    if (title.length > 200) {
      return res.status(400).json({
        error: "El título no puede exceder los 200 caracteres",
      });
    }

    // Validar autor (opcional pero con límites)
    if (author && author.length > 150) {
      return res.status(400).json({
        error: "El nombre del autor no puede exceder los 150 caracteres",
      });
    }

    // Validar fecha de publicación (opcional)
    if (date_of_pub) {
      const pubDate = new Date(date_of_pub);
      if (isNaN(pubDate.getTime())) {
        return res.status(400).json({
          error: "La fecha de publicación no es válida",
        });
      }

      // No permitir fechas futuras
      if (pubDate > new Date()) {
        return res.status(400).json({
          error: "La fecha de publicación no puede ser futura",
        });
      }
    }

    // Validar ubicación (opcional pero con límites)
    if (location && location.length > 100) {
      return res.status(400).json({
        error: "La ubicación no puede exceder los 100 caracteres",
      });
    }

    // Validar categorías (opcional)
    if (category_ids && !Array.isArray(category_ids)) {
      return res.status(400).json({
        error: "Las categorías deben ser un array",
      });
    }

    if (category_ids && category_ids.length > 5) {
      return res.status(400).json({
        error: "Un libro no puede tener más de 5 categorías",
      });
    }

    next();
  } catch (error) {
    console.error("Error en validateBookData:", error);
    res.status(500).json({
      error: "Error interno en validación de datos",
    });
  }
}

// Middleware para verificar que el usuario pueda modificar el libro
export async function validateBookOwnership(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: "Usuario no autenticado",
      });
    }

    // Aquí podrías agregar lógica para verificar si el usuario
    // es el propietario del libro o tiene permisos para editarlo
    // Por ahora, permitimos que cualquier usuario autenticado pueda editar
    // En un futuro se podría implementar un sistema de permisos más granular

    next();
  } catch (error) {
    console.error("Error en validateBookOwnership:", error);
    res.status(500).json({
      error: "Error al validar permisos del libro",
    });
  }
}
