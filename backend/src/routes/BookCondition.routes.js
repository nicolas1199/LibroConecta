import { Router } from "express"
import {
  getAllBookConditions,
  getBookConditionById,
  createBookCondition,
  updateBookCondition,
  deleteBookCondition,
} from "../controllers/BookCondition.controller.js"
// import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js"

const router = Router()

// Rutas públicas
router.get("/", getAllBookConditions)
router.get("/:id", getBookConditionById)

// Rutas protegidas para administradores (comentadas para facilitar pruebas)
router.post("/", /* authenticateToken, requireAdmin, */ createBookCondition)
router.put("/:id", /* authenticateToken, requireAdmin, */ updateBookCondition)
router.delete("/:id", /* authenticateToken, requireAdmin, */ deleteBookCondition)

export default router
