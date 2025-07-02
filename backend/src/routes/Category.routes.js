import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/Category.controller.js";

const router = Router();

// Obtener todas las categorías (público)
router.get("/", getAllCategories);

// Obtener categoría por ID (público)
router.get("/:id", getCategoryById);

// Crear nueva categoría (requiere autenticación)
router.post("/", createCategory);

// Actualizar categoría (requiere autenticación)
router.put("/:id", updateCategory);

// Eliminar categoría (requiere autenticación)
router.delete("/:id", deleteCategory);

export default router;
