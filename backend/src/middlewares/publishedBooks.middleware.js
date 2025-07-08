import { PublishedBooks, Book, TransactionType, BookCondition } from "../db/modelIndex.js"

// Validar datos de libro publicado
export function validatePublishedBookData(req, res, next) {
  try {
    const { book_id, transaction_type_id, condition_id, price, look_for, description } = req.body

    // Validar campos requeridos
    if (!book_id) {
      return res.status(400).json({ error: "El ID del libro es requerido" })
    }

    if (!transaction_type_id) {
      return res.status(400).json({ error: "El tipo de transacción es requerido" })
    }

    if (!condition_id) {
      return res.status(400).json({ error: "La condición del libro es requerida" })
    }

    // Validar que book_id sea un número
    if (isNaN(book_id)) {
      return res.status(400).json({ error: "El ID del libro debe ser un número válido" })
    }

    // Validar que transaction_type_id sea un número
    if (isNaN(transaction_type_id)) {
      return res.status(400).json({ error: "El tipo de transacción debe ser un número válido" })
    }

    // Validar que condition_id sea un número
    if (isNaN(condition_id)) {
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
    res.status(500).json({ error: "Error interno en validación de datos" })
  }
}

// Validar que el usuario pueda acceder al libro publicado
export async function validatePublishedBookOwnership(req, res, next) {
  try {
    const { id } = req.params
    const userId = req.user.user_id

    const publishedBook = await PublishedBooks.findOne({
      where: {
        published_book_id: id,
        user_id: userId,
      },
    })

    if (!publishedBook) {
      return res.status(404).json({
        error: "Libro publicado no encontrado o no tienes permisos para acceder a él",
      })
    }

    req.publishedBook = publishedBook
    next()
  } catch (error) {
    console.error("Error en validatePublishedBookOwnership:", error)
    res.status(500).json({
      error: "Error al validar acceso al libro publicado",
    })
  }
}

// Validar que existan las referencias necesarias
export async function validatePublishedBookReferences(req, res, next) {
  try {
    const { book_id, transaction_type_id, condition_id } = req.body

    // Validar que el libro existe
    if (book_id) {
      const book = await Book.findByPk(book_id)
      if (!book) {
        return res.status(400).json({ error: "El libro especificado no existe" })
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

    next()
  } catch (error) {
    console.error("Error en validatePublishedBookReferences:", error)
    res.status(500).json({
      error: "Error al validar referencias",
    })
  }
}
