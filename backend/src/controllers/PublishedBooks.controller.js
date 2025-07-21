import {
  PublishedBooks,
  Book,
  User,
  TransactionType,
  BookCondition,
  LocationBook,
  PublishedBookImage,
  Category,
  UserPublishedBookInteraction,
} from "../db/modelIndex.js"
import { Op, fn, col } from "sequelize"
import { success, error } from "../utils/responses.util.js"

// Obtener todos los libros publicados con filtros
export async function getAllPublishedBooks(req, res) {
  try {
    const { page = 1, limit = 10, transaction_type_id, condition_id, location_id, min_price, max_price } = req.query

    const offset = (page - 1) * limit
    const whereConditions = {}

    // Aplicar filtros
    if (transaction_type_id) whereConditions.transaction_type_id = transaction_type_id
    if (condition_id) whereConditions.condition_id = condition_id
    if (location_id) whereConditions.location_id = location_id
    if (min_price) whereConditions.price = { ...whereConditions.price, [Op.gte]: min_price }
    if (max_price) whereConditions.price = { ...whereConditions.price, [Op.lte]: max_price }

    const { count, rows: publishedBooks } = await PublishedBooks.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name", "location_id"],
          include: [
            {
              model: LocationBook,
              as: "userLocation",
              attributes: ["location_id", "comuna", "region"],
            },
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
          limit: 1,
          where: { is_primary: true },
          required: false,
        },
      ],
      order: [["date_published", "DESC"]],
      limit: Number.parseInt(limit),
      offset: offset,
    })

    res.json({
      publishedBooks,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBooks: count,
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error("Error en getAllPublishedBooks:", error)
    res.status(500).json({ error: "Error al obtener libros publicados" })
  }
}

// Obtener libro publicado por ID
export async function getPublishedBookById(req, res) {
  try {
    const { id } = req.params
    const publishedBook = await PublishedBooks.findByPk(id, {
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name", "location_id"],
          include: [
            {
              model: LocationBook,
              as: "userLocation",
              attributes: ["location_id", "comuna", "region"],
            },
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
          order: [
            ["is_primary", "DESC"],
            ["published_book_image_id", "ASC"],
          ],
        },
      ],
    })

    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" })
    }

    res.json(publishedBook)
  } catch (error) {
    console.error("Error en getPublishedBookById:", error)
    res.status(500).json({ error: "Error al obtener libro publicado" })
  }
}

// Obtener libros publicados por usuario
export async function getPublishedBooksByUser(req, res) {
  try {
    // Si no hay userId en params, usar el usuario autenticado
    const userId = req.params.userId || req.user.user_id
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const { count, rows: publishedBooks } = await PublishedBooks.findAndCountAll({
      where: { user_id: userId },
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
          limit: 1,
          where: { is_primary: true },
          required: false,
        },
      ],
      order: [["date_published", "DESC"]],
      limit: Number.parseInt(limit),
      offset: offset,
    })

    res.json({
      publishedBooks,
      pagination: {
        currentPage: Number.parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalBooks: count,
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    console.error("Error en getPublishedBooksByUser:", error)
    res.status(500).json({ error: "Error al obtener libros publicados por usuario" })
  }
}

// Crear nuevo libro publicado
export async function createPublishedBook(req, res) {
  try {
    const {
      book_id,
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      images = [],
    } = req.body

    const user_id = req.user.user_id

    console.log("Datos recibidos para publicar libro:", {
      book_id,
      user_id,
      transaction_type_id,
      condition_id,
      location_id,
      price,
      description,
      images: images.length,
    })

    // Validar campos requeridos
    if (!book_id || !transaction_type_id || !condition_id) {
      return res.status(400).json({
        error: "book_id, transaction_type_id y condition_id son requeridos",
      })
    }

    // Crear el libro publicado
    const newPublishedBook = await PublishedBooks.create({
      book_id,
      user_id,
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      date_published: new Date(),
      updated_at: new Date(),
    })

    console.log("Libro publicado creado:", newPublishedBook.dataValues)

    // Nota: Las imágenes se suben por separado usando /api/published-book-images/upload/:publishedBookId
    // No crear placeholders aquí

    // Obtener el libro publicado completo
    const publishedBookComplete = await PublishedBooks.findByPk(newPublishedBook.published_book_id, {
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name", "location_id"],
          include: [
            {
              model: LocationBook,
              as: "userLocation",
              attributes: ["location_id", "comuna", "region"],
            },
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
        },
      ],
    })

    console.log("Libro publicado completo:", publishedBookComplete.dataValues)

    res.status(201).json(publishedBookComplete)
  } catch (error) {
    console.error("Error en createPublishedBook:", error)
    res.status(500).json({
      error: "Error al crear libro publicado",
      details: error.message,
    })
  }
}

