import { Book, Category, BookCategory } from "../db/modelIndex.js";
import { Sequelize } from "sequelize";

// Función helper para validar categorías
async function validateCategories(categoryIds) {
  if (!categoryIds || !Array.isArray(categoryIds)) {
    return { valid: true, categories: [] };
  }

  const categories = await Category.findAll({
    where: { category_id: categoryIds },
  });

  if (categories.length !== categoryIds.length) {
    return {
      valid: false,
      error: "Una o más categorías no existen",
    };
  }

  return { valid: true, categories };
}

// Obtener libros random para swipe
export async function getRandomBooks(req, res) {
  try {
    const books = await Book.findAll({
      order: Sequelize.literal("RANDOM()"),
      limit: 10,
      include: [
        {
          model: Category,
          as: "Categories",
          through: { attributes: [] },
        },
      ],
    });

    res.json(books);
  } catch (error) {
    console.error("Error en getRandomBooks:", error);
    res.status(500).json({ error: "Error al obtener libros" });
  }
}

export async function getAllBooks(req, res) {
  try {
    const books = await Book.findAll({
      include: [
        {
          model: Category,
          as: "Categories",
          through: { attributes: [] },
        },
      ],
    });
    res.json(books);
  } catch (error) {
    console.error("Error en getAllBooks:", error);
    res.status(500).json({ error: "Error al obtener libros" });
  }
}

//  Obtener libro por ID
export async function getBookById(req, res) {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id, {
      include: [
        {
          model: Category,
          as: "Categories",
          through: { attributes: [] },
        },
      ],
    });
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });

    res.json(book);
  } catch (error) {
    console.error("Error en getBookById:", error);
    res.status(500).json({ error: "Error al obtener libro" });
  }
}

//  Crear nuevo libro
export async function createBook(req, res) {
  try {
    const { title, author, date_of_pub, location, category_ids } = req.body;

    // Validar campos requeridos
    if (!title) {
      return res.status(400).json({ error: "El título es requerido" });
    }

    // Validar categorías si se proporcionan
    if (category_ids) {
      const validation = await validateCategories(category_ids);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    const newBook = await Book.create({
      title,
      author,
      date_of_pub,
      location,
    });

    // Si se proporcionan categorías, asociarlas al libro
    if (
      category_ids &&
      Array.isArray(category_ids) &&
      category_ids.length > 0
    ) {
      // Usar el modelo BookCategory para crear las asociaciones
      const bookId = newBook.dataValues.book_id;

      const associations = category_ids.map((categoryId) => ({
        book_id: bookId,
        category_id: categoryId,
      }));

      await BookCategory.bulkCreate(associations);
    }

    // Obtener el libro con sus categorías para la respuesta
    const bookWithCategories = await Book.findByPk(newBook.dataValues.book_id, {
      include: [
        {
          model: Category,
          as: "Categories",
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json(bookWithCategories);
  } catch (error) {
    console.error("Error en createBook:", error);
    res.status(500).json({ error: "Error al crear libro" });
  }
}

//  Actualizar libro
export async function updateBook(req, res) {
  try {
    const { id } = req.params;
    const { title, author, date_of_pub, location, category_ids } = req.body;

    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });

    // Validar categorías si se proporcionan
    if (category_ids) {
      const validation = await validateCategories(category_ids);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    await book.update({
      title,
      author,
      date_of_pub,
      location,
    });

    // Si se proporcionan categorías, actualizar las asociaciones
    if (category_ids && Array.isArray(category_ids)) {
      // Eliminar asociaciones existentes usando el modelo BookCategory
      await BookCategory.destroy({
        where: { book_id: id },
      });

      // Crear nuevas asociaciones si hay categorías
      if (category_ids.length > 0) {
        const associations = category_ids.map((categoryId) => ({
          book_id: id,
          category_id: categoryId,
        }));

        await BookCategory.bulkCreate(associations);
      }
    }

    // Obtener el libro actualizado con sus categorías
    const updatedBook = await Book.findByPk(id, {
      include: [
        {
          model: Category,
          as: "Categories",
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedBook);
  } catch (error) {
    console.error("Error en updateBook:", error);
    res.status(500).json({ error: "Error al actualizar libro" });
  }
}

//  Eliminar libro
export async function deleteBook(req, res) {
  try {
    const { id } = req.params;
    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });

    await book.destroy();
    res.json({ message: "Libro eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteBook:", error);
    res.status(500).json({ error: "Error al eliminar libro" });
  }
}
