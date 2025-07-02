import {
  addToLibraryService,
  getUserLibraryService,
  updateReadingStatusService,
  getReadingStatsService,
  removeFromLibraryService,
  findUserLibraryByIdService,
  getAdvancedLibraryInsights,
} from "../services/UserLibrary.service.js";

// Agregar libro a la biblioteca personal
export async function addToLibrary(req, res) {
  try {
    const userId = req.user.id;
    const bookData = req.body;

    const result = await addToLibraryService(userId, bookData);

    res.status(201).json({
      message: "Libro agregado/actualizado en biblioteca personal",
      userLibrary: result,
    });
  } catch (error) {
    console.error("Error en addToLibrary:", error);
    res.status(500).json({
      error: error.message || "Error al agregar libro a biblioteca",
    });
  }
}

// Obtener biblioteca personal del usuario
export async function getUserLibrary(req, res) {
  try {
    const userId = req.user.id;
    const options = {
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
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
      message: "Estado de lectura actualizado correctamente",
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
    const userId = req.user.id;
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
    const userId = req.user.id;

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
    const userId = req.user.id;

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
    const userId = req.user.id;
    const insights = await getAdvancedLibraryInsights(userId);
    res.json(insights);
  } catch (error) {
    console.error("Error en getLibraryInsights:", error);
    res.status(500).json({
      error: error.message || "Error al obtener insights de biblioteca",
    });
  }
}
