import { Router } from "express"
import {
  addToLibrary,
  getUserLibrary,
  updateReadingStatus,
  getReadingStats,
  removeFromLibrary,
  getUserLibraryBookById,
  getLibraryInsights,
} from "../controllers/UserLibrary.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

import {
  validateUserLibraryOwnership,
  validateLibraryData,
  validateBookId,
} from "../middlewares/userLibrary.middleware.js"

const router = Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// Rutas para la biblioteca personal
router.post("/add", validateBookId, validateLibraryData, addToLibrary)
router.get("/", getUserLibrary)
router.get("/stats", getReadingStats)
router.get("/insights", getLibraryInsights)
router.get("/:id", getUserLibraryBookById)
router.put("/:id", validateUserLibraryOwnership, validateLibraryData, updateReadingStatus)
router.delete("/:id", removeFromLibrary)

export default router
