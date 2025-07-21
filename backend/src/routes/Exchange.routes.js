import { Router } from "express";
import { completeExchange, getExchangeInfo } from "../controllers/Exchange.controller.js";
import { validateAuth } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/exchanges/:match_id - Obtener información del intercambio
router.get("/:match_id", validateAuth, getExchangeInfo);

// POST /api/exchanges/:match_id/complete - Completar intercambio
router.post("/:match_id/complete", validateAuth, completeExchange);

export default router;
