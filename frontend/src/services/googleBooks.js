// Nota: La API de Google Books es gratuita hasta 1000 consultas/día sin API key
// Para uso en producción, configurar VITE_GOOGLE_BOOKS_API_KEY en .env
const GOOGLE_BOOKS_BASE_URL = "https://www.googleapis.com/books/v1/volumes";

// Mapeo de géneros de Google Books a nuestros géneros
const GOOGLE_BOOKS_GENRE_MAPPING = {
  Fiction: "Ficción",
  "Juvenile Fiction": "Juvenil",
  "Biography & Autobiography": "Biografía",
  History: "Historia",
  "Business & Economics": "Negocios",
  "Self-Help": "Autoayuda",
  "Health & Fitness": "Salud",
  Cooking: "Cocina",
  Travel: "Viajes",
  Science: "Ciencia",
  "Technology & Engineering": "Tecnología",
  Art: "Arte",
  Music: "Música",
  Poetry: "Poesía",
  Drama: "Drama",
  Philosophy: "Filosofía",
  Psychology: "Psicología",
  Religion: "Religión",
  "Political Science": "Política",
  "Sports & Recreation": "Deportes",
  Humor: "Humor",
  "Literary Collections": "Ensayos",
  Education: "Educación",
  Reference: "Referencia",
  Mystery: "Misterio",
  Romance: "Romance",
  Fantasy: "Fantasía",
  "Science Fiction": "Ciencia ficción",
  Horror: "Terror",
  Adventure: "Aventura",
  Crime: "Crimen",
  "Non-fiction": "No ficción",
};

/**
 * Mapear géneros de Google Books a nuestros géneros
 */
const mapGoogleBooksGenres = (googleGenres) => {
  if (!googleGenres || !Array.isArray(googleGenres)) return [];

  const mappedGenres = googleGenres
    .map((genre) => GOOGLE_BOOKS_GENRE_MAPPING[genre] || genre)
    .filter((genre) => genre && genre.trim() !== "");

  return [...new Set(mappedGenres)]; // Eliminar duplicados
};

/**
 * Buscar libros usando la API de Google Books
 * @param {string} query - Término de búsqueda
 * @param {number} maxResults - Número máximo de resultados (default: 10)
 * @returns {Promise<Array>} - Array de libros encontrados
 */
export const searchGoogleBooks = async (query, maxResults = 10) => {
  try {
    const url = new URL(GOOGLE_BOOKS_BASE_URL);
    url.searchParams.append("q", query);
    url.searchParams.append("maxResults", maxResults.toString());
    url.searchParams.append("printType", "books");
    url.searchParams.append("orderBy", "relevance");

    // TODO: Agregar API key en producción para mayor límite de consultas
    // const apiKey = import.meta.env?.VITE_GOOGLE_BOOKS_API_KEY;
    // if (apiKey) url.searchParams.append('key', apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`);
    }

    const data = await response.json();

    return (
      data.items?.map((item) => {
        const volumeInfo = item.volumeInfo;
        const mappedGenres = mapGoogleBooksGenres(volumeInfo.categories);

        return {
          googleId: item.id,
          id: item.id, // Para compatibilidad
          title: volumeInfo.title || "Título no disponible",
          authors: volumeInfo.authors || ["Autor desconocido"],
          author: volumeInfo.authors?.[0] || "Autor desconocido",
          publishedDate: volumeInfo.publishedDate,
          date_of_pub: volumeInfo.publishedDate, // Para compatibilidad
          description: volumeInfo.description,
          isbn: volumeInfo.industryIdentifiers?.find(
            (id) => id.type === "ISBN_13" || id.type === "ISBN_10",
          )?.identifier,
          thumbnail: volumeInfo.imageLinks?.thumbnail?.replace(
            "http:",
            "https:",
          ),
          image_url: volumeInfo.imageLinks?.thumbnail?.replace(
            "http:",
            "https:",
          ), // Para compatibilidad
          smallThumbnail: volumeInfo.imageLinks?.smallThumbnail?.replace(
            "http:",
            "https:",
          ),
          categories: volumeInfo.categories || [],
          genres: mappedGenres, // Géneros mapeados
          mainGenre: mappedGenres[0] || null, // Género principal
          averageRating: volumeInfo.averageRating,
          ratingsCount: volumeInfo.ratingsCount,
          pageCount: volumeInfo.pageCount,
          language: volumeInfo.language,
          previewLink: volumeInfo.previewLink,
          infoLink: volumeInfo.infoLink,
        };
      }) || []
    );
  } catch (error) {
    console.error("Error buscando en Google Books:", error);
    throw error;
  }
};

