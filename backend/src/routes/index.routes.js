import { Router } from "express";

import bookRoutes from "./Book.routes.js";
import userBookRoutes from "./UserBook.routes.js";

const router = Router();

// Rutas de libros
router.use("/books", bookRoutes);

// Rutas de biblioteca personal y relaciones usuario-libro
router.use("/user-books", userBookRoutes);

export default router;
