import { BookCondition } from "../db/modelIndex.js"

// Obtener todas las condiciones de libro
export async function getAllBookConditions(req, res) {
  try {
    const bookConditions = await BookCondition.findAll({
      order: [["condition_id", "ASC"]],
    })
    res.json(bookConditions)
  } catch (error) {
    console.error("Error en getAllBookConditions:", error)
    res.status(500).json({ error: "Error al obtener condiciones de libro" })
  }
}

// Obtener condición de libro por ID
export async function getBookConditionById(req, res) {
  try {
    const { id } = req.params
    const bookCondition = await BookCondition.findByPk(id)

    if (!bookCondition) {
      return res.status(404).json({ error: "Condición de libro no encontrada" })
    }

    res.json(bookCondition)
  } catch (error) {
    console.error("Error en getBookConditionById:", error)
    res.status(500).json({ error: "Error al obtener condición de libro" })
  }
}

// Crear nueva condición de libro
export async function createBookCondition(req, res) {
  try {
    const { condition, descripcion } = req.body

    if (!condition) {
      return res.status(400).json({ error: "La condición es requerida" })
    }

    const newBookCondition = await BookCondition.create({
      condition,
      descripcion,
    })

    res.status(201).json(newBookCondition)
  } catch (error) {
    console.error("Error en createBookCondition:", error)
    res.status(500).json({ error: "Error al crear condición de libro" })
  }
}

// Actualizar condición de libro
export async function updateBookCondition(req, res) {
  try {
    const { id } = req.params
    const { condition, descripcion } = req.body

    const bookCondition = await BookCondition.findByPk(id)
    if (!bookCondition) {
      return res.status(404).json({ error: "Condición de libro no encontrada" })
    }

    await bookCondition.update({
      condition,
      descripcion,
    })

    res.json(bookCondition)
  } catch (error) {
    console.error("Error en updateBookCondition:", error)
    res.status(500).json({ error: "Error al actualizar condición de libro" })
  }
}

// Eliminar condición de libro
export async function deleteBookCondition(req, res) {
  try {
    const { id } = req.params

    const bookCondition = await BookCondition.findByPk(id)
    if (!bookCondition) {
      return res.status(404).json({ error: "Condición de libro no encontrada" })
    }

    await bookCondition.destroy()
    res.json({ message: "Condición de libro eliminada correctamente" })
  } catch (error) {
    console.error("Error en deleteBookCondition:", error)
    res.status(500).json({ error: "Error al eliminar condición de libro" })
  }
}