/**
 * Obtener recomendaciones usando múltiples consultas
 * @param {Array<string>} searchQueries - Array de consultas de búsqueda
 * @param {Array<string>} userBookTitles - Títulos de libros que ya tiene el usuario
 * @returns {Promise<Array>} - Array de libros recomendados
 */
export const getGoogleBooksRecommendations = async (
  searchQueries,
  userBookTitles = [],
) => {
  try {
    const allRecommendations = [];
    const seenBooks = new Set();

    // Normalizar títulos de libros del usuario para comparación
    const normalizedUserBooks = userBookTitles.map((title) =>
      title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s]/g, ""),
    );

    for (const query of searchQueries) {
      try {
        const books = await searchGoogleBooks(query, 8);

        books.forEach((book) => {
          // Crear clave única para evitar duplicados
          const bookKey = `${book.title.toLowerCase().trim()}|${book.author.toLowerCase().trim()}`;

          // Normalizar título para comparación con biblioteca del usuario
          const normalizedTitle = book.title
            .toLowerCase()
            .trim()
            .replace(/[^\w\s]/g, "");

          // Verificar si el libro no está duplicado y no lo tiene el usuario
          if (
            !seenBooks.has(bookKey) &&
            !normalizedUserBooks.some(
              (userTitle) =>
                userTitle.includes(normalizedTitle) ||
                normalizedTitle.includes(userTitle),
            )
          ) {
            seenBooks.add(bookKey);
            allRecommendations.push({
              ...book,
              reason: getRecommendationReason(query),
              searchQuery: query,
            });
          }
        });

        // Pequeña pausa entre consultas para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.warn(`Error en consulta "${query}":`, error);
        continue;
      }
    }

    // Ordenar por rating y popularidad, luego tomar los mejores
    return allRecommendations
      .sort((a, b) => {
        // Priorizar libros con rating alto y muchas reseñas
        const scoreA = (a.averageRating || 0) * Math.log(a.ratingsCount || 1);
        const scoreB = (b.averageRating || 0) * Math.log(b.ratingsCount || 1);
        return scoreB - scoreA;
      })
      .slice(0, 12); // Máximo 12 recomendaciones
  } catch (error) {
    console.error("Error obteniendo recomendaciones de Google Books:", error);
    throw error;
  }
};

/**
 * Generar razón de recomendación basada en la consulta
 */
const getRecommendationReason = (query) => {
  if (query.includes("inauthor:")) {
    const author = query.replace("inauthor:", "").replace(/"/g, "");
    return `Porque te gustan los libros de ${author}`;
  }
  if (query.includes("intitle:")) {
    const keyword = query.replace("intitle:", "");
    return `Porque te interesan libros sobre ${keyword}`;
  }
  if (query.includes("subject:")) {
    const subject = query.replace("subject:", "").replace(" bestsellers", "");
    return `Recomendado por tu interés en ${subject}`;
  }
  return "Recomendado basado en tus preferencias de lectura";
};

/**
 * Buscar libro específico por título y autor
 * @param {string} title - Título del libro
 * @param {string} author - Autor del libro
 * @returns {Promise<Object|null>} - Libro encontrado o null
 */
export const findBookByTitleAuthor = async (title, author) => {
  try {
    const query = `intitle:"${title}" inauthor:"${author}"`;
    const books = await searchGoogleBooks(query, 5);

    // Buscar coincidencia más exacta
    return (
      books.find(
        (book) =>
          book.title.toLowerCase().includes(title.toLowerCase()) &&
          book.author.toLowerCase().includes(author.toLowerCase()),
      ) ||
      books[0] ||
      null
    );
  } catch (error) {
    console.error("Error buscando libro específico:", error);
    return null;
  }
};

/**
 * Obtener libros populares por categoría
 * @param {string} category - Categoría de libros
 * @param {number} maxResults - Número máximo de resultados
 * @returns {Promise<Array>} - Array de libros populares
 */
export const getPopularBooksByCategory = async (
  category = "fiction",
  maxResults = 10,
) => {
  try {
    const query = `subject:${category}&orderBy=newest`;
    return await searchGoogleBooks(query, maxResults);
  } catch (error) {
    console.error("Error obteniendo libros populares:", error);
    return [];
  }
};
