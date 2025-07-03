import { Router } from "express"
import {
  getAllLocations,
  getLocationById,
  getLocationsByRegion,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/LocationBook.controller.js"
// import { authenticateToken, requireAdmin } from "../middlewares/auth.middleware.js"

const router = Router()

// Rutas públicas
router.get("/", getAllLocations)
router.get("/region/:region", getLocationsByRegion)
router.get("/:id", getLocationById)

// Rutas protegidas para administradores (comentadas para facilitar pruebas)
router.post("/", /* authenticateToken, requireAdmin, */ createLocation)
router.put("/:id", /* authenticateToken, requireAdmin, */ updateLocation)
router.delete("/:id", /* authenticateToken, requireAdmin, */ deleteLocation)

export default router
