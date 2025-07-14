import { UserLibrary } from "../db/modelIndex.js";
import { Op, Sequelize } from "sequelize";
import {
  READING_STATUSES,
  VALID_READING_STATUSES,
  PAGINATION_DEFAULTS,
  RESPONSE_MESSAGES,
  RATING_LIMITS,
} from "../utils/constants.util.js";

// Agregar o actualizar un libro en la biblioteca personal
export async function addToLibraryService(userId, bookData) {
  const {
    title,
    author,
    isbn,
    image_url,
    date_of_pub,
    reading_status,
    rating,
    review,
    date_started,
    date_finished,
  } = bookData;

  // Verificar si el libro ya está en la biblioteca del usuario (por título y autor)
  const existingUserLibrary = await UserLibrary.findOne({
    where: {
      user_id: userId,
      title: title.trim(),
      author: author ? author.trim() : null,
    },
  });

  let userLibrary;
  if (existingUserLibrary) {
    // Si ya existe, actualizar los campos de biblioteca
    const updateData = {
      reading_status,
      rating,
      review,
      isbn,
      image_url,
      date_of_pub,
    };

    // Usar fechas manuales si están disponibles, sino usar lógica automática
    if (date_started !== undefined) {
      updateData.date_started = date_started ? new Date(date_started) : null;
    } else {
      // Lógica automática para fecha de inicio
      if (
        reading_status === READING_STATUSES.READING &&
        existingUserLibrary.dataValues.reading_status !==
          READING_STATUSES.READING
      ) {
        updateData.date_started = new Date();
      } else if (reading_status === READING_STATUSES.TO_READ) {
        updateData.date_started = null;
      }
    }

    if (date_finished !== undefined) {
      updateData.date_finished = date_finished ? new Date(date_finished) : null;
    } else {
      // Lógica automática para fecha de finalización
      if (
        reading_status === READING_STATUSES.READ &&
        existingUserLibrary.dataValues.reading_status !== READING_STATUSES.READ
      ) {
        updateData.date_finished = new Date();
        if (
          !existingUserLibrary.dataValues.date_started &&
          date_started === undefined
        ) {
          updateData.date_started = new Date();
        }
      } else if (reading_status === "leyendo") {
        updateData.date_finished = null;
      } else if (reading_status === "por_leer") {
        updateData.date_finished = null;
      }
    }

    await existingUserLibrary.update(updateData);
    userLibrary = existingUserLibrary;
  } else {
    // Si no existe, crear nueva entrada
    let createData = {
      user_id: userId,
      title: title.trim(),
      author: author ? author.trim() : null,
      isbn,
      image_url,
      date_of_pub,
      reading_status,
      rating,
      review,
    };

    // Usar fechas manuales si están disponibles, sino usar lógica automática
    if (date_started !== undefined) {
      createData.date_started = date_started ? new Date(date_started) : null;
    } else {
      // Establecer fechas según el estado inicial
      if (reading_status === READING_STATUSES.READING) {
        createData.date_started = new Date();
      } else if (reading_status === READING_STATUSES.READ) {
        createData.date_started = new Date();
      } else {
        createData.date_started = null;
      }
    }

    if (date_finished !== undefined) {
      createData.date_finished = date_finished ? new Date(date_finished) : null;
    } else {
      if (reading_status === "leido") {
        createData.date_finished = new Date();
      } else {
        createData.date_finished = null;
      }
    }

    userLibrary = await UserLibrary.create(createData);
  }

  return userLibrary;
}

