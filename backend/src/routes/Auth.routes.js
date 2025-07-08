import { Router } from "express"
import { login, register, getUserProfile, updateUserProfile } from "../controllers/Auth.controller.js"
import { authenticateToken } from "../middlewares/auth.middleware.js"

const router = Router()

// Login por email o username
router.post("/login", login)

// Registro de usuario
router.post("/register", register)

// Rutas protegidas para perfil de usuario
router.get("/profile", authenticateToken, getUserProfile)
router.put("/profile", authenticateToken, updateUserProfile)

export default router
