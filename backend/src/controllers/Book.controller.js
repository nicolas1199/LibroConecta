import { Book, Category } from "../db/modelndex.js";
import { Sequelize } from "sequelize";

// Obtener libros random para swipe
export async function getRandomBooks(req, res) {
  try {
    const books = await Book.findAll({
      order: Sequelize.literal("RANDOM()"),
      limit: 10,
      include: [Category],
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
      include: [Category],
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
      include: [Category],
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
    const { title, author, date_of_pub, location, category_id } = req.body;
    const newBook = await Book.create({
      title,
      author,
      date_of_pub,
      location,
      category_id,
    });
    res.status(201).json(newBook);
  } catch (error) {
    console.error("Error en createBook:", error);
    res.status(500).json({ error: "Error al crear libro" });
  }
}

//  Actualizar libro
export async function updateBook(req, res) {
  try {
    const { id } = req.params;
    const { title, author, date_of_pub, location, category_id } = req.body;

    const book = await Book.findByPk(id);
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });

    await book.update({
      title,
      author,
      date_of_pub,
      location,
      category_id,
    });

    res.json(book);
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
