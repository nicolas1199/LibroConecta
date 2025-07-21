import api from "./api"

// Obtener tipos de transacción
export const getTransactionTypes = async () => {
  const res = await api.get("/transaction-types")
  return res.data
}

// Obtener condiciones de libro
export const getBookConditions = async () => {
  const res = await api.get("/book-conditions")
  return res.data
}

// Obtener ubicaciones
export const getLocations = async () => {
  const res = await api.get("/locations")
  return res.data
}

// Obtener categorías
export const getCategories = async () => {
  try {
    const res = await api.get("/categories")
    return res.data
  } catch (error) {
    console.error("Error fetching categories:", error)
    return []
  }
}

// Crear libro
export const createBook = async (bookData) => {
  const res = await api.post("/books", bookData)
  return res.data
}

// Publicar libro
export const publishBook = async (publishData) => {
  const res = await api.post("/published-books", publishData)
  return res.data
}

// Subir múltiples imágenes reales de libro publicado (Cloudinary)
export const uploadBookImages = async (publishedBookId, formData) => {
  const res = await api.post(`/published-book-images/upload/${publishedBookId}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  })
  return res.data
}

// Subir múltiples imágenes como base64 (almacenamiento en BD)
export const uploadBookImagesBase64 = async (publishedBookId, base64Images) => {
  // base64Images: Array<{ base64, is_primary }>
  const res = await api.post(
    `/published-book-images/upload-base64-json/${publishedBookId}`,
    { images: base64Images },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
  return res.data
}

// Subir imagen de libro publicado (legacy)
export const uploadBookImage = async (publishedBookId, imageData) => {
  const res = await api.post(`/published-book-images/published-book/${publishedBookId}`, imageData)
  return res.data
}

// Obtener todos los libros publicados
export const getPublishedBooks = async (params = {}) => {
  const res = await api.get("/published-books", { params })
  return res.data
}

// Obtener libros publicados por usuario
export const getPublishedBooksByUser = async (userId, params = {}) => {
  const res = await api.get(`/published-books/user/${userId}`, { params })
  return res.data
}

// Obtener libro publicado por ID
export const getPublishedBookById = async (id) => {
  const res = await api.get(`/published-books/${id}`)
  return res.data
}

// Obtener recomendaciones para swipe
export const getRecommendations = async (params = {}) => {
  const res = await api.get("/published-books/recommendations/swipe", { params })
  return res.data
}

// Registrar interacción de swipe
export const recordSwipeInteraction = async (interactionData) => {
  const res = await api.post("/published-books/interactions", interactionData)
  return res.data
}

// Obtener estadísticas de interacciones del usuario
export const getUserSwipeStats = async () => {
  const res = await api.get("/published-books/interactions/stats")
  return res.data
}

// Obtener historial de interacciones del usuario
export const getUserSwipeHistory = async (params = {}) => {
  const res = await api.get("/published-books/interactions/history", { params })
  return res.data
}

// Actualizar una interacción existente
export const updateSwipeInteraction = async (interactionId, interactionData) => {
  const res = await api.put(`/published-books/interactions/${interactionId}`, interactionData)
  return res.data
}

// Eliminar una interacción
export const deleteSwipeInteraction = async (interactionId) => {
  const res = await api.delete(`/published-books/interactions/${interactionId}`)
  return res.data
}

// Actualizar una publicación de libro
export const updatePublishedBook = async (publishedBookId, updateData) => {
  const res = await api.put(`/published-books/${publishedBookId}`, updateData)
  return res.data
}

// Eliminar una publicación de libro
export const deletePublishedBook = async (publishedBookId) => {
  const res = await api.delete(`/published-books/${publishedBookId}`)
  return res.data
}

// Eliminar una imagen específica de una publicación
export const deletePublishedBookImage = async (imageId) => {
  const res = await api.delete(`/published-book-images/${imageId}`)
  return res.data
}

// Obtener mis publicaciones (libros del usuario autenticado) - CORREGIDO
export const getMyPublishedBooks = async (params = {}) => {
  const res = await api.get("/published-books/user/me", { params })
  return res.data
}