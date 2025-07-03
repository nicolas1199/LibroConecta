import { LocationBook } from "../db/modelIndex.js"

// Obtener todas las ubicaciones
export async function getAllLocations(req, res) {
  try {
    const locations = await LocationBook.findAll({
      order: [
        ["region", "ASC"],
        ["comuna", "ASC"],
      ],
    })
    res.json(locations)
  } catch (error) {
    console.error("Error en getAllLocations:", error)
    res.status(500).json({ error: "Error al obtener ubicaciones" })
  }
}

// Obtener ubicación por ID
export async function getLocationById(req, res) {
  try {
    const { id } = req.params
    const location = await LocationBook.findByPk(id)

    if (!location) {
      return res.status(404).json({ error: "Ubicación no encontrada" })
    }

    res.json(location)
  } catch (error) {
    console.error("Error en getLocationById:", error)
    res.status(500).json({ error: "Error al obtener ubicación" })
  }
}

// Obtener ubicaciones por región
export async function getLocationsByRegion(req, res) {
  try {
    const { region } = req.params
    const locations = await LocationBook.findAll({
      where: { region },
      order: [["comuna", "ASC"]],
    })

    res.json(locations)
  } catch (error) {
    console.error("Error en getLocationsByRegion:", error)
    res.status(500).json({ error: "Error al obtener ubicaciones por región" })
  }
}

// Crear nueva ubicación
export async function createLocation(req, res) {
  try {
    const { region, comuna } = req.body

    if (!region || !comuna) {
      return res.status(400).json({ error: "La región y comuna son requeridas" })
    }

    const newLocation = await LocationBook.create({
      region,
      comuna,
    })

    res.status(201).json(newLocation)
  } catch (error) {
    console.error("Error en createLocation:", error)
    res.status(500).json({ error: "Error al crear ubicación" })
  }
}

// Actualizar ubicación
export async function updateLocation(req, res) {
  try {
    const { id } = req.params
    const { region, comuna } = req.body

    const location = await LocationBook.findByPk(id)
    if (!location) {
      return res.status(404).json({ error: "Ubicación no encontrada" })
    }

    await location.update({
      region,
      comuna,
    })

    res.json(location)
  } catch (error) {
    console.error("Error en updateLocation:", error)
    res.status(500).json({ error: "Error al actualizar ubicación" })
  }
}

// Eliminar ubicación
export async function deleteLocation(req, res) {
  try {
    const { id } = req.params

    const location = await LocationBook.findByPk(id)
    if (!location) {
      return res.status(404).json({ error: "Ubicación no encontrada" })
    }

    await location.destroy()
    res.json({ message: "Ubicación eliminada correctamente" })
  } catch (error) {
    console.error("Error en deleteLocation:", error)
    res.status(500).json({ error: "Error al eliminar ubicación" })
  }
}
