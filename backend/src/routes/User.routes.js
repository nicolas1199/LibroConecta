import { Router } from "express";
import { getUserPublicProfile } from "../controllers/User.controller.js";
import { validateUUIDParam } from "../utils/uuid.util.js";

const router = Router();

// Obtener perfil público de un usuario por ID
router.get(
  "/:userId/profile",
  validateUUIDParam("userId"),
  getUserPublicProfile
);

export default router;
