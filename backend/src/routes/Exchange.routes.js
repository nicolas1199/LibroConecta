import { Router } from "express";
import { completeExchange, getExchangeInfo } from "../controllers/Exchange.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/exchanges/:match_id - Obtener información del intercambio
router.get("/:match_id", authenticateToken, getExchangeInfo);

// POST /api/exchanges/:match_id/complete - Completar intercambio
router.post("/:match_id/complete", authenticateToken, completeExchange);

export default router;
