import { Router } from "express";
import {
  getMatches,
  getSuggestedMatches,
  createMatch,
  deleteMatch,
} from "../controllers/Match.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  validateMatchCreation,
  validateMatchParams,
  validateMatchOwnership,
} from "../middlewares/match.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/matches - Obtener matches del usuario
router.get("/", getMatches);

// GET /api/matches/suggested - Obtener matches sugeridos
router.get("/suggested", getSuggestedMatches);

// POST /api/matches - Crear un nuevo match
router.post("/", validateMatchCreation, createMatch);

// DELETE /api/matches/:match_id - Eliminar un match
router.delete("/:match_id", validateMatchParams, validateMatchOwnership, deleteMatch);

export default router;
