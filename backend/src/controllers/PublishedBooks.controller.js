import {
  PublishedBooks,
  Book,
  User,
  TransactionType,
  BookCondition,
  LocationBook,
  PublishedBookImage,
  Category,
} from "../db/modelIndex.js";
import { Op } from "sequelize";

// Obtener todos los libros publicados con filtros
export async function getAllPublishedBooks(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      transaction_type_id,
      condition_id,
      location_id,
      min_price,
      max_price,
    } = req.query;

    const offset = (page - 1) * limit;
    const whereConditions = {};

    // Aplicar filtros
    if (transaction_type_id)
      whereConditions.transaction_type_id = transaction_type_id;
    if (condition_id) whereConditions.condition_id = condition_id;
    if (location_id) whereConditions.location_id = location_id;
    if (min_price)
      whereConditions.price = { ...whereConditions.price, [Op.gte]: min_price };
    if (max_price)
      whereConditions.price = { ...whereConditions.price, [Op.lte]: max_price };

    const { count, rows: publishedBooks } =
      await PublishedBooks.findAndCountAll({
        where: whereConditions,
        include: [
          {
            model: Book,
            include: [
              {
                model: Category,
                as: "Categories",
                through: { attributes: [] },
              },
            ],
          },
          {
            model: User,
            attributes: ["user_id", "first_name", "last_name", "location"],
          },
          {
            model: TransactionType,
          },
          {
            model: BookCondition,
          },
          {
            model: LocationBook,
          },
          {
            model: PublishedBookImage,
            limit: 1,
            where: { is_primary: true },
            required: false,
          },
        ],
        order: [["date_published", "DESC"]],
        limit: Number.parseInt(limit),
        offset: offset,
      });

    res.json({
      publishedBooks,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBooks: count,
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error en getAllPublishedBooks:", error);
    res.status(500).json({ error: "Error al obtener libros publicados" });
  }
}

// Obtener libro publicado por ID
export async function getPublishedBookById(req, res) {
  try {
    const { id } = req.params;
    const publishedBook = await PublishedBooks.findByPk(id, {
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name", "location"],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
        },
      ],
    });

    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    res.json(publishedBook);
  } catch (error) {
    console.error("Error en getPublishedBookById:", error);
    res.status(500).json({ error: "Error al obtener libro publicado" });
  }
}

// Obtener libros publicados por usuario
export async function getPublishedBooksByUser(req, res) {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows: publishedBooks } =
      await PublishedBooks.findAndCountAll({
        where: { user_id: userId },
        include: [
          {
            model: Book,
            include: [
              {
                model: Category,
                as: "Categories",
                through: { attributes: [] },
              },
            ],
          },
          {
            model: TransactionType,
          },
          {
            model: BookCondition,
          },
          {
            model: LocationBook,
          },
          {
            model: PublishedBookImage,
            limit: 1,
            where: { is_primary: true },
            required: false,
          },
        ],
        order: [["date_published", "DESC"]],
        limit: Number.parseInt(limit),
        offset: offset,
      });

    res.json({
      publishedBooks,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBooks: count,
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error en getPublishedBooksByUser:", error);
    res
      .status(500)
      .json({ error: "Error al obtener libros publicados por usuario" });
  }
}

// Crear nuevo libro publicado
export async function createPublishedBook(req, res) {
  try {
    const {
      book_id,
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      images = [],
    } = req.body;

    const user_id = req.user.user_id;

    console.log("Datos recibidos para publicar libro:", {
      book_id,
      user_id,
      transaction_type_id,
      condition_id,
      location_id,
      price,
      description,
      images: images.length,
    });

    // Validar campos requeridos
    if (!book_id || !transaction_type_id || !condition_id) {
      return res.status(400).json({
        error: "book_id, transaction_type_id y condition_id son requeridos",
      });
    }

    // Crear el libro publicado
    const newPublishedBook = await PublishedBooks.create({
      book_id,
      user_id,
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      date_published: new Date(),
      updated_at: new Date(),
    });

    console.log("Libro publicado creado:", newPublishedBook.dataValues);

    // Nota: Las imágenes se suben por separado usando /api/published-book-images/upload/:publishedBookId
    // No crear placeholders aquí

    // Obtener el libro publicado completo
    const publishedBookComplete = await PublishedBooks.findByPk(
      newPublishedBook.published_book_id,
      {
        include: [
          {
            model: Book,
            include: [
              {
                model: Category,
                as: "Categories",
                through: { attributes: [] },
              },
            ],
          },
          {
            model: User,
            attributes: ["user_id", "first_name", "last_name", "location"],
          },
          {
            model: TransactionType,
          },
          {
            model: BookCondition,
          },
          {
            model: LocationBook,
          },
          {
            model: PublishedBookImage,
          },
        ],
      }
    );

    console.log("Libro publicado completo:", publishedBookComplete.dataValues);

    res.status(201).json(publishedBookComplete);
  } catch (error) {
    console.error("Error en createPublishedBook:", error);
    res
      .status(500)
      .json({
        error: "Error al crear libro publicado",
        details: error.message,
      });
  }
}

// Actualizar libro publicado
export async function updatePublishedBook(req, res) {
  try {
    const { id } = req.params;
    const {
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
    } = req.body;

    const publishedBook = await PublishedBooks.findByPk(id);
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    // Verificar que el usuario sea el propietario
    if (publishedBook.get("user_id") !== req.user.user_id) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para actualizar este libro" });
    }

    await publishedBook.update({
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      updated_at: new Date(),
    });

    // Obtener el libro actualizado completo
    const updatedBook = await PublishedBooks.findByPk(id, {
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
        },
      ],
    });

    res.json(updatedBook);
  } catch (error) {
    console.error("Error en updatePublishedBook:", error);
    res.status(500).json({ error: "Error al actualizar libro publicado" });
  }
}

// Eliminar libro publicado
export async function deletePublishedBook(req, res) {
  try {
    const { id } = req.params;

    const publishedBook = await PublishedBooks.findByPk(id);
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    // Verificar que el usuario sea el propietario
    if (publishedBook.get("user_id") !== req.user.user_id) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar este libro" });
    }

    // Eliminar imágenes asociadas
    await PublishedBookImage.destroy({
      where: { published_book_id: id },
    });

    // Eliminar el libro publicado
    await publishedBook.destroy();

    res.json({ message: "Libro publicado eliminado correctamente" });
  } catch (error) {
    console.error("Error en deletePublishedBook:", error);
    res.status(500).json({ error: "Error al eliminar libro publicado" });
  }
}
