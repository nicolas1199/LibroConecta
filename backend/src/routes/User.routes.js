import { Router } from "express"
import { getUserPublicProfile } from "../controllers/User.controller.js"

const router = Router()

// Obtener perfil público de un usuario por ID
router.get("/:userId/profile", getUserPublicProfile)

export default router 