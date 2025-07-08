export function success(res, data, message = "Operación exitosa", status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function error(res, message = "Error en la operación", status = 500) {
  return res.status(status).json({
    success: false,
    message,
  });
}

export function notFound(res, message = "Recurso no encontrado", status = 404) {
  return res.status(status).json({
    success: false,
    message,
  });
}

// Función para crear respuestas estructuradas
export function createResponse(status, message, data = null, error = null, meta = null) {
  const response = {
    success: status >= 200 && status < 300,
    message,
  };

  if (data !== null) {
    response.data = data;
  }

  if (error !== null) {
    response.error = error;
  }

  if (meta !== null) {
    response.meta = meta;
  }

  return response;
}