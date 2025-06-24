import express from "express";
import {
  swipeBook,
  createUserBook,
  getAllUserBooks,
  getUserBookById,
  updateUserBook,
  deleteUserBook,
  resetUserSwipes,
} from "../controllers/UserBook.controller.js";
//import authenticate from "../middlewares/auth.js";

const router = express.Router();

// Función especial para swipes
router.post("/swipe", authenticate, swipeBook);

// CRUD
router.post("/", createUserBook);
router.get("/", getAllUserBooks);
router.get("/:id", getUserBookById);
router.put("/:id", updateUserBook);
router.delete("/:id", deleteUserBook);

// Reset de swipes (opcional)
router.delete("/reset/all", authenticate, resetUserSwipes);

export default router;
