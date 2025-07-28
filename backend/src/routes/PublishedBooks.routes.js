import { Router } from "express";
import {
  getAllPublishedBooks,
  getPublishedBookById,
  getPublishedBooksByUser,
  createPublishedBook,
  updatePublishedBook,
  deletePublishedBook,
  getRecommendations,
  recordInteraction,
  getUserInteractionStats,
  getUserSwipeHistory,
  updateSwipeInteraction,
  deleteSwipeInteraction,
  getUserAutoMatchStats,
  getUserAutoMatchesList,
  searchPublishedBooks,
} from "../controllers/PublishedBooks.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";
import {
  validatePublishedBookData,
  validatePublishedBookOwnership,
  validatePublishedBookReferences,
} from "../middlewares/publishedBooks.middleware.js";
import { validateUUIDParam } from "../utils/uuid.util.js";

const router = Router();

// Rutas públicas
router.get("/", getAllPublishedBooks);
router.get("/search", searchPublishedBooks);

// Rutas protegidas (requieren autenticación) - ANTES de /:id
router.get(
  "/my-books",
  authenticateToken,
  getPublishedBooksByUser
);

router.get("/:id", getPublishedBookById);
router.get(
  "/user/:userId",
  validateUUIDParam("userId"),
  getPublishedBooksByUser
);

router.post(
  "/",
  authenticateToken,
  validatePublishedBookData,
  validatePublishedBookReferences,
  createPublishedBook
);

router.put(
  "/:id",
  authenticateToken,
  validatePublishedBookOwnership,
  validatePublishedBookData,
  validatePublishedBookReferences,
  updatePublishedBook
);

router.delete(
  "/:id",
  authenticateToken,
  validatePublishedBookOwnership,
  deletePublishedBook
);

// Rutas para recomendaciones y swipe
router.get(
  "/recommendations/swipe",
  authenticateToken,
  getRecommendations
);

router.post(
  "/interactions",
  authenticateToken,
  recordInteraction
);

router.get(
  "/interactions/stats",
  authenticateToken,
  getUserInteractionStats
);

// Rutas para historial de interacciones
router.get(
  "/interactions/history",
  authenticateToken,
  getUserSwipeHistory
);

router.put(
  "/interactions/:id",
  authenticateToken,
  updateSwipeInteraction
);

router.delete(
  "/interactions/:id",
  authenticateToken,
  deleteSwipeInteraction
);

// 🚀 Rutas para auto-matches
router.get(
  "/auto-matches/stats",
  authenticateToken,
  getUserAutoMatchStats
);

router.get(
  "/auto-matches",
  authenticateToken,
  getUserAutoMatchesList
);

export default router;
