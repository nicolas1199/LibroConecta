import { Router } from "express";
import {
  createRating,
  getUserRatings,
  getMyRatings,
  updateRating,
  deleteRating,
  getPendingRatings,
} from "../controllers/Rating.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  validateRatingCreation,
  validateRatingUpdate,
  validateRatingParams,
  validateUserParams,
  validateRatingOwnership,
  validateRatingQueryParams,
} from "../middlewares/rating.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/ratings/my - Obtener mis calificaciones (recibidas o dadas)
router.get("/my", validateRatingQueryParams, getMyRatings);

// GET /api/ratings/pending - Obtener calificaciones pendientes
router.get("/pending", getPendingRatings);

// GET /api/ratings/user/:user_id - Obtener calificaciones de un usuario específico
router.get("/user/:user_id", validateUserParams, getUserRatings);

// POST /api/ratings - Crear una nueva calificación
router.post("/", validateRatingCreation, createRating);

// PUT /api/ratings/:rating_id - Actualizar una calificación
router.put("/:rating_id", validateRatingParams, validateRatingOwnership, validateRatingUpdate, updateRating);

// DELETE /api/ratings/:rating_id - Eliminar una calificación
router.delete("/:rating_id", validateRatingParams, validateRatingOwnership, deleteRating);

export default router; 