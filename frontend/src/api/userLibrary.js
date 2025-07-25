import api from "./api.js";

// Obtener biblioteca personal del usuario
export async function getUserLibrary(params = {}) {
  const queryParams = new URLSearchParams();

  if (params.status) queryParams.append("status", params.status);
  if (params.page) queryParams.append("page", params.page);
  if (params.limit) queryParams.append("limit", params.limit);
  if (params.search) queryParams.append("search", params.search);
  if (params.author) queryParams.append("author", params.author);
  if (params.rating) queryParams.append("rating", params.rating);
  if (params.year) queryParams.append("year", params.year);
  if (params.genre) queryParams.append("genre", params.genre);
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);

  const url = `/user-library${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

  const response = await api.get(url);
  return response.data;
}

// Agregar libro a la biblioteca personal
export async function addToLibrary(bookData) {
  const response = await api.post("/user-library/add", bookData);
  return response.data;
}

// Actualizar estado de lectura de un libro
export async function updateReadingStatus(id, updateData) {
  const response = await api.put(`/user-library/${id}`, updateData);
  return response.data;
}

// Obtener estadísticas de lectura
export async function getReadingStats() {
  const response = await api.get("/user-library/stats");
  return response.data;
}

// Obtener insights de la biblioteca
export async function getLibraryInsights() {
  const response = await api.get("/user-library/insights");
  return response.data;
}

// Obtener un libro específico de la biblioteca por ID
export async function getUserLibraryBookById(id) {
  const response = await api.get(`/user-library/${id}`);
  return response.data;
}

// Eliminar libro de la biblioteca personal
export async function removeFromLibrary(id) {
  const response = await api.delete(`/user-library/${id}`);
  return response.data;
}

// Obtener recomendaciones personalizadas
export async function getRecommendations() {
  const response = await api.get("/user-library/recommendations");
  return response.data;
}

// Verificar si un libro ya existe en la biblioteca del usuario
export async function checkBookExists(title, author) {
  try {
    const params = new URLSearchParams();
    // Usar solo el título para la búsqueda inicial
    if (title) params.append("search", title.trim());

    const response = await api.get(`/user-library?${params.toString()}`);

    // Verificar si hay una coincidencia exacta de título y autor en el lado cliente
    const books = response.data.books || [];
    return books.find((book) => {
      const bookTitle = book.title?.toLowerCase().trim() || "";
      const bookAuthor = book.author?.toLowerCase().trim() || "";
      const searchTitle = title?.toLowerCase().trim() || "";
      const searchAuthor = author?.toLowerCase().trim() || "";

      return bookTitle === searchTitle && bookAuthor === searchAuthor;
    });
  } catch (error) {
    console.error("Error checking book existence:", error);
    return null;
  }
}
