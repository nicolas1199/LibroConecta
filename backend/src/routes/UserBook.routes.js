import express from "express";
import {
  swipeBook,
  createUserBook,
  getAllUserBooks,
  getUserBookById,
  updateUserBook,
  deleteUserBook,
  resetUserSwipes,
  addToLibrary,
  getUserLibrary,
  updateReadingStatus,
  getReadingStats,
  removeFromLibrary,
} from "../controllers/UserBook.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";

import {
  validateLibraryData,
  validateUserBookOwnership,
  validatePaginationParams,
} from "../middlewares/userBook.middleware.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// === RUTAS DE BIBLIOTECA PERSONAL ===
// Agregar libro a biblioteca personal
router.post("/library", validateLibraryData, addToLibrary);

// Obtener biblioteca personal del usuario
router.get("/library", validatePaginationParams, getUserLibrary);

// Actualizar estado de lectura
router.put(
  "/library/:id",
  validateUserBookOwnership,
  validateLibraryData,
  updateReadingStatus
);

// Eliminar libro de biblioteca personal
router.delete("/library/:id", removeFromLibrary);

// Obtener estadísticas de lectura
router.get("/stats", getReadingStats);

// === RUTAS DE SWIPE ===
// Función especial para swipes
router.post("/swipe", swipeBook);

// Reset de swipes (opcional)
router.delete("/reset/all", resetUserSwipes);

// === RUTAS CRUD GENERALES ===
router.post("/", createUserBook);
router.get("/", getAllUserBooks);
router.get("/:id", getUserBookById);
router.put("/:id", updateUserBook);
router.delete("/:id", deleteUserBook);

export default router;
