import { TransactionType } from "../db/modelIndex.js"

// Obtener todos los tipos de transacción
export async function getAllTransactionTypes(req, res) {
  try {
    const transactionTypes = await TransactionType.findAll({
      order: [["transaction_type_id", "ASC"]],
    })
    res.json(transactionTypes)
  } catch (error) {
    console.error("Error en getAllTransactionTypes:", error)
    res.status(500).json({ error: "Error al obtener tipos de transacción" })
  }
}

// Obtener tipo de transacción por ID
export async function getTransactionTypeById(req, res) {
  try {
    const { id } = req.params
    const transactionType = await TransactionType.findByPk(id)

    if (!transactionType) {
      return res.status(404).json({ error: "Tipo de transacción no encontrado" })
    }

    res.json(transactionType)
  } catch (error) {
    console.error("Error en getTransactionTypeById:", error)
    res.status(500).json({ error: "Error al obtener tipo de transacción" })
  }
}

// Crear nuevo tipo de transacción
export async function createTransactionType(req, res) {
  try {
    const { description } = req.body

    if (!description) {
      return res.status(400).json({ error: "La descripción es requerida" })
    }

    const newTransactionType = await TransactionType.create({
      description,
    })

    res.status(201).json(newTransactionType)
  } catch (error) {
    console.error("Error en createTransactionType:", error)
    res.status(500).json({ error: "Error al crear tipo de transacción" })
  }
}

// Actualizar tipo de transacción
export async function updateTransactionType(req, res) {
  try {
    const { id } = req.params
    const { description } = req.body

    const transactionType = await TransactionType.findByPk(id)
    if (!transactionType) {
      return res.status(404).json({ error: "Tipo de transacción no encontrado" })
    }

    await transactionType.update({
      description,
    })

    res.json(transactionType)
  } catch (error) {
    console.error("Error en updateTransactionType:", error)
    res.status(500).json({ error: "Error al actualizar tipo de transacción" })
  }
}

// Eliminar tipo de transacción
export async function deleteTransactionType(req, res) {
  try {
    const { id } = req.params

    const transactionType = await TransactionType.findByPk(id)
    if (!transactionType) {
      return res.status(404).json({ error: "Tipo de transacción no encontrado" })
    }

    await transactionType.destroy()
    res.json({ message: "Tipo de transacción eliminado correctamente" })
  } catch (error) {
    console.error("Error en deleteTransactionType:", error)
    res.status(500).json({ error: "Error al eliminar tipo de transacción" })
  }
}
