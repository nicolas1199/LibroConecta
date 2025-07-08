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
import { uploadBookImagesCloudinary } from "../middlewares/cloudinary.middleware.js"

const router = Router()

// Endpoint de prueba para verificar configuración de Cloudinary
router.get("/test-cloudinary", async (req, res) => {
  try {
    const hasConfig = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    
    res.json({
      message: "Estado de configuración de Cloudinary",
      configured: hasConfig,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✅ Configurado" : "❌ No configurado",
      api_key: process.env.CLOUDINARY_API_KEY ? "✅ Configurado" : "❌ No configurado",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "✅ Configurado" : "❌ No configurado",
      ready: hasConfig ? "✅ Listo para subir imágenes" : "❌ Requiere configuración"
    })
  } catch (error) {
    res.status(500).json({
      error: "Error verificando configuración de Cloudinary",
      message: error.message
    })
  }
})

// Rutas públicas
router.get("/published-book/:publishedBookId", getImagesByPublishedBook)
router.get("/:id", getPublishedBookImageById)

// Rutas protegidas (requieren autenticación)
// Nueva ruta para subir archivos a Cloudinary
router.post("/upload/:publishedBookId", authenticateToken, uploadBookImagesCloudinary, uploadImagesForPublishedBook)
// Ruta legacy para URLs directas
router.post("/published-book/:publishedBookId", authenticateToken, addImageToPublishedBook)
router.put("/:id", authenticateToken, updatePublishedBookImage)
router.put("/:id/primary", authenticateToken, setPrimaryImage)
router.delete("/:id", authenticateToken, deletePublishedBookImage)

export default router
