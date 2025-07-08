import { Router } from "express";
import {
  getMessages,
  sendMessage,
  getConversations,
  deleteMessage,
  markMessagesAsRead,
} from "../controllers/Message.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/messages/conversations - Obtener todas las conversaciones del usuario
router.get("/conversations", getConversations);

// GET /api/messages/:match_id - Obtener mensajes de un match específico
router.get("/:match_id", getMessages);

// POST /api/messages/:match_id - Enviar un mensaje en un match
router.post("/:match_id", sendMessage);

// PUT /api/messages/:match_id/read - Marcar mensajes como leídos
router.put("/:match_id/read", markMessagesAsRead);

// DELETE /api/messages/message/:message_id - Eliminar un mensaje específico
router.delete("/message/:message_id", deleteMessage);

export default router; 