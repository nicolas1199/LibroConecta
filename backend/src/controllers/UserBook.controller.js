import { UserBook, Book, User } from "../db/modelIndex.js";
import { Op, Sequelize } from "sequelize";

// Registrar like o dislike
export async function swipeBook(req, res) {
  try {
    // Extraemos los datos enviados desde el frontend
    const { book_id, liked } = req.body;

    // Obtener el ID del usuario autenticado
    const user_id = req.user.id;
    if (!user_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Buscamos si ya existe una entrada en UserBooks para este usuario y libro
    const [userBook, created] = await UserBook.findOrCreate({
      where: { user_id, book_id },
      defaults: { liked },
    });

    // Si ya existía, actualizamos el campo liked
    if (!created) {
      await userBook.update({ liked });
    }

    // Respondemos que todo fue bien
    res.status(200).json({ message: "Swipe registrado" });
  } catch (error) {
    console.error("Error en swipeBook:", error);
    res.status(500).json({ error: "Error al registrar swipe" });
  }
}

// Agregar libro a la biblioteca personal
export async function addToLibrary(req, res) {
  try {
    const { book_id, reading_status, rating, review } = req.body;
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Validar que el estado de lectura sea válido
    const validStatuses = ["por_leer", "leyendo", "leido"];
    if (reading_status && !validStatuses.includes(reading_status)) {
      return res.status(400).json({
        error:
          "Estado de lectura inválido. Debe ser: por_leer, leyendo, o leido",
      });
    }

    // Validar rating si se proporciona
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: "La calificación debe estar entre 1 y 5",
      });
    }

    // Verificar si el libro ya está en la biblioteca del usuario
    const existingUserBook = await UserBook.findOne({
      where: { user_id, book_id },
    });

    let userBook;
    if (existingUserBook) {
      // Si ya existe, actualizar los campos de biblioteca
      await existingUserBook.update({
        reading_status,
        rating,
        review,
        date_started:
          reading_status === "leyendo"
            ? new Date()
            : existingUserBook.dataValues.date_started,
        date_finished: reading_status === "leido" ? new Date() : null,
      });
      userBook = existingUserBook;
    } else {
      // Si no existe, crear nueva entrada
      userBook = await UserBook.create({
        user_id,
        book_id,
        reading_status,
        rating,
        review,
        date_started: reading_status === "leyendo" ? new Date() : null,
        date_finished: reading_status === "leido" ? new Date() : null,
      });
    }

    // Incluir información del libro en la respuesta
    const result = await UserBook.findByPk(userBook.dataValues.user_book_id, {
      include: [
        {
          model: Book,
          attributes: ["title", "author", "date_of_pub"],
        },
      ],
    });

    res.status(201).json({
      message: "Libro agregado/actualizado en biblioteca personal",
      userBook: result,
    });
  } catch (error) {
    console.error("Error en addToLibrary:", error);
    res.status(500).json({ error: "Error al agregar libro a biblioteca" });
  }
}

// Obtener biblioteca personal del usuario
export async function getUserLibrary(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const { status, page = 1, limit = 10 } = req.query;

    // Construir condiciones de búsqueda
    const whereConditions = { user_id };
    if (status) {
      whereConditions.reading_status = status;
    }

    // Solo mostrar libros que están en la biblioteca (tienen reading_status)
    whereConditions.reading_status = { [Op.not]: null };

    const offset = (page - 1) * limit;

    const { count, rows: userBooks } = await UserBook.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Book,
          attributes: ["book_id", "title", "author", "date_of_pub", "location"],
        },
      ],
      order: [["updatedAt", "DESC"]],
      limit: parseInt(limit),
      offset: offset,
    });

    // Agrupar por estado para estadísticas
    const stats = await UserBook.findAll({
      where: {
        user_id,
        reading_status: { [Op.not]: null },
      },
      attributes: [
        "reading_status",
        [Sequelize.fn("COUNT", Sequelize.col("user_book_id")), "count"],
      ],
      group: ["reading_status"],
    });

    res.json({
      books: userBooks,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBooks: count,
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1,
      },
      stats: stats.reduce((acc, stat) => {
        acc[stat.dataValues.reading_status] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error("Error en getUserLibrary:", error);
    res.status(500).json({ error: "Error al obtener biblioteca personal" });
  }
}

// Actualizar estado de lectura de un libro
export async function updateReadingStatus(req, res) {
  try {
    const { id } = req.params;
    const { reading_status, rating, review } = req.body;
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Validar que el estado de lectura sea válido
    const validStatuses = ["por_leer", "leyendo", "leido"];
    if (reading_status && !validStatuses.includes(reading_status)) {
      return res.status(400).json({
        error:
          "Estado de lectura inválido. Debe ser: por_leer, leyendo, o leido",
      });
    }

    // Validar rating si se proporciona
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        error: "La calificación debe estar entre 1 y 5",
      });
    }

    const userBook = await UserBook.findOne({
      where: { user_book_id: id, user_id },
    });

    if (!userBook) {
      return res
        .status(404)
        .json({ error: "Libro no encontrado en tu biblioteca" });
    }

    // Actualizar campos según el nuevo estado
    const updateData = { reading_status, rating, review };

    // Gestionar fechas automáticamente
    if (
      reading_status === "leyendo" &&
      userBook.dataValues.reading_status !== "leyendo"
    ) {
      updateData.date_started = new Date();
      updateData.date_finished = null; // Limpiar fecha de finalización si vuelve a leer
    } else if (
      reading_status === "leido" &&
      userBook.dataValues.reading_status !== "leido"
    ) {
      updateData.date_finished = new Date();
      if (!userBook.dataValues.date_started) {
        updateData.date_started = new Date(); // Si no tenía fecha de inicio, usar la actual
      }
    } else if (reading_status === "por_leer") {
      updateData.date_started = null;
      updateData.date_finished = null;
    }

    await userBook.update(updateData);

    // Obtener el libro actualizado con información del libro
    const updatedUserBook = await UserBook.findByPk(id, {
      include: [
        {
          model: Book,
          attributes: ["title", "author", "date_of_pub"],
        },
      ],
    });

    res.json({
      message: "Estado de lectura actualizado correctamente",
      userBook: updatedUserBook,
    });
  } catch (error) {
    console.error("Error en updateReadingStatus:", error);
    res.status(500).json({ error: "Error al actualizar estado de lectura" });
  }
}

