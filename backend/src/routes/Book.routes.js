import { Router } from "express"
import {
  getRandomBooks,
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/Book.controller.js"
// import { authenticateToken } from "../middlewares/auth.middleware.js";
// import { validateBookData, validateBookOwnership } from "../middlewares/book.middleware.js";

const router = Router()

// Middleware de autenticación para todas las rutas (comentado para facilitar pruebas)
// router.use(authenticateToken);

// Rutas públicas (sin autenticación)
router.get("/random", getRandomBooks)
router.get("/", getAllBooks)
router.get("/:id", getBookById)

// Rutas protegidas (requieren autenticación - comentado para pruebas)
// Para crear, actualizar y eliminar libros se requiere autenticación
router.post("/", /* authenticateToken, validateBookData, */ createBook)
router.put("/:id", /* authenticateToken, validateBookOwnership, validateBookData, */ updateBook)
router.delete("/:id", /* authenticateToken, validateBookOwnership, */ deleteBook)

export default router
