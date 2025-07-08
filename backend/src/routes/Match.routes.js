import { Router } from "express";
import {
  getMatches,
  getSuggestedMatches,
  createMatch,
  deleteMatch,
} from "../controllers/Match.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/matches - Obtener matches del usuario
router.get("/", getMatches);

// GET /api/matches/suggested - Obtener matches sugeridos
router.get("/suggested", getSuggestedMatches);

// POST /api/matches - Crear un nuevo match
router.post("/", createMatch);

// DELETE /api/matches/:match_id - Eliminar un match
router.delete("/:match_id", deleteMatch);

export default router; 