import { Router } from "express";
import { 
  createPaymentPreference,
  handlePaymentWebhook,
  getPaymentStatus,
  getUserPayments
} from "../controllers/Payment.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import { validateUUIDParam } from "../utils/uuid.util.js";

const router = Router();

/**
 * @route POST /api/payments/preferences/:publishedBookId
 * @desc Crear preferencia de pago para un libro
 * @access Private (requiere autenticación)
 */
router.post(
  "/preferences/:publishedBookId",
  authenticateToken,
  createPaymentPreference
);

/**
 * @route POST /api/payments/webhook
 * @desc Webhook para notificaciones de MercadoPago
 * @access Public (sin autenticación, solo para MercadoPago)
 * @note Esta ruta debe estar configurada en MercadoPago
 */
router.post("/webhook", handlePaymentWebhook);

/**
 * @route GET /api/payments/:paymentId/status
 * @desc Obtener estado de un pago específico
 * @access Private (solo comprador o vendedor)
 */
router.get(
  "/:paymentId/status",
  authenticateToken,
  validateUUIDParam("paymentId"),
  getPaymentStatus
);

/**
 * @route GET /api/payments/user
 * @desc Listar todos los pagos del usuario autenticado
 * @access Private
 * @query {string} [type=all] - Tipo de pago: 'purchases', 'sales', 'all'
 * @query {string} [status] - Estado del pago: 'pending', 'paid', 'failed', etc.
 * @query {number} [limit=20] - Límite de resultados por página
 * @query {number} [offset=0] - Número de resultados a saltar
 */
router.get(
  "/user",
  authenticateToken,
  getUserPayments
);

export default router; 