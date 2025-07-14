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
    "Estado de lectura inválido. Debe ser: por_leer, leyendo, o leido",
  INVALID_RATING: "La calificación debe estar entre 1 y 5",
  SWIPE_REGISTERED: "Swipe registrado correctamente",
  BOOK_ADDED_TO_LIBRARY: "Libro agregado/actualizado en biblioteca personal",
  READING_STATUS_UPDATED: "Estado de lectura actualizado correctamente",
  SWIPES_RESET: "Swipes del usuario eliminados correctamente",
};
