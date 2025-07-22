import { Router } from "express";
import {
  getMessages,
  sendMessage,
  getConversations,
  deleteMessage,
  markAsRead,
} from "../controllers/Message.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// GET /api/messages/conversations - Obtener todas las conversaciones del usuario
router.get("/conversations", authenticateToken, getConversations);

// GET /api/messages/:match_id - Obtener mensajes de un match específico
router.get("/:match_id", authenticateToken, getMessages);

// POST /api/messages/:match_id - Enviar mensaje
router.post("/:match_id", authenticateToken, sendMessage);

// PUT /api/messages/:match_id/read - Marcar mensajes como leídos
router.put("/:match_id/read", authenticateToken, markAsRead);

// DELETE /api/messages/message/:message_id - Eliminar mensaje específico
router.delete("/message/:message_id", authenticateToken, deleteMessage);

export default router;
