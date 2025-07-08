import { Router } from "express";
import {
  getMessages,
  sendMessage,
  getConversations,
  deleteMessage,
  markMessagesAsRead,
} from "../controllers/Message.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  validateMessageCreation,
  validateMessageParams,
  validateMessageIdParams,
  validateConversationAccess,
  validateMessageOwnership,
} from "../middlewares/message.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/messages/conversations - Obtener todas las conversaciones del usuario
router.get("/conversations", getConversations);

// GET /api/messages/:match_id - Obtener mensajes de un match específico
router.get("/:match_id", validateMessageParams, validateConversationAccess, getMessages);

// POST /api/messages/:match_id - Enviar un mensaje en un match
router.post("/:match_id", validateMessageParams, validateConversationAccess, validateMessageCreation, sendMessage);

// PUT /api/messages/:match_id/read - Marcar mensajes como leídos
router.put("/:match_id/read", validateMessageParams, validateConversationAccess, markMessagesAsRead);

// DELETE /api/messages/message/:message_id - Eliminar un mensaje específico
router.delete("/message/:message_id", validateMessageIdParams, validateMessageOwnership, deleteMessage);

export default router; 