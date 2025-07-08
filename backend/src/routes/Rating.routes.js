import { Router } from "express";
import {
  createRating,
  getUserRatings,
  getMyRatings,
  updateRating,
  deleteRating,
  getPendingRatings,
} from "../controllers/Rating.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/ratings/my - Obtener mis calificaciones (recibidas o dadas)
router.get("/my", getMyRatings);

// GET /api/ratings/pending - Obtener calificaciones pendientes
router.get("/pending", getPendingRatings);

// GET /api/ratings/user/:user_id - Obtener calificaciones de un usuario específico
router.get("/user/:user_id", getUserRatings);

// POST /api/ratings - Crear una nueva calificación
router.post("/", createRating);

// PUT /api/ratings/:rating_id - Actualizar una calificación
router.put("/:rating_id", updateRating);

// DELETE /api/ratings/:rating_id - Eliminar una calificación
router.delete("/:rating_id", deleteRating);

export default router; 