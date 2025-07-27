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
import { checkAndCreateAutoMatch, getAutoMatchStats, getUserAutoMatches } from "../services/AutoMatch.service.js"

// Obtener todos los libros publicados con filtros
export async function getAllPublishedBooks(req, res) {
  try {
    const {
      page = 1,
      limit = 10,
      transaction_type_id,
      condition_id,
      location_id,
      min_price,
      max_price,
      search,
    } = req.query

    const offset = (page - 1) * limit
    const whereConditions = {}
    const bookWhereConditions = {}
    const userWhereConditions = {}

    // Aplicar filtros existentes
    if (transaction_type_id) whereConditions.transaction_type_id = transaction_type_id
    if (condition_id) whereConditions.condition_id = condition_id
    if (location_id) whereConditions.location_id = location_id
    if (min_price) whereConditions.price = { ...whereConditions.price, [Op.gte]: min_price }
    if (max_price) whereConditions.price = { ...whereConditions.price, [Op.lte]: max_price }

    // Aplicar búsqueda si se proporciona
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`

      // Buscar en título y autor del libro
      bookWhereConditions[Op.or] = [{ title: { [Op.iLike]: searchTerm } }, { author: { [Op.iLike]: searchTerm } }]

      // Buscar en nombre del usuario
      userWhereConditions[Op.or] = [
        { first_name: { [Op.iLike]: searchTerm } },
        { last_name: { [Op.iLike]: searchTerm } },
        fn("CONCAT", col("User.first_name"), " ", col("User.last_name")),
        { [Op.iLike]: searchTerm },
      ]
    }

    const includeOptions = [
      {
        model: Book,
        where: Object.keys(bookWhereConditions).length > 0 ? bookWhereConditions : undefined,
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
        where: Object.keys(userWhereConditions).length > 0 ? userWhereConditions : undefined,
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
    ]

    const { count, rows: publishedBooks } = await PublishedBooks.findAndCountAll({
      where: whereConditions,
      include: includeOptions,
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
      searchTerm: search || null,
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
    console.log("Iniciando actualización de libro publicado:", req.params.id)
    console.log("Datos recibidos:", req.body)

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

    // Buscar el libro publicado con su libro asociado
    const publishedBook = await PublishedBooks.findByPk(id, {
      include: [{ model: Book }],
    })

    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" })
    }

    // Verificar que el usuario sea el propietario
    if (publishedBook.user_id !== req.user.user_id) {
      return res.status(403).json({ error: "No tienes permisos para actualizar este libro" })
    }

    console.log("Libro encontrado:", publishedBook.id)

    // Actualizar información del libro si se proporciona
    if (book && publishedBook.Book) {
      console.log("Actualizando información del libro base:", book)
      await publishedBook.Book.update({
        title: book.title || publishedBook.Book.title,
        author: book.author || publishedBook.Book.author,
        date_of_pub: book.date_of_pub || publishedBook.Book.date_of_pub,
      })
      console.log("Libro base actualizado")
    }

    // Preparar los campos a actualizar
    const updateFields = {}

    if (transaction_type_id !== undefined) updateFields.transaction_type_id = transaction_type_id
    if (price !== undefined) updateFields.price = price
    if (look_for !== undefined) updateFields.look_for = look_for
    if (condition_id !== undefined) updateFields.condition_id = condition_id
    if (location_id !== undefined) updateFields.location_id = location_id
    if (description !== undefined) updateFields.description = description

    updateFields.updated_at = new Date()

    console.log("Campos a actualizar:", updateFields)

    // Actualizar la publicación
    await publishedBook.update(updateFields)
    console.log("Publicación actualizada")

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

    console.log("Enviando respuesta con libro actualizado")
    res.json(updatedBook)
  } catch (error) {
    console.error("Error en updatePublishedBook:", error)
    res.status(500).json({ error: "Error al actualizar libro publicado", details: error.message })
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
    if (publishedBook.user_id !== req.user.user_id) {
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

// Algoritmo inteligente de recomendaciones para sistema de swipe
// FLUJO DE DATOS:
// 1. Recibe solicitud del frontend con cantidad de libros deseados
// 2. Consulta UserPublishedBookInteraction para obtener libros ya evaluados por el usuario
// 3. Construye filtros para excluir: propios libros + libros ya swipeados
// 4. Cuenta cuántos libros están realmente disponibles
// 5. Calcula límite real (menor entre solicitado y disponible)
// 6. Obtiene libros con joins completos para mostrar información rica
// 7. Filtra duplicados por seguridad
// 8. Retorna libros únicos con metadata de paginación
export async function getRecommendations(req, res) {
  try {
    // Extracción de datos de entrada
    const { user_id } = req.user // Usuario autenticado desde middleware auth
    const { limit = 20 } = req.query // Cantidad solicitada de libros (default: 20)
    const requestedLimit = Number.parseInt(limit)

    console.log(`Obteniendo ${requestedLimit} recomendaciones para usuario: ${user_id}`)

    // PASO 1: Obtener historial de interacciones del usuario
    // Consulta tabla UserPublishedBookInteraction para conocer qué libros ya evaluó
    const interactedBooks = await UserPublishedBookInteraction.findAll({
      where: { user_id },
      attributes: ["published_book_id"], // Solo IDs para optimizar consulta
      raw: true, // Retorna objetos planos en lugar de instancias Sequelize
    })

    // Extraer array de IDs de libros ya evaluados
    const interactedBookIds = interactedBooks.map((interaction) => interaction.published_book_id)

    console.log(`Libros ya evaluados: ${interactedBookIds.length}`)

    // PASO 2: Construir filtros de exclusión
    // Excluir libros del propio usuario y libros ya evaluados
    const whereConditions = {
      user_id: { [Op.ne]: user_id }, // Operador "not equal" - excluir propios libros
    }

    // PASO 3: Añadir filtro de libros ya evaluados si existen
    // Solo aplicar filtro si el usuario ha interactuado con algún libro
    if (interactedBookIds.length > 0) {
      whereConditions.published_book_id = { [Op.notIn]: interactedBookIds } // Excluir libros ya swipeados
    }

    // PASO 4: Análisis de disponibilidad
    // Contar cuántos libros están realmente disponibles con los filtros aplicados
    const availableCount = await PublishedBooks.count({
      where: whereConditions
    })

    console.log(`Libros disponibles para swipe: ${availableCount}`)

    // PASO 5: Manejo de caso sin libros disponibles
    // Si no hay libros disponibles, informar al usuario que ya revisó todo
    if (availableCount === 0) {
      console.log(`No hay más libros para mostrar al usuario ${user_id}`)
      return success(res, [], "Has revisado todos los libros disponibles")
    }

    // PASO 6: Cálculo inteligente del límite
    // Determinar cuántos libros solicitar (el menor entre lo pedido y lo disponible)
    // Esto evita solicitar más libros de los que existen
    const actualLimit = Math.min(requestedLimit, availableCount)
    console.log(`Solicitando ${actualLimit} libros (pedidos: ${requestedLimit}, disponibles: ${availableCount})`)

    // PASO 7: Consulta principal con joins completos
    // Obtener libros con toda la información necesaria para el frontend
    const recommendations = await PublishedBooks.findAll({
      where: whereConditions, // Aplicar filtros de exclusión
      include: [
        {
          // Información del libro base (título, autor, etc.)
          model: Book,
          include: [
            {
              // Categorías del libro (géneros)
              model: Category,
              as: "Categories",
              through: { attributes: [] }, // Excluir atributos de tabla intermedia
            },
          ],
        },
        {
          // Información del usuario propietario del libro
          model: User,
          attributes: ["user_id", "first_name", "last_name", "email"],
        },
        {
          // Tipo de transacción (venta, intercambio, regalo)
          model: TransactionType,
        },
        {
          // Estado del libro (nuevo, usado, etc.)
          model: BookCondition,
        },
        {
          // Ubicación del libro
          model: LocationBook,
        },
        {
          // Imágenes del libro publicado
          model: PublishedBookImage,
        },
      ],
      order: [
        // ALGORITMO DE ORDENAMIENTO:
        // 1. Priorizar libros recién publicados (más recientes primero)
        ["date_published", "DESC"],
        // 2. Añadir aleatoriedad para diversidad en recomendaciones
        [fn("RANDOM")],
      ],
      limit: actualLimit, // Usar el límite calculado exacto (no más de lo necesario)
      distinct: true, // Asegurar resultados únicos a nivel de base de datos
    })

    // PASO 8: Filtrado de duplicados adicional (capa de seguridad)
    // Filtrar duplicados por published_book_id como precaución adicional
    const uniqueRecommendations = recommendations
      .filter((book, index, self) => 
        index === self.findIndex(b => b.published_book_id === book.published_book_id)
      )

    // PASO 9: Logging y debugging
    console.log(`Recomendaciones encontradas: ${recommendations.length}`)
    console.log(`Recomendaciones únicas después de filtrar: ${uniqueRecommendations.length}`)
    console.log(`IDs de libros recomendados: [${uniqueRecommendations.map((r) => r.published_book_id).join(", ")}]`)

    // PASO 10: Detección de duplicados para debugging
    // Identificar y reportar cualquier duplicado encontrado
    const duplicates = recommendations.filter((book, index, self) => 
      self.findIndex(b => b.published_book_id === book.published_book_id) !== index
    )
    
    if (duplicates.length > 0) {
      console.warn(`Se encontraron ${duplicates.length} libros duplicados:`)
      duplicates.forEach(book => {
        console.warn(`   - ID: ${book.published_book_id}, Título: ${book.Book?.title || 'N/A'}`)
      })
    }

    // PASO 11: Validación de resultado vacío
    // Si no hay libros para mostrar, enviar mensaje específico
    if (uniqueRecommendations.length === 0) {
      console.log(`No hay más libros para mostrar al usuario ${user_id}`)
      return success(res, [], "Has revisado todos los libros disponibles")
    }

    // PASO 12: Respuesta final con metadata
    console.log(`Algoritmo de recomendaciones completado:`)
    console.log(`   Libros solicitados: ${requestedLimit}`)
    console.log(`   Libros disponibles: ${availableCount}`)
    console.log(`   Libros entregados: ${uniqueRecommendations.length}`)

    // RETORNO DE DATOS AL FRONTEND:
    // - data: Array de libros recomendados con información completa
    // - message: Mensaje informativo sobre el resultado
    // El frontend usará estos datos para renderizar las tarjetas de swipe
    return success(res, uniqueRecommendations, 
      availableCount < requestedLimit 
        ? `Se encontraron ${availableCount} libros disponibles de ${requestedLimit} solicitados`
        : `${uniqueRecommendations.length} recomendaciones encontradas`
    )
  } catch (err) {
    console.error("Error en getRecommendations:", err)
    return error(res, "Error al obtener recomendaciones", 500)
  }
}

// Sistema de registro de interacciones de swipe con detección automática de matches
// FLUJO DE DATOS:
// 1. Recibe interacción del frontend (like/dislike + published_book_id)
// 2. Valida datos y existencia del libro
// 3. Busca/crea/actualiza registro en UserPublishedBookInteraction
// 4. Si es LIKE: verifica automáticamente si hay match mutuo
// 5. Si hay match mutuo: crea registro en tabla Match
// 6. Retorna resultado con información de auto-match si aplicable
export async function recordInteraction(req, res) {
  try {
    // Extracción de datos de entrada
    const { user_id } = req.user // Usuario autenticado desde middleware
    const { published_book_id, interaction_type } = req.body // Datos del swipe

    // PASO 1: Validación de datos de entrada
    if (!published_book_id || !interaction_type) {
      return error(res, "published_book_id e interaction_type son requeridos", 400)
    }

    if (!["like", "dislike"].includes(interaction_type)) {
      return error(res, "interaction_type debe ser: like o dislike", 400)
    }

    // PASO 2: Verificación de existencia del libro
    const publishedBook = await PublishedBooks.findByPk(published_book_id)
    if (!publishedBook) {
      return error(res, "Libro publicado no encontrado", 404)
    }

    // PASO 3: Verificación de que no es su propio libro
    // Los usuarios no pueden hacer swipe en sus propios libros
    if (publishedBook.user_id === user_id) {
      return error(res, "No puedes interactuar con tus propios libros", 400)
    }

    console.log(`Registrando interacción: usuario ${user_id}, libro ${published_book_id}, tipo: ${interaction_type}`)

    // PASO 4: Buscar interacción existente
    // Verificar si el usuario ya interactuó con este libro previamente
    let interaction = await UserPublishedBookInteraction.findOne({
      where: {
        user_id,
        published_book_id,
      },
    })

    let message
    if (interaction) {
      // CASO A: Actualización de interacción existente
      // El usuario ya había swipeado este libro, cambiar su decisión
      console.log(`Actualizando interacción existente: ${interaction.interaction_type} → ${interaction_type}`)
      interaction.interaction_type = interaction_type
      await interaction.save()
      message = "Interacción actualizada"
    } else {
      // CASO B: Nueva interacción
      // Primera vez que el usuario interactúa con este libro
      console.log(`Creando nueva interacción`)
      interaction = await UserPublishedBookInteraction.create({
        user_id,
        published_book_id,
        interaction_type,
      })
      message = "Interacción registrada"
    }

    console.log(`Interacción ${message.toLowerCase()}: ID ${interaction.interaction_id}`)

    // PASO 5: SISTEMA DE AUTO-MATCH
    // Verificar auto-match solo si la interacción es un LIKE
    let autoMatchResult = null;
    if (interaction_type === "like") {
      console.log(`Es un LIKE! Verificando posibles auto-matches...`);
      try {
        // Llamar al servicio de auto-match para verificar reciprocidad
        // FLUJO DEL AUTO-MATCH:
        // 1. Busca si el dueño del libro también le dio LIKE a algún libro del usuario actual
        // 2. Si encuentra reciprocidad, crea un Match automático
        // 3. Retorna información del match creado
        autoMatchResult = await checkAndCreateAutoMatch(user_id, published_book_id);
        if (autoMatchResult.success) {
          console.log(`AUTO-MATCH CREADO! ${autoMatchResult.message}`);
        } else {
          console.log(`No se creó auto-match: ${autoMatchResult.message}`);
        }
      } catch (autoMatchError) {
        console.error("Error verificando auto-match:", autoMatchError);
        // No fallar la interacción principal si hay error en auto-match
        // El swipe se registra exitosamente aunque falle la detección de match
      }
    }

    // PASO 6: Preparación de respuesta
    // Estructurar datos de respuesta incluyendo información de auto-match
    const responseData = {
      interaction, // Datos de la interacción registrada
      autoMatch: autoMatchResult?.success ? {
        // Si se creó un auto-match, incluir información completa
        created: true,
        match: autoMatchResult.match, // Datos del match creado
        trigger_info: autoMatchResult.trigger_info, // Info sobre qué libros causaron el match
      } : {
        // Si no se creó auto-match, indicar por qué
        created: false,
        reason: autoMatchResult?.message || "No aplicable",
      }
    };

    // RETORNO AL FRONTEND:
    // El frontend recibe tanto la confirmación del swipe como información de auto-match
    // Si hay auto-match, el frontend puede mostrar notificación inmediata
    return success(res, responseData, message)
  } catch (err) {
    console.error("Error en recordInteraction:", err)
    return error(res, "Error al registrar interacción", 500)
  }
}

// Obtener estadísticas globales de interacciones del usuario
// FLUJO DE DATOS:
// 1. Recibe user_id desde middleware de autenticación
// 2. Consulta tabla UserPublishedBookInteraction agrupando por tipo
// 3. Cuenta likes, dislikes y total de interacciones
// 4. Retorna estadísticas formateadas para frontend
export async function getUserInteractionStats(req, res) {
  try {
    const { user_id } = req.user // Usuario autenticado

    // CONSULTA: Contar interacciones agrupadas por tipo
    // Usando GROUP BY para obtener conteos por interaction_type
    const stats = await UserPublishedBookInteraction.findAll({
      where: { user_id },
      attributes: [
        "interaction_type", // Agrupar por tipo (like/dislike)
        [fn("COUNT", col("interaction_type")), "count"] // Contar ocurrencias
      ],
      group: ["interaction_type"], // Agrupar por tipo de interacción
      raw: true, // Retornar objetos planos
    })

    // FORMATEO: Estructurar datos para frontend
    const formattedStats = {
      likes: 0,
      dislikes: 0,
      total: 0,
    }

    // Procesar resultados y sumar totales
    stats.forEach((stat) => {
      const count = Number.parseInt(stat.count)
      formattedStats[stat.interaction_type + "s"] = count // likes o dislikes
      formattedStats.total += count // Sumar al total
    })

    return success(res, formattedStats, "Estadísticas obtenidas correctamente")
  } catch (err) {
    console.error("Error en getUserInteractionStats:", err)
    return error(res, "Error al obtener estadísticas", 500)
  }
}

// Obtener historial paginado de interacciones del usuario
// FLUJO DE DATOS:
// 1. Recibe parámetros de paginación y filtros desde frontend
// 2. Construye consulta con joins para obtener información completa
// 3. Aplica filtros por tipo de interacción si se especifica
// 4. Retorna datos paginados + estadísticas globales
export async function getUserSwipeHistory(req, res) {
  try {
    const { user_id } = req.user // Usuario autenticado
    const { page = 1, limit = 20, interaction_type } = req.query // Parámetros de consulta

    // CÁLCULO DE PAGINACIÓN
    const offset = (page - 1) * limit // Saltar registros de páginas anteriores
    const whereConditions = { user_id } // Condición base

    // FILTRO OPCIONAL: por tipo de interacción
    if (interaction_type && ["like", "dislike"].includes(interaction_type)) {
      whereConditions.interaction_type = interaction_type
    }

    // CONSULTA PRINCIPAL: Obtener interacciones con información completa
    // Usa findAndCountAll para obtener datos + total count para paginación
    const { count, rows: interactions } = await UserPublishedBookInteraction.findAndCountAll({
      where: whereConditions,
      include: [
        {
          // Incluir datos completos del libro publicado
          model: PublishedBooks,
          as: "PublishedBook",
          include: [
            {
              // Información básica del libro
              model: Book,
              include: [
                {
                  // Categorías del libro
                  model: Category,
                  as: "Categories",
                  through: { attributes: [] }, // Excluir atributos de tabla intermedia
                },
              ],
            },
            {
              // Propietario del libro
              model: User,
              attributes: ["user_id", "first_name", "last_name", "email"],
            },
            {
              // Tipo de transacción
              model: TransactionType,
            },
            {
              // Estado del libro
              model: BookCondition,
            },
            {
              // Ubicación
              model: LocationBook,
            },
            {
              // Imágenes del libro
              model: PublishedBookImage,
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]], // Más recientes primero
      limit: Number.parseInt(limit), // Límite de resultados
      offset: Number.parseInt(offset), // Offset para paginación
    })

    // CONSULTA SECUNDARIA: Obtener estadísticas globales del usuario
    // Se ejecuta por separado para no afectar la paginación
    const stats = await UserPublishedBookInteraction.findAll({
      where: { user_id }, // Todas las interacciones del usuario
      attributes: [
        "interaction_type",
        [fn("COUNT", col("interaction_type")), "count"]
      ],
      group: ["interaction_type"], // Agrupar por tipo
      raw: true,
    })

    // FORMATEO DE ESTADÍSTICAS
    const statsFormatted = {
      likes: 0,
      dislikes: 0,
      total: 0,
    }

    // Procesar estadísticas y calcular totales
    stats.forEach((stat) => {
      statsFormatted[stat.interaction_type + "s"] = Number.parseInt(stat.count)
      statsFormatted.total += Number.parseInt(stat.count)
    })

    // RESPUESTA ESTRUCTURADA para frontend
    // Incluye datos paginados + estadísticas + metadata de paginación
    return success(
      res,
      {
        interactions, // Array de interacciones de la página actual
        stats: statsFormatted, // Estadísticas globales
        pagination: {
          page: Number.parseInt(page), // Página actual
          limit: Number.parseInt(limit), // Elementos por página
          total: count, // Total de interacciones
          totalPages: Math.ceil(count / limit), // Total de páginas
          hasMore: offset + limit < count, // Si hay más páginas
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
    if (!["like", "dislike"].includes(interaction_type)) {
      return error(res, "interaction_type debe ser: like o dislike", 400)
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

// 🚀 NUEVAS FUNCIONES PARA AUTO-MATCHES

// Obtener estadísticas de auto-matches del usuario
export async function getUserAutoMatchStats(req, res) {
  try {
    const { user_id } = req.user

    console.log(`📊 Obteniendo estadísticas de auto-matches para usuario: ${user_id}`)

    const stats = await getAutoMatchStats(user_id)

    return success(res, stats, "Estadísticas de auto-matches obtenidas correctamente")
  } catch (err) {
    console.error("Error en getUserAutoMatchStats:", err)
    return error(res, "Error al obtener estadísticas de auto-matches", 500)
  }
}

// Obtener todos los auto-matches del usuario
export async function getUserAutoMatchesList(req, res) {
  try {
    const { user_id } = req.user

    console.log(`🤖 Obteniendo auto-matches para usuario: ${user_id}`)

    const autoMatches = await getUserAutoMatches(user_id)

    return success(res, autoMatches, `${autoMatches.length} auto-matches encontrados`)
  } catch (err) {
    console.error("Error en getUserAutoMatchesList:", err)
    return error(res, "Error al obtener auto-matches", 500)
  }
}