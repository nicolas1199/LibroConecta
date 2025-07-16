export const SWIPE_TYPES = {
  LIKE: true,
  DISLIKE: false,
};

export const USER_TYPES = {
  ADMIN: "admin",
  USER: "user",
};
export const BOOK_STATUS = {
  AVAILABLE: "available",
  UNAVAILABLE: "unavailable",
};

// Estados de lectura válidos
export const READING_STATUSES = {
  TO_READ: "por_leer",
  READING: "leyendo",
  READ: "leido",
  ABANDONED: "abandonado",
};

export const VALID_READING_STATUSES = Object.values(READING_STATUSES);

// Validaciones para ratings
export const RATING_LIMITS = {
  MIN: 1,
  MAX: 5,
};

// Límites para reviews
export const REVIEW_LIMITS = {
  MAX_LENGTH: 1000,
};

// Configuración de paginación
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 50,
};

// Mensajes de respuesta comunes
export const RESPONSE_MESSAGES = {
  USER_NOT_AUTHENTICATED: "Usuario no autenticado",
  BOOK_NOT_FOUND_IN_LIBRARY: "Libro no encontrado en tu biblioteca",
  INVALID_READING_STATUS:
    "Estado de lectura inválido. Debe ser: por_leer, leyendo, leido, o abandonado",
  INVALID_RATING: "La calificación debe estar entre 1 y 5",
  SWIPE_REGISTERED: "Swipe registrado correctamente",
  BOOK_ADDED_TO_LIBRARY: "Libro agregado/actualizado en biblioteca personal",
  READING_STATUS_UPDATED: "Estado de lectura actualizado correctamente",
  SWIPES_RESET: "Swipes del usuario eliminados correctamente",
};

// Géneros de libros más comunes
export const BOOK_GENRES = {
  FICTION: "Ficción",
  NON_FICTION: "No ficción",
  MYSTERY: "Misterio",
  THRILLER: "Thriller",
  ROMANCE: "Romance",
  FANTASY: "Fantasía",
  SCIENCE_FICTION: "Ciencia ficción",
  HORROR: "Terror",
  BIOGRAPHY: "Biografía",
  AUTOBIOGRAPHY: "Autobiografía",
  HISTORY: "Historia",
  PHILOSOPHY: "Filosofía",
  PSYCHOLOGY: "Psicología",
  SELF_HELP: "Autoayuda",
  BUSINESS: "Negocios",
  COOKING: "Cocina",
  TRAVEL: "Viajes",
  HEALTH: "Salud",
  SPORTS: "Deportes",
  POLITICS: "Política",
  RELIGION: "Religión",
  SCIENCE: "Ciencia",
  TECHNOLOGY: "Tecnología",
  ART: "Arte",
  MUSIC: "Música",
  POETRY: "Poesía",
  DRAMA: "Drama",
  ADVENTURE: "Aventura",
  CRIME: "Crimen",
  YOUNG_ADULT: "Juvenil",
  CHILDREN: "Infantil",
  EDUCATION: "Educación",
  REFERENCE: "Referencia",
  HUMOR: "Humor",
  ESSAYS: "Ensayos",
};

export const POPULAR_GENRES = Object.values(BOOK_GENRES);

// Mapeo de géneros de Google Books a nuestros géneros
export const GOOGLE_BOOKS_GENRE_MAPPING = {
  Fiction: BOOK_GENRES.FICTION,
  "Juvenile Fiction": BOOK_GENRES.YOUNG_ADULT,
  "Biography & Autobiography": BOOK_GENRES.BIOGRAPHY,
  History: BOOK_GENRES.HISTORY,
  "Business & Economics": BOOK_GENRES.BUSINESS,
  "Self-Help": BOOK_GENRES.SELF_HELP,
  "Health & Fitness": BOOK_GENRES.HEALTH,
  Cooking: BOOK_GENRES.COOKING,
  Travel: BOOK_GENRES.TRAVEL,
  Science: BOOK_GENRES.SCIENCE,
  "Technology & Engineering": BOOK_GENRES.TECHNOLOGY,
  Art: BOOK_GENRES.ART,
  Music: BOOK_GENRES.MUSIC,
  Poetry: BOOK_GENRES.POETRY,
  Drama: BOOK_GENRES.DRAMA,
  Philosophy: BOOK_GENRES.PHILOSOPHY,
  Psychology: BOOK_GENRES.PSYCHOLOGY,
  Religion: BOOK_GENRES.RELIGION,
  "Political Science": BOOK_GENRES.POLITICS,
  "Sports & Recreation": BOOK_GENRES.SPORTS,
  Humor: BOOK_GENRES.HUMOR,
  "Literary Collections": BOOK_GENRES.ESSAYS,
  Education: BOOK_GENRES.EDUCATION,
  Reference: BOOK_GENRES.REFERENCE,
};
