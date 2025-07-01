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
} from "../controllers/UserBook.controller.js";

//import authenticate from "../middlewares/auth.js";

const router = express.Router();

// === RUTAS DE BIBLIOTECA PERSONAL ===
// Agregar libro a biblioteca personal
router.post("/library", addToLibrary);

// Obtener biblioteca personal del usuario
router.get("/library", getUserLibrary);

// Actualizar estado de lectura
router.put("/library/:id", updateReadingStatus);

// Obtener estadísticas de lectura
router.get("/stats", getReadingStats);

// === RUTAS DE SWIPE ===
// Función especial para swipes
router.post("/swipe", swipeBook);

// Reset de swipes (opcional)
router.delete("/reset/all", /* authenticate, */ resetUserSwipes);

// === RUTAS CRUD GENERALES ===
router.post("/", createUserBook);
router.get("/", getAllUserBooks);
router.get("/:id", getUserBookById);
router.put("/:id", updateUserBook);
router.delete("/:id", deleteUserBook);

export default router;
