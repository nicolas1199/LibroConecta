import { Router } from "express";
import { getUserNotifications, markNotificationAsRead } from "../controllers/Notification.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/notifications - Obtener notificaciones del usuario
router.get("/", getUserNotifications);

// POST /api/notifications/read - Marcar notificación como leída
router.post("/read", markNotificationAsRead);

export default router; 