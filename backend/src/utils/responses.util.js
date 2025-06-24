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