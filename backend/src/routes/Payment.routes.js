import { Router } from "express";
import { 
  createPaymentPreference,
  handlePaymentWebhook,
  getPaymentStatus,
  getUserPayments,
  processDirectPayment,
  getUserPurchaseHistory,
  getUserSalesHistory,
  rateTransaction
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

/**
 * @route POST /api/payments/process
 * @desc Procesar pago directo usando MercadoPago Payment API
 * @access Public (puede ser usado por el frontend directamente)
 * @body {object} payment_data - Datos del pago según MercadoPago API
 */
router.post("/process", processDirectPayment);

/**
 * @route GET /api/payments/user/purchases
 * @desc Obtener historial de compras del usuario autenticado
 * @access Private
 * @query {number} [limit=20] - Límite de resultados por página
 * @query {number} [offset=0] - Número de resultados a saltar
 */
router.get(
  "/user/purchases",
  authenticateToken,
  getUserPurchaseHistory
);

/**
 * @route GET /api/payments/user/sales
 * @desc Obtener historial de ventas del usuario autenticado
 * @access Private
 * @query {number} [limit=20] - Límite de resultados por página
 * @query {number} [offset=0] - Número de resultados a saltar
 */
router.get(
  "/user/sales",
  authenticateToken,
  getUserSalesHistory
);

/**
 * @route POST /api/payments/transactions/:transactionId/rate
 * @desc Calificar una transacción completada
 * @access Private (solo el comprador puede calificar al vendedor)
 * @body {number} rating - Calificación del 1 al 5
 * @body {string} [comment] - Comentario opcional
 */
router.post(
  "/transactions/:transactionId/rate",
  authenticateToken,
  validateUUIDParam("transactionId"),
  rateTransaction
);

export default router; 