// Obtener estadísticas de lectura del usuario
export async function getReadingStats(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Estadísticas básicas por estado
    const statusStats = await UserBook.findAll({
      where: {
        user_id,
        reading_status: { [Op.not]: null },
      },
      attributes: [
        "reading_status",
        [Sequelize.fn("COUNT", Sequelize.col("user_book_id")), "count"],
      ],
      group: ["reading_status"],
    });

    // Promedio de calificaciones
    const avgRating = await UserBook.findOne({
      where: {
        user_id,
        rating: { [Op.not]: null },
      },
      attributes: [
        [Sequelize.fn("AVG", Sequelize.col("rating")), "average_rating"],
        [Sequelize.fn("COUNT", Sequelize.col("rating")), "rated_books"],
      ],
    });

    // Libros leídos por mes (últimos 12 meses)
    const monthlyReading = await UserBook.findAll({
      where: {
        user_id,
        reading_status: "leido",
        date_finished: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12)),
        },
      },
      attributes: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("date_finished"), "%Y-%m"),
          "month",
        ],
        [
          Sequelize.fn("COUNT", Sequelize.col("user_book_id")),
          "books_finished",
        ],
      ],
      group: [
        Sequelize.fn("DATE_FORMAT", Sequelize.col("date_finished"), "%Y-%m"),
      ],
      order: [
        [
          Sequelize.fn("DATE_FORMAT", Sequelize.col("date_finished"), "%Y-%m"),
          "DESC",
        ],
      ],
    });

    res.json({
      statusStats: statusStats.reduce((acc, stat) => {
        acc[stat.dataValues.reading_status] = parseInt(stat.dataValues.count);
        return acc;
      }, {}),
      averageRating: avgRating
        ? parseFloat(avgRating.dataValues.average_rating).toFixed(1)
        : null,
      ratedBooks: avgRating ? parseInt(avgRating.dataValues.rated_books) : 0,
      monthlyReading: monthlyReading.map((item) => ({
        month: item.dataValues.month,
        count: parseInt(item.dataValues.books_finished),
      })),
    });
  } catch (error) {
    console.error("Error en getReadingStats:", error);
    res.status(500).json({ error: "Error al obtener estadísticas de lectura" });
  }
}

// Crear manualmente un UserBook (mantenemos para flexibilidad)
export async function createUserBook(req, res) {
  try {
    const { user_id, book_id, liked, is_for_sale } = req.body;

    // Verificar autenticación si no es admin
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.create({
      user_id,
      book_id,
      liked,
      is_for_sale,
    });
    res.status(201).json(userBook);
  } catch (error) {
    console.error("Error en createUserBook:", error);
    res.status(500).json({ error: "Error al crear UserBook" });
  }
}

// Obtener todos los UserBooks (solo para admin)
export async function getAllUserBooks(req, res) {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBooks = await UserBook.findAll();
    res.json(userBooks);
  } catch (error) {
    console.error("Error en getAllUserBooks:", error);
    res.status(500).json({ error: "Error al obtener UserBooks" });
  }
}

// Obtener un UserBook por ID
export async function getUserBookById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.findByPk(id);
    if (!userBook)
      return res.status(404).json({ error: "UserBook no encontrado" });

    res.json(userBook);
  } catch (error) {
    console.error("Error en getUserBookById:", error);
    res.status(500).json({ error: "Error al obtener UserBook" });
  }
}

// Actualizar un UserBook
export async function updateUserBook(req, res) {
  try {
    const { id } = req.params;
    const { liked, is_for_sale } = req.body;
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.findByPk(id);
    if (!userBook)
      return res.status(404).json({ error: "UserBook no encontrado" });

    await userBook.update({ liked, is_for_sale });

    res.json(userBook);
  } catch (error) {
    console.error("Error en updateUserBook:", error);
    res.status(500).json({ error: "Error al actualizar UserBook" });
  }
}

// Eliminar un UserBook
export async function deleteUserBook(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const userBook = await UserBook.findByPk(id);
    if (!userBook)
      return res.status(404).json({ error: "UserBook no encontrado" });

    await userBook.destroy();
    res.json({ message: "UserBook eliminado correctamente" });
  } catch (error) {
    console.error("Error en deleteUserBook:", error);
    res.status(500).json({ error: "Error al eliminar UserBook" });
  }
}

// Resetear todos los swipes de un usuario
export async function resetUserSwipes(req, res) {
  try {
    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    await UserBook.destroy({
      where: { user_id },
    });
    res.json({ message: "Swipes del usuario eliminados" });
  } catch (error) {
    console.error("Error en resetUserSwipes:", error);
    res.status(500).json({ error: "Error al resetear swipes" });
  }
}
