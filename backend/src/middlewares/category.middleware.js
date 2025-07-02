// Middleware para validar datos de categorías
export function validateCategoryData(req, res, next) {
  try {
    const { title, description } = req.body;

    // Validar título (requerido)
    if (!title || title.trim().length === 0) {
      return res.status(400).json({
        error: "El título de la categoría es requerido",
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        error: "El título no puede exceder los 100 caracteres",
      });
    }

    // Validar que el título no contenga caracteres especiales peligrosos
    const titleRegex = /^[a-zA-ZáéíóúñÑ\s]+$/;
    if (!titleRegex.test(title)) {
      return res.status(400).json({
        error: "El título solo puede contener letras y espacios",
      });
    }

    // Validar descripción (opcional pero con límites)
    if (description && description.length > 500) {
      return res.status(400).json({
        error: "La descripción no puede exceder los 500 caracteres",
      });
    }

    next();
  } catch (error) {
    console.error("Error en validateCategoryData:", error);
    res.status(500).json({
      error: "Error interno en validación de datos",
    });
  }
}

// Middleware para verificar que la categoría no esté en uso antes de eliminarla
export async function validateCategoryDeletion(req, res, next) {
  try {
    const { id } = req.params;

    // Aquí podrías agregar lógica para verificar si la categoría
    // está siendo utilizada por algún libro antes de permitir su eliminación
    // Por ejemplo:
    // const booksWithCategory = await BookCategory.count({ where: { category_id: id } });
    // if (booksWithCategory > 0) {
    //   return res.status(400).json({
    //     error: "No se puede eliminar una categoría que está siendo utilizada por libros",
    //   });
    // }

    next();
  } catch (error) {
    console.error("Error en validateCategoryDeletion:", error);
    res.status(500).json({
      error: "Error al validar eliminación de categoría",
    });
  }
}
