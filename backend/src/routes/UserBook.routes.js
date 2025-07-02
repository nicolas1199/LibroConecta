import express from "express";
import {
  swipeBook,
  createUserBook,
  getAllUserBooks,
  getUserBookById,
  updateUserBook,
  deleteUserBook,
  resetUserSwipes,
} from "../controllers/UserBook.controller.js";

import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// === RUTAS DE SWIPE E INTERCAMBIO/VENTA ===
// Función especial para swipes (me gusta/no me gusta)
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