// Obtener biblioteca personal del usuario con filtros y paginación
export async function getUserLibraryService(userId, options = {}) {
  const {
    status,
    page = PAGINATION_DEFAULTS.PAGE,
    limit = PAGINATION_DEFAULTS.LIMIT,
  } = options;

  // Construir condiciones de búsqueda
  const whereConditions = { user_id: userId };
  if (status) {
    whereConditions.reading_status = status;
  }

  const offset = (page - 1) * limit;

  const { count, rows: userLibraries } = await UserLibrary.findAndCountAll({
    where: whereConditions,
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
  const { reading_status, rating, review, date_started, date_finished } =
    updateData;

  // Usar fechas del frontend si están disponibles, sino usar lógica automática
  const finalUpdateData = { reading_status, rating, review };

  // Si se proporcionan fechas desde el frontend, usarlas
  if (date_started !== undefined) {
    finalUpdateData.date_started = date_started ? new Date(date_started) : null;
  }

  if (date_finished !== undefined) {
    finalUpdateData.date_finished = date_finished
      ? new Date(date_finished)
      : null;
  }

  // Solo aplicar lógica automática si no se proporcionaron fechas desde el frontend
  if (date_started === undefined && date_finished === undefined) {
    if (
      reading_status === READING_STATUSES.READING &&
      userLibrary.dataValues.reading_status !== READING_STATUSES.READING
    ) {
      finalUpdateData.date_started = new Date();
      finalUpdateData.date_finished = null; // Limpiar fecha de finalización si vuelve a leer
    } else if (
      reading_status === READING_STATUSES.READ &&
      userLibrary.dataValues.reading_status !== READING_STATUSES.READ
    ) {
      finalUpdateData.date_finished = new Date();
      if (!userLibrary.dataValues.date_started) {
        finalUpdateData.date_started = new Date();
      }
    } else if (reading_status === READING_STATUSES.TO_READ) {
      finalUpdateData.date_started = null;
      finalUpdateData.date_finished = null;
    }
  }

  await userLibrary.update(finalUpdateData);

  // Retornar el libro actualizado
  return await UserLibrary.findByPk(userLibrary.dataValues.user_library_id);
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

  // Libros leídos por mes (últimos 12 meses) - Compatible con PostgreSQL
  const monthlyReading = await UserLibrary.findAll({
    where: {
      user_id: userId,
      reading_status: READING_STATUSES.READ,
      date_finished: {
        [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12)),
      },
    },
    attributes: [
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("date_finished"), "YYYY-MM"),
        "month",
      ],
      [
        Sequelize.fn("COUNT", Sequelize.col("user_library_id")),
        "books_finished",
      ],
    ],
    group: [Sequelize.fn("TO_CHAR", Sequelize.col("date_finished"), "YYYY-MM")],
    order: [
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("date_finished"), "YYYY-MM"),
        "DESC",
      ],
    ],
  });

  return {
    ...statusStats,
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
    if (
      rating < RATING_LIMITS.MIN ||
      rating > RATING_LIMITS.MAX ||
      !Number.isInteger(rating)
    ) {
      throw new Error(RESPONSE_MESSAGES.INVALID_RATING);
    }
  }
  return true;
}

// Validar que el estado de lectura sea válido
export function validateReadingStatusService(status) {
  if (status && !VALID_READING_STATUSES.includes(status)) {
    throw new Error(RESPONSE_MESSAGES.INVALID_READING_STATUS);
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

// Obtener insights avanzados de la biblioteca del usuario
export async function getAdvancedLibraryInsights(userId) {
  try {
    // Obtener todos los libros del usuario
    const allBooks = await UserLibrary.findAll({
      where: {
        user_id: userId,
      },
    });

    // Estadísticas por autor
    const authorStats = {};
    allBooks.forEach((book) => {
      const author = book.dataValues.author;
      if (author) {
        authorStats[author] = (authorStats[author] || 0) + 1;
      }
    });

    // Tiempo promedio de lectura (para libros que tienen ambas fechas)
    const readingTimes = allBooks.filter(
      (book) =>
        book.dataValues.reading_status === READING_STATUSES.READ &&
        book.dataValues.date_started &&
        book.dataValues.date_finished
    );

    let averageReadingDays = 0;
    if (readingTimes.length > 0) {
      const totalDays = readingTimes.reduce((acc, book) => {
        const startDate = new Date(book.dataValues.date_started);
        const endDate = new Date(book.dataValues.date_finished);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
      }, 0);

      averageReadingDays = Math.round(totalDays / readingTimes.length);
    }

    // Libros leídos por mes
    const monthlyReadingStats = {};
    allBooks
      .filter(
        (book) =>
          book.dataValues.reading_status === READING_STATUSES.READ &&
          book.dataValues.date_finished
      )
      .forEach((book) => {
        const finishDate = new Date(book.dataValues.date_finished);
        const monthYear = `${finishDate.getFullYear()}-${String(
          finishDate.getMonth() + 1
        ).padStart(2, "0")}`;
        monthlyReadingStats[monthYear] =
          (monthlyReadingStats[monthYear] || 0) + 1;
      });

    // Promedio de calificaciones
    const ratedBooks = allBooks.filter(
      (book) => book.dataValues.rating !== null
    );
    const averageRating =
      ratedBooks.length > 0
        ? ratedBooks.reduce((sum, book) => sum + book.dataValues.rating, 0) /
          ratedBooks.length
        : 0;

    return {
      topAuthors: Object.entries(authorStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count })),
      averageReadingDays,
      booksWithReadingTime: readingTimes.length,
      monthlyReadingStats,
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatedBooks: ratedBooks.length,
    };
  } catch (error) {
    console.error("Error en getAdvancedLibraryInsights:", error);
    throw error;
  }
}
