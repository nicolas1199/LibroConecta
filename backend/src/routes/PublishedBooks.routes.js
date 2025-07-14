import { Router } from "express";
import {
  getAllPublishedBooks,
  getPublishedBookById,
  getPublishedBooksByUser,
  createPublishedBook,
  updatePublishedBook,
  deletePublishedBook,
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
router.get("/:id", getPublishedBookById);
router.get(
  "/user/:userId",
  validateUUIDParam("userId"),
  getPublishedBooksByUser
);

// Rutas protegidas (requieren autenticación)
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

export default router;