// Actualizar libro publicado
export async function updatePublishedBook(req, res) {
  try {
    const { id } = req.params
    const {
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      book, // Información del libro a actualizar
    } = req.body

    const publishedBook = await PublishedBooks.findByPk(id, {
      include: [{ model: Book }],
    })

    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" })
    }

    // Verificar que el usuario sea el propietario
    if (publishedBook.user_id !== req.user.id) {
      return res.status(403).json({ error: "No tienes permisos para actualizar este libro" })
    }

    // Actualizar información del libro si se proporciona
    if (book && publishedBook.Book) {
      await publishedBook.Book.update({
        title: book.title,
        author: book.author,
        date_of_pub: book.date_of_pub,
      })

      // Actualizar categorías del libro si se proporcionan
      if (book.category_ids && book.category_ids.length > 0) {
        await publishedBook.Book.setCategories(book.category_ids)
      }
    }

    // Actualizar información de la publicación
    await publishedBook.update({
      transaction_type_id,
      price,
      look_for,
      condition_id,
      location_id,
      description,
      updated_at: new Date(),
    })

    // Obtener el libro actualizado completo
    const updatedBook = await PublishedBooks.findByPk(id, {
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
        },
      ],
    })

    res.json(updatedBook)
  } catch (error) {
    console.error("Error en updatePublishedBook:", error)
    res.status(500).json({ error: "Error al actualizar libro publicado" })
  }
}

// Eliminar libro publicado
export async function deletePublishedBook(req, res) {
  try {
    const { id } = req.params

    const publishedBook = await PublishedBooks.findByPk(id)
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" })
    }

    // Verificar que el usuario sea el propietario
    if (publishedBook.user_id !== req.user.id) {
      return res.status(403).json({ error: "No tienes permisos para eliminar este libro" })
    }

    // Eliminar imágenes asociadas
    await PublishedBookImage.destroy({
      where: { published_book_id: id },
    })

    // Eliminar el libro publicado
    await publishedBook.destroy()

    res.json({ message: "Libro publicado eliminado correctamente" })
  } catch (error) {
    console.error("Error en deletePublishedBook:", error)
    res.status(500).json({ error: "Error al eliminar libro publicado" })
  }
}

