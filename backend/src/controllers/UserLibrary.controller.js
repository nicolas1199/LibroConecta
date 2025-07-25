import {
  addToLibraryService,
  getUserLibraryService,
  updateReadingStatusService,
  getReadingStatsService,
  removeFromLibraryService,
  findUserLibraryByIdService,
  getAdvancedLibraryInsights,
  getRecommendationsService,
} from "../services/UserLibrary.service.js";
import { RESPONSE_MESSAGES } from "../utils/constants.util.js";

// Agregar libro a la biblioteca personal
export async function addToLibrary(req, res) {
  try {
    const userId = req.user.user_id;
    const bookData = req.body;

    const result = await addToLibraryService(userId, bookData);

    res.status(201).json({
      message: RESPONSE_MESSAGES.BOOK_ADDED_TO_LIBRARY,
      userLibrary: result,
    });
  } catch (error) {
    console.error("Error en addToLibrary:", error);

    // Manejar error de libro duplicado específicamente
    if (error.code === "DUPLICATE_BOOK") {
      return res.status(409).json({
        error: error.message,
        code: "DUPLICATE_BOOK",
      });
    }

    res.status(500).json({
      error: error.message || "Error al agregar libro a biblioteca",
    });
  }
}

// Obtener biblioteca personal del usuario
export async function getUserLibrary(req, res) {
  try {
    const userId = req.user.user_id;
    const options = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
      author: req.query.author,
      rating: req.query.rating,
      year: req.query.year,
      genre: req.query.genre,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
    };

    const result = await getUserLibraryService(userId, options);
    res.json(result);
  } catch (error) {
    console.error("Error en getUserLibrary:", error);
    res.status(500).json({
      error: error.message || "Error al obtener biblioteca personal",
    });
  }
}

// Actualizar estado de lectura de un libro
export async function updateReadingStatus(req, res) {
  try {
    const userLibrary = req.userLibrary;
    const updateData = req.body;

    const updatedUserLibrary = await updateReadingStatusService(
      userLibrary,
      updateData
    );

    res.json({
      message: RESPONSE_MESSAGES.READING_STATUS_UPDATED,
      userLibrary: updatedUserLibrary,
    });
  } catch (error) {
    console.error("Error en updateReadingStatus:", error);
    res.status(500).json({
      error: error.message || "Error al actualizar estado de lectura",
    });
  }
}

// Obtener estadísticas de lectura del usuario
export async function getReadingStats(req, res) {
  try {
    const userId = req.user.user_id;
    const stats = await getReadingStatsService(userId);
    res.json(stats);
  } catch (error) {
    console.error("Error en getReadingStats:", error);
    res.status(500).json({
      error: error.message || "Error al obtener estadísticas de lectura",
    });
  }
}

// Eliminar libro de la biblioteca personal
export async function removeFromLibrary(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const result = await removeFromLibraryService(id, userId);
    res.json(result);
  } catch (error) {
    console.error("Error en removeFromLibrary:", error);
    res.status(500).json({
      error: error.message || "Error al eliminar libro de biblioteca",
    });
  }
}

// Obtener un libro específico de la biblioteca por ID
export async function getUserLibraryBookById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.user_id;

    const userLibrary = await findUserLibraryByIdService(id, userId);
    res.json(userLibrary);
  } catch (error) {
    console.error("Error en getUserLibraryBookById:", error);
    res.status(500).json({
      error: error.message || "Error al obtener libro de biblioteca",
    });
  }
}

// Obtener insights avanzados de la biblioteca
export async function getLibraryInsights(req, res) {
  try {
    const userId = req.user.user_id;
    const insights = await getAdvancedLibraryInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error en getLibraryInsights:", error);
    res.status(500).json({
      error: error.message || "Error al obtener insights de biblioteca",
    });
  }
}

// Obtener recomendaciones personalizadas
export async function getRecommendations(req, res) {
  try {
    const userId = req.user.user_id;
    const recommendations = await getRecommendationsService(userId);
    res.json(recommendations);
  } catch (error) {
    console.error("Error en getRecommendations:", error);
    res.status(500).json({
      error: error.message || "Error al obtener recomendaciones",
    });
  }
}
