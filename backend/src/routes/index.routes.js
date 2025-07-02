import { Router } from "express";

import bookRoutes from "./Book.routes.js";
import userBookRoutes from "./UserBook.routes.js";
import userLibraryRoutes from "./UserLibrary.routes.js";
import authRoutes from "./Auth.routes.js";
import categoryRoutes from "./Category.routes.js";

const router = Router();

// Rutas de libros
router.use("/books", bookRoutes);

// Rutas de intercambio/venta de libros (swipe, marketplace)
router.use("/user-books", userBookRoutes);

// Rutas de biblioteca personal
router.use("/library", userLibraryRoutes);

// Rutas de autenticación
router.use("/auth", authRoutes);

// Rutas de categorías
router.use("/categories", categoryRoutes);

export default router;