// Obtener recomendaciones inteligentes para swipe
export async function getRecommendations(req, res) {
  try {
    const { user_id } = req.user
    const { limit = 20 } = req.query

    console.log(`🔍 Obteniendo recomendaciones para usuario: ${user_id}`)

    // Obtener los IDs de libros publicados que el usuario ya evaluó
    const interactedBooks = await UserPublishedBookInteraction.findAll({
      where: { user_id },
      attributes: ["published_book_id"],
      raw: true,
    })

    const interactedBookIds = interactedBooks.map((interaction) => interaction.published_book_id)

    console.log(`📚 Libros ya evaluados por el usuario: [${interactedBookIds.join(", ")}]`)

    // Construir condiciones WHERE para excluir libros ya evaluados
    const whereConditions = {
      user_id: { [Op.ne]: user_id }, // No mostrar los propios libros
    }

    if (interactedBookIds.length > 0) {
      whereConditions.published_book_id = { [Op.notIn]: interactedBookIds }
    }

    console.log(`🎯 Condiciones WHERE:`, whereConditions)

    const recommendations = await PublishedBooks.findAll({
      where: whereConditions,
      include: [
        {
          model: Book,
          include: [
            {
              model: Category,
              as: "Categories",
              through: { attributes: [] },
            },
          ],
        },
        {
          model: User,
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
        {
          model: TransactionType,
        },
        {
          model: BookCondition,
        },
        {
          model: LocationBook,
        },
        {
          model: PublishedBookImage,
        },
      ],
      order: [
        // Priorizar libros recién publicados
        ["date_published", "DESC"],
        // Ordenar aleatoriamente para diversidad
        [fn("RANDOM")],
      ],
      limit: Number.parseInt(limit),
    })

    console.log(`✅ Recomendaciones encontradas: ${recommendations.length}`)
    console.log(`📋 IDs de libros recomendados: [${recommendations.map((r) => r.published_book_id).join(", ")}]`)

    // Si no hay más libros para mostrar, enviar mensaje específico
    if (recommendations.length === 0) {
      console.log(`🎯 No hay más libros para mostrar al usuario ${user_id}`)
      return success(res, [], "Has revisado todos los libros disponibles")
    }

    return success(res, recommendations, `${recommendations.length} recomendaciones encontradas`)
  } catch (err) {
    console.error("Error en getRecommendations:", err)
    return error(res, "Error al obtener recomendaciones", 500)
  }
}

// Registrar interacción del usuario con un libro publicado (swipe)
export async function recordInteraction(req, res) {
  try {
    const { user_id } = req.user
    const { published_book_id, interaction_type } = req.body

    // Validar datos
    if (!published_book_id || !interaction_type) {
      return error(res, "published_book_id e interaction_type son requeridos", 400)
    }

    if (!["like", "dislike", "super_like"].includes(interaction_type)) {
      return error(res, "interaction_type debe ser: like, dislike o super_like", 400)
    }

    // Verificar que el libro publicado existe
    const publishedBook = await PublishedBooks.findByPk(published_book_id)
    if (!publishedBook) {
      return error(res, "Libro publicado no encontrado", 404)
    }

    // Verificar que no es su propio libro
    if (publishedBook.user_id === user_id) {
      return error(res, "No puedes interactuar con tus propios libros", 400)
    }

    console.log(`👆 Registrando interacción: usuario ${user_id}, libro ${published_book_id}, tipo: ${interaction_type}`)

    // Buscar si ya existe una interacción
    let interaction = await UserPublishedBookInteraction.findOne({
      where: {
        user_id,
        published_book_id,
      },
    })

    let message
    if (interaction) {
      // Si ya existe, actualizar el tipo de interacción
      console.log(`🔄 Actualizando interacción existente: ${interaction.interaction_type} → ${interaction_type}`)
      interaction.interaction_type = interaction_type
      await interaction.save()
      message = "Interacción actualizada"
    } else {
      // Si no existe, crear nueva interacción
      console.log(`✨ Creando nueva interacción`)
      interaction = await UserPublishedBookInteraction.create({
        user_id,
        published_book_id,
        interaction_type,
      })
      message = "Interacción registrada"
    }

    console.log(`✅ Interacción ${message.toLowerCase()}: ID ${interaction.interaction_id}`)

    return success(res, interaction, message)
  } catch (err) {
    console.error("Error en recordInteraction:", err)
    return error(res, "Error al registrar interacción", 500)
  }
}

// Obtener estadísticas de interacciones del usuario
export async function getUserInteractionStats(req, res) {
  try {
    const { user_id } = req.user

    const stats = await UserPublishedBookInteraction.findAll({
      where: { user_id },
      attributes: ["interaction_type", [fn("COUNT", col("interaction_type")), "count"]],
      group: ["interaction_type"],
      raw: true,
    })

    const formattedStats = {
      likes: 0,
      dislikes: 0,
      super_likes: 0,
      total: 0,
    }

    stats.forEach((stat) => {
      const count = Number.parseInt(stat.count)
      formattedStats[stat.interaction_type + "s"] = count
      formattedStats.total += count
    })

    return success(res, formattedStats, "Estadísticas obtenidas correctamente")
  } catch (err) {
    console.error("Error en getUserInteractionStats:", err)
    return error(res, "Error al obtener estadísticas", 500)
  }
}

// Obtener historial de interacciones del usuario
export async function getUserSwipeHistory(req, res) {
  try {
    const { user_id } = req.user
    const { page = 1, limit = 20, interaction_type } = req.query

    const offset = (page - 1) * limit
    const whereConditions = { user_id }

    // Filtrar por tipo de interacción si se especifica
    if (interaction_type && ["like", "dislike", "super_like"].includes(interaction_type)) {
      whereConditions.interaction_type = interaction_type
    }

    const { count, rows: interactions } = await UserPublishedBookInteraction.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: PublishedBooks,
          as: "PublishedBook",
          include: [
            {
              model: Book,
              include: [
                {
                  model: Category,
                  as: "Categories",
                  through: { attributes: [] },
                },
              ],
            },
            {
              model: User,
              attributes: ["user_id", "first_name", "last_name", "email"],
            },
            {
              model: TransactionType,
            },
            {
              model: BookCondition,
            },
            {
              model: LocationBook,
            },
            {
              model: PublishedBookImage,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
      limit: Number.parseInt(limit),
      offset: Number.parseInt(offset),
    })

    // Obtener estadísticas totales
    const stats = await UserPublishedBookInteraction.findAll({
      where: { user_id },
      attributes: ["interaction_type", [fn("COUNT", col("interaction_type")), "count"]],
      group: ["interaction_type"],
      raw: true,
    })

    const statsFormatted = {
      likes: 0,
      dislikes: 0,
      super_likes: 0,
      total: 0,
    }

    stats.forEach((stat) => {
      statsFormatted[stat.interaction_type + "s"] = Number.parseInt(stat.count)
      statsFormatted.total += Number.parseInt(stat.count)
    })

    return success(
      res,
      {
        interactions,
        stats: statsFormatted,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total: count,
          totalPages: Math.ceil(count / limit),
          hasMore: offset + limit < count,
        },
      },
      `${count} interacciones encontradas`,
    )
  } catch (err) {
    console.error("Error en getUserSwipeHistory:", err)
    return error(res, "Error al obtener historial de interacciones", 500)
  }
}

