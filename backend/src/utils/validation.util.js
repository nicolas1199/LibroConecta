// Utilidades de validación para los nuevos sistemas

// Validar formato de email
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar rango de calificación
export function isValidRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
}

// Validar longitud de texto
export function isValidTextLength(text, minLength = 1, maxLength = 500) {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length >= minLength && trimmed.length <= maxLength;
}

// Validar ID numérico
export function isValidId(id) {
  return Number.isInteger(id) && id > 0;
}

// Validar UUID (si se necesita en el futuro)
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Sanitizar texto (remover caracteres peligrosos)
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  return text
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Validar mensaje de chat
export function isValidMessage(message) {
  return isValidTextLength(message, 1, 1000);
}

// Validar comentario de calificación
export function isValidComment(comment) {
  if (!comment) return true; // Los comentarios son opcionales
  return isValidTextLength(comment, 1, 500);
}

// Validar parámetros de paginación
export function isValidPaginationParams(page, limit) {
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  
  return (
    Number.isInteger(pageNum) && pageNum >= 1 &&
    Number.isInteger(limitNum) && limitNum >= 1 && limitNum <= 100
  );
}

// Validar tipo de transacción
export function isValidTransactionType(type) {
  return ['exchange', 'sell'].includes(type);
}

// Validar tipo de calificación
export function isValidRatingType(type) {
  return ['received', 'given'].includes(type);
}

// Validar formato de fecha
export function isValidDate(date) {
  if (!date) return false;
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
}

// Validar que una fecha no sea futura
export function isNotFutureDate(date) {
  if (!isValidDate(date)) return false;
  return new Date(date) <= new Date();
}

// Validar rango de fechas
export function isValidDateRange(startDate, endDate) {
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return false;
  }
  return new Date(startDate) <= new Date(endDate);
}

// Validar caracteres especiales en nombres
export function isValidName(name) {
  if (!name || typeof name !== 'string') return false;
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
}

// Validar parámetros de búsqueda
export function isValidSearchTerm(term) {
  if (!term || typeof term !== 'string') return false;
  const trimmed = term.trim();
  return trimmed.length >= 2 && trimmed.length <= 100;
}

// Validar coordenadas geográficas
export function isValidCoordinates(lat, lng) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  
  return (
    !isNaN(latitude) && !isNaN(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

// Validar radio de búsqueda
export function isValidRadius(radius) {
  const radiusNum = parseFloat(radius);
  return !isNaN(radiusNum) && radiusNum > 0 && radiusNum <= 500; // Máximo 500 km
}

// Validar array de IDs
export function isValidIdArray(ids) {
  if (!Array.isArray(ids)) return false;
  return ids.every(id => isValidId(id));
}

// Validar longitud de array
export function isValidArrayLength(array, minLength = 0, maxLength = 100) {
  if (!Array.isArray(array)) return false;
  return array.length >= minLength && array.length <= maxLength;
}

// Validar objeto con campos requeridos
export function hasRequiredFields(obj, requiredFields) {
  if (!obj || typeof obj !== 'object') return false;
  return requiredFields.every(field => 
    obj.hasOwnProperty(field) && obj[field] !== null && obj[field] !== undefined
  );
}

// Validar URL de imagen
export function isValidImageUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const urlRegex = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i;
  return urlRegex.test(url);
}

// Validar ISBN
export function isValidISBN(isbn) {
  if (!isbn || typeof isbn !== 'string') return false;
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  return cleanISBN.length === 10 || cleanISBN.length === 13;
}

// Validar precio
export function isValidPrice(price) {
  const priceNum = parseFloat(price);
  return !isNaN(priceNum) && priceNum >= 0 && priceNum <= 999999;
}

// Crear un validador personalizado
export function createValidator(validationFn, errorMessage) {
  return (value) => {
    if (!validationFn(value)) {
      throw new Error(errorMessage);
    }
    return true;
  };
}

// Validar múltiples reglas
export function validateMultiple(value, validators) {
  for (const validator of validators) {
    if (!validator(value)) {
      return false;
    }
  }
  return true;
} 