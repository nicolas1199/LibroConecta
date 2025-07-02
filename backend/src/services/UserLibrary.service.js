import { UserLibrary, Book, Category } from "../db/modelIndex.js";
import { Op, Sequelize } from "sequelize";

// Agregar o actualizar un libro en la biblioteca personal
export async function addToLibraryService(userId, bookData) {
  const { book_id, reading_status, rating, review } = bookData;

  // Verificar si el libro ya está en la biblioteca del usuario
  const existingUserLibrary = await UserLibrary.findOne({
    where: { user_id: userId, book_id },
  });

  let userLibrary;
  if (existingUserLibrary) {
    // Si ya existe, actualizar los campos de biblioteca
    const updateData = {
      reading_status,
      rating,
      review,
      date_started:
        reading_status === "leyendo"
          ? new Date()
          : existingUserLibrary.dataValues.date_started,
      date_finished: reading_status === "leido" ? new Date() : null,
    };

    await existingUserLibrary.update(updateData);
    userLibrary = existingUserLibrary;
  } else {
    // Si no existe, crear nueva entrada
    userLibrary = await UserLibrary.create({
      user_id: userId,
      book_id,
      reading_status,
      rating,
      review,
      date_started: reading_status === "leyendo" ? new Date() : null,
      date_finished: reading_status === "leido" ? new Date() : null,
    });
  }

  // Incluir información del libro en la respuesta
  return await UserLibrary.findByPk(userLibrary.dataValues.user_library_id, {
    include: [
      {
        model: Book,
        attributes: ["title", "author", "date_of_pub"],
        include: [
          {
            model: Category,
            as: "Categories",
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
}

// Obtener biblioteca personal del usuario con filtros y paginación
export async function getUserLibraryService(userId, options = {}) {
  const { status, page = 1, limit = 10 } = options;

  // Construir condiciones de búsqueda
  const whereConditions = { user_id: userId };
  if (status) {
    whereConditions.reading_status = status;
  }

  const offset = (page - 1) * limit;

  const { count, rows: userLibraries } = await UserLibrary.findAndCountAll({
    where: whereConditions,
    include: [
      {
        model: Book,
        attributes: ["book_id", "title", "author", "date_of_pub", "location"],
        include: [
          {
            model: Category,
            as: "Categories",
            through: { attributes: [] },
          },
        ],
      },
    ],
    order: [["updatedAt", "DESC"]],
    limit: parseInt(limit),
    offset: offset,
  });

  // Agrupar por estado para estadísticas
  const stats = await getLibraryStatsService(userId);

  return {
    books: userLibraries,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      totalBooks: count,
      hasNextPage: page * limit < count,
      hasPreviousPage: page > 1,
    },
    stats,
  };
}

// Actualizar el estado de lectura de un libro específico
export async function updateReadingStatusService(userLibrary, updateData) {
  const { reading_status, rating, review } = updateData;

  // Gestionar fechas automáticamente
  const finalUpdateData = { reading_status, rating, review };

  if (
    reading_status === "leyendo" &&
    userLibrary.dataValues.reading_status !== "leyendo"
  ) {
    finalUpdateData.date_started = new Date();
    finalUpdateData.date_finished = null; // Limpiar fecha de finalización si vuelve a leer
  } else if (
    reading_status === "leido" &&
    userLibrary.dataValues.reading_status !== "leido"
  ) {
    finalUpdateData.date_finished = new Date();
    if (!userLibrary.dataValues.date_started) {
      finalUpdateData.date_started = new Date();
    }
  } else if (reading_status === "por_leer") {
    finalUpdateData.date_started = null;
    finalUpdateData.date_finished = null;
  }

  await userLibrary.update(finalUpdateData);

  // Obtener el libro actualizado con información del libro
  return await UserLibrary.findByPk(userLibrary.dataValues.user_library_id, {
    include: [
      {
        model: Book,
        attributes: ["title", "author", "date_of_pub"],
        include: [
          {
            model: Category,
            as: "Categories",
            through: { attributes: [] },
          },
        ],
      },
    ],
  });
}

// Obtener estadísticas básicas de la biblioteca por estado
export async function getLibraryStatsService(userId) {
  const stats = await UserLibrary.findAll({
    where: {
      user_id: userId,
    },
    attributes: [
      "reading_status",
      [Sequelize.fn("COUNT", Sequelize.col("user_library_id")), "count"],
    ],
    group: ["reading_status"],
  });

  return stats.reduce((acc, stat) => {
    acc[stat.dataValues.reading_status] = parseInt(stat.dataValues.count);
    return acc;
  }, {});
}

// Obtener estadísticas completas de lectura del usuario
export async function getReadingStatsService(userId) {
  // Estadísticas básicas por estado
  const statusStats = await getLibraryStatsService(userId);

  // Promedio de calificaciones
  const avgRating = await UserLibrary.findOne({
    where: {
      user_id: userId,
      rating: { [Op.not]: null },
    },
    attributes: [
      [Sequelize.fn("AVG", Sequelize.col("rating")), "average_rating"],
      [Sequelize.fn("COUNT", Sequelize.col("rating")), "rated_books"],
    ],
  });

  // Libros leídos por mes (últimos 12 meses)
  const monthlyReading = await UserLibrary.findAll({
    where: {
      user_id: userId,
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
        Sequelize.fn("COUNT", Sequelize.col("user_library_id")),
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

  return {
    statusStats,
    averageRating: avgRating
      ? parseFloat(avgRating.dataValues.average_rating).toFixed(1)
      : null,
    ratedBooks: avgRating ? parseInt(avgRating.dataValues.rated_books) : 0,
    monthlyReading: monthlyReading.map((item) => ({
      month: item.dataValues.month,
      count: parseInt(item.dataValues.books_finished),
    })),
  };
}

// Validar que un rating esté en el rango correcto
export function validateRatingService(rating) {
  if (rating !== null && rating !== undefined) {
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new Error("La calificación debe ser un número entero entre 1 y 5");
    }
  }
  return true;
}

// Validar que el estado de lectura sea válido
export function validateReadingStatusService(status) {
  const validStatuses = ["por_leer", "leyendo", "leido"];
  if (status && !validStatuses.includes(status)) {
    throw new Error(
      `Estado de lectura inválido. Debe ser uno de: ${validStatuses.join(", ")}`
    );
  }
  return true;
}

// Buscar un UserLibrary por ID y validar permisos
export async function findUserLibraryByIdService(userLibraryId, userId) {
  const userLibrary = await UserLibrary.findOne({
    where: {
      user_library_id: userLibraryId,
      user_id: userId,
    },
    include: [
      {
        model: Book,
        attributes: ["title", "author", "date_of_pub"],
        include: [
          {
            model: Category,
            as: "Categories",
            through: { attributes: [] },
          },
        ],
      },
    ],
  });

  if (!userLibrary) {
    throw new Error("Libro no encontrado en tu biblioteca");
  }

  return userLibrary;
}

// Eliminar un libro de la biblioteca personal
export async function removeFromLibraryService(userLibraryId, userId) {
  const userLibrary = await findUserLibraryByIdService(userLibraryId, userId);

  await userLibrary.destroy();
  return { message: "Libro eliminado de la biblioteca correctamente" };
}