// Actualizar una interacción existente
export async function updateSwipeInteraction(req, res) {
  try {
    const { user_id } = req.user
    const { id } = req.params
    const { interaction_type } = req.body

    console.log(`🔄 Actualizando interacción ${id} para usuario ${user_id}`)

    // Validar tipo de interacción
    if (!["like", "dislike", "super_like"].includes(interaction_type)) {
      return error(res, "interaction_type debe ser: like, dislike o super_like", 400)
    }

    // Buscar la interacción
    const interaction = await UserPublishedBookInteraction.findOne({
      where: {
        interaction_id: id,
        user_id,
      },
    })

    if (!interaction) {
      return error(res, "Interacción no encontrada", 404)
    }

    // Actualizar la interacción
    interaction.interaction_type = interaction_type
    await interaction.save()

    console.log(`✅ Interacción actualizada: ${interaction.interaction_id}`)

    return success(res, interaction, "Interacción actualizada correctamente")
  } catch (err) {
    console.error("Error en updateSwipeInteraction:", err)
    return error(res, "Error al actualizar interacción", 500)
  }
}

// Eliminar una interacción
export async function deleteSwipeInteraction(req, res) {
  try {
    const { user_id } = req.user
    const { id } = req.params

    console.log(`🗑️ Eliminando interacción ${id} para usuario ${user_id}`)

    // Buscar la interacción
    const interaction = await UserPublishedBookInteraction.findOne({
      where: {
        interaction_id: id,
        user_id,
      },
    })

    if (!interaction) {
      return error(res, "Interacción no encontrada", 404)
    }

    // Eliminar la interacción
    await interaction.destroy()

    console.log(`✅ Interacción eliminada: ${id}`)

    return success(res, null, "Interacción eliminada correctamente")
  } catch (err) {
    console.error("Error en deleteSwipeInteraction:", err)
    return error(res, "Error al eliminar interacción", 500)
  }
}

