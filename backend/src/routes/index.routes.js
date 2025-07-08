import { Router } from "express";

import bookRoutes from "./Book.routes.js";
import userBookRoutes from "./UserBook.routes.js";
import userLibraryRoutes from "./UserLibrary.routes.js";
import authRoutes from "./Auth.routes.js";
import categoryRoutes from "./Category.routes.js";
import transactionTypeRoutes from "./TransactionType.routes.js";
import bookConditionRoutes from "./BookCondition.routes.js";
import locationBookRoutes from "./LocationBook.routes.js";
import publishedBooksRoutes from "./PublishedBooks.routes.js";
import publishedBookImageRoutes from "./PublishedBookImage.routes.js";
import matchRoutes from "./Match.routes.js";
import messageRoutes from "./Message.routes.js";
import ratingRoutes from "./Rating.routes.js";
import userRoutes from "./User.routes.js";

const router = Router();

// Rutas de libros
router.use("/books", bookRoutes);

// Rutas de intercambio (swipe)
router.use("/user-books", userBookRoutes);

// Rutas de biblioteca personal
router.use("/user-library", userLibraryRoutes);

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de categorías
router.use("/categories", categoryRoutes);

// Rutas de tipos de transacción
router.use("/transaction-types", transactionTypeRoutes);

// Rutas de condiciones de libro
router.use("/book-conditions", bookConditionRoutes);

// Rutas de ubicaciones
router.use("/locations", locationBookRoutes);

// Rutas de libros publicados
router.use("/published-books", publishedBooksRoutes);

// Rutas de imágenes de libros publicados
router.use("/published-book-images", publishedBookImageRoutes);

// Rutas de matches
router.use("/matches", matchRoutes);

// Rutas de mensajería
router.use("/messages", messageRoutes);

// Rutas de calificaciones
router.use("/ratings", ratingRoutes);

// Rutas de usuarios
router.use("/users", userRoutes);

export default router;
