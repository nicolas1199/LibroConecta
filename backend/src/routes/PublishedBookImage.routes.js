import { Router } from "express"
import {
  getImagesByPublishedBook,
  getPublishedBookImageById,
  addImageToPublishedBook,
  updatePublishedBookImage,
  deletePublishedBookImage,
  setPrimaryImage,
} from "../controllers/PublishedBookImage.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

const router = Router()

// Rutas públicas
router.get("/published-book/:publishedBookId", getImagesByPublishedBook)
router.get("/:id", getPublishedBookImageById)

// Rutas protegidas (requieren autenticación)
router.post("/published-book/:publishedBookId", authenticateToken, addImageToPublishedBook)
router.put("/:id", authenticateToken, updatePublishedBookImage)
router.put("/:id/primary", authenticateToken, setPrimaryImage)
router.delete("/:id", authenticateToken, deletePublishedBookImage)

export default router
