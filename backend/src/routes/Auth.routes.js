import { Router } from "express"
import { login, register } from "../controllers/Auth.controller.js"

const router = Router()

// Login por email o username
router.post("/login", login)

// Registro de usuario
router.post("/register", register)

export default router
