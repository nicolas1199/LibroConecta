import { Router } from "express";
import {
  saveDraft,
  getUserDrafts,
  getDraftById,
  updateDraft,
  deleteDraft,
  publishFromDraft,
} from "../controllers/Drafts.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validateUUIDParam } from "../utils/uuid.util.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/drafts - Crear o actualizar un borrador
router.post("/", saveDraft);

// GET /api/drafts - Obtener todos los borradores del usuario
router.get("/", getUserDrafts);

// GET /api/drafts/:id - Obtener un borrador específico
router.get("/:id", validateUUIDParam, getDraftById);

// PUT /api/drafts/:id - Actualizar un borrador
router.put("/:id", validateUUIDParam, updateDraft);

// DELETE /api/drafts/:id - Eliminar un borrador
router.delete("/:id", validateUUIDParam, deleteDraft);

// POST /api/drafts/:id/publish - Publicar un borrador
router.post("/:id/publish", validateUUIDParam, publishFromDraft);

export default router;
