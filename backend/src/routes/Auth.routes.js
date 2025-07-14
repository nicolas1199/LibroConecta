import { Router } from "express";
import {
  login,
  register,
  getUserProfile,
  updateUserProfile,
  refreshToken,
  logout,
} from "../controllers/Auth.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Login por email o username
router.post("/login", login);

// Registro de usuario
router.post("/register", register);

// Refresh token
router.post("/refresh", refreshToken);

// Rutas protegidas para perfil de usuario
router.get("/profile", authenticateToken, getUserProfile);
router.put("/profile", authenticateToken, updateUserProfile);

// Logout protegido
router.post("/logout", authenticateToken, logout);

export default router;
