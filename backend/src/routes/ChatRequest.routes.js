import { Router } from "express";
import {
  createChatRequest,
  getReceivedChatRequests,
  getSentChatRequests,
  respondToChatRequest,
  getPendingChatRequestsCount
} from "../controllers/ChatRequest.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// POST /api/chat-requests - Crear una nueva solicitud de chat
router.post("/", createChatRequest);

// GET /api/chat-requests/received - Obtener solicitudes recibidas
router.get("/received", getReceivedChatRequests);

// GET /api/chat-requests/sent - Obtener solicitudes enviadas
router.get("/sent", getSentChatRequests);

// PUT /api/chat-requests/:request_id/respond - Responder a una solicitud
router.put("/:request_id/respond", respondToChatRequest);

// GET /api/chat-requests/pending-count - Obtener conteo de solicitudes pendientes
router.get("/pending-count", getPendingChatRequestsCount);

export default router; 