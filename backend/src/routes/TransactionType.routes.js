import { Router } from "express"
import {
  getAllTransactionTypes,
  getTransactionTypeById,
  createTransactionType,
  updateTransactionType,
  deleteTransactionType,
} from "../controllers/TransactionType.controller.js"
// import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js"

const router = Router()

// Rutas públicas
router.get("/", getAllTransactionTypes)
router.get("/:id", getTransactionTypeById)

// Rutas protegidas para administradores (comentadas para facilitar pruebas)
router.post("/", /* authenticateToken, requireAdmin, */ createTransactionType)
router.put("/:id", /* authenticateToken, requireAdmin, */ updateTransactionType)
router.delete("/:id", /* authenticateToken, requireAdmin, */ deleteTransactionType)

export default router
