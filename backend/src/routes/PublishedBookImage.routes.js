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
import { promises as fs } from 'fs'
import path from 'path'

const router = Router()

// Endpoint de prueba para verificar archivos estáticos
router.get("/test-static", async (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', 'books')
    const files = await fs.readdir(uploadsDir)
    res.json({
      message: "Archivos en uploads/books:",
      directory: uploadsDir,
      files: files,
      count: files.length
    })
  } catch (error) {
    res.status(500).json({
      error: "Error accediendo a directorio uploads",
      message: error.message
    })
  }
})

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
