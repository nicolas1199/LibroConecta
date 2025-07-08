import { Router } from "express"
import {
  getImagesByPublishedBook,
  getPublishedBookImageById,
  addImageToPublishedBook,
  updatePublishedBookImage,
  deletePublishedBookImage,
  setPrimaryImage,
  uploadImagesForPublishedBook,
} from "../controllers/PublishedBookImage.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"
import { uploadBookImages } from "../middlewares/upload.middleware.js"

const router = Router()

// Rutas públicas
router.get("/published-book/:publishedBookId", getImagesByPublishedBook)
router.get("/:id", getPublishedBookImageById)

// Rutas protegidas (requieren autenticación)
// Nueva ruta para subir archivos reales
router.post("/upload/:publishedBookId", authenticateToken, uploadBookImages, uploadImagesForPublishedBook)
// Ruta legacy para URLs directas
router.post("/published-book/:publishedBookId", authenticateToken, addImageToPublishedBook)
router.put("/:id", authenticateToken, updatePublishedBookImage)
router.put("/:id/primary", authenticateToken, setPrimaryImage)
router.delete("/:id", authenticateToken, deletePublishedBookImage)

export default router
