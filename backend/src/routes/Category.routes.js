import { Router } from "express"
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getBooksByCategory,
  getCategoryStats,
} from "../controllers/Category.controller.js"
// import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js";
// import { validateCategoryData, validateCategoryDeletion } from "../middlewares/category.middleware.js";

const router = Router()

// Rutas públicas (sin autenticación)
// Obtener todas las categorías (público)
router.get("/", getAllCategories)

// Rutas específicas DEBEN ir antes de /:id
router.get("/:id/books", getBooksByCategory)
router.get("/:id/stats", getCategoryStats)

// Obtener categoría por ID (público) - DEBE ir al final
router.get("/:id", getCategoryById)

// Rutas protegidas para administradores (comentadas para facilitar pruebas)
// Solo los administradores pueden crear, actualizar y eliminar categorías

// Crear nueva categoría
router.post("/", /* authenticateToken, requireAdmin, validateCategoryData, */ createCategory)

// Actualizar categoría
router.put("/:id", /* authenticateToken, requireAdmin, validateCategoryData, */ updateCategory)

// Eliminar categoría
router.delete("/:id", /* authenticateToken, requireAdmin, validateCategoryDeletion, */ deleteCategory)

export default router
