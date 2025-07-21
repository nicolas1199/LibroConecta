import { PublishedBooks, Book, TransactionType, BookCondition, Category } from "../db/modelIndex.js"

// Validar datos de libro publicado
export function validatePublishedBookData(req, res, next) {
  try {
    const { book_id, transaction_type_id, condition_id, price, look_for, description, location_id } = req.body

    // Validar campos requeridos
    const isUpdate = req.method === "PUT"

    // Solo validar campos si están presentes en la solicitud o si es una creación
    if (!isUpdate) {
      if (!transaction_type_id) {
        return res.status(400).json({ error: "El tipo de transacción es requerido" })
      }
      if (!condition_id) {
        return res.status(400).json({ error: "La condición del libro es requerida" })
      }
      if (!description) {
        return res.status(400).json({ error: "La descripción es requerida" })
      }
      if (!location_id) {
        return res.status(400).json({ error: "La ubicación es requerida" })
      }
    }

    // Validar que book_id sea un número
    if (book_id && isNaN(book_id)) {
      return res.status(400).json({ error: "El ID del libro debe ser un número válido" })
    }

    // Validar que transaction_type_id sea un número
    if (transaction_type_id && isNaN(transaction_type_id)) {
      return res.status(400).json({ error: "El tipo de transacción debe ser un número válido" })
    }

    // Validar que condition_id sea un número
    if (condition_id && isNaN(condition_id)) {
      return res.status(400).json({ error: "La condición debe ser un número válido" })
    }

    // Validar precio si se proporciona
    if (price !== undefined && price !== null) {
      if (isNaN(price) || price < 0) {
        return res.status(400).json({ error: "El precio debe ser un número válido mayor o igual a 0" })
      }
    }

    // Validar longitud de campos de texto
    if (look_for && look_for.length > 1000) {
      return res.status(400).json({ error: "El campo 'look_for' no puede exceder 1000 caracteres" })
    }

    if (description && description.length > 2000) {
      return res.status(400).json({ error: "La descripción no puede exceder 2000 caracteres" })
    }

    next()
  } catch (error) {
    console.error("Error en validatePublishedBookData:", error)
    res.status(500).json({ error: "Error al validar datos del libro publicado" })
  }
}

// Validar que el usuario pueda acceder al libro publicado
export async function validatePublishedBookOwnership(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.user_id

    const publishedBook = await PublishedBooks.findByPk(id)
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" })
    }

    if (publishedBook.user_id !== userId) {
      return res.status(403).json({ error: "No tienes permisos para modificar este libro" })
    }

    // Añadir el libro publicado a la solicitud para uso posterior
    req.publishedBook = publishedBook
    next()
  } catch (error) {
    console.error("Error en validatePublishedBookOwnership:", error)
    res.status(500).json({ error: "Error al validar propiedad del libro" })
  }
}

// Validar que existan las referencias necesarias
export async function validatePublishedBookReferences(req, res, next) {
  try {
    const { book_id, transaction_type_id, condition_id, category_ids } = req.body

    // Validar que el libro existe
    if (book_id) {
      const book = await Book.findByPk(book_id)
      if (!book) {
        return res.status(400).json({ error: "El libro referenciado no existe" })
      }
    }

    // Validar que el tipo de transacción existe
    if (transaction_type_id) {
      const transactionType = await TransactionType.findByPk(transaction_type_id)
      if (!transactionType) {
        return res.status(400).json({ error: "El tipo de transacción especificado no existe" })
      }
    }

    // Validar que la condición existe
    if (condition_id) {
      const condition = await BookCondition.findByPk(condition_id)
      if (!condition) {
        return res.status(400).json({ error: "La condición especificada no existe" })
      }
    }

    // Validar categorías si se proporcionan
    if (category_ids && category_ids.length > 0) {
      const categories = await Category.findAll({
        where: { category_id: category_ids },
      })

      if (categories.length !== category_ids.length) {
        return res.status(400).json({ error: "Una o más categorías no existen" })
      }
    }

    next()
  } catch (error) {
    console.error("Error en validatePublishedBookReferences:", error)
    res.status(500).json({ error: "Error al validar referencias del libro" })
  }
}