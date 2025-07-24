import multer from 'multer';

// Configurar multer para el upload temporal
const uploadProfileImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024, // 8MB máximo (igual que PublishedBooks)
  },
  fileFilter: (req, file, cb) => {
    // Verificar tipo de archivo
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
});

// Middleware para manejar errores de upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 8MB.',
        error: error.message
      });
    }
  }
  
  if (error.message === 'Solo se permiten archivos de imagen') {
    return res.status(400).json({
      success: false,
      message: 'Solo se permiten archivos de imagen (jpg, jpeg, png, gif, webp)',
      error: error.message
    });
  }
  
  next(error);
};

// Función para convertir imagen a base64 (igual que PublishedBooks)
export const convertImageToBase64 = (buffer, mimetype) => {
  // Validar tamaño de archivo (igual que PublishedBooks)
  const maxSize = 8 * 1024 * 1024; // 8MB
  if (buffer.length > maxSize) {
    throw new Error(`La imagen es demasiado grande. Máximo 8MB permitido.`);
  }

  // Validar que sea una imagen
  if (!mimetype.startsWith('image/')) {
    throw new Error('El archivo no es una imagen válida.');
  }

  console.log(`📷 Procesando imagen: ${buffer.length} bytes, ${mimetype}`);
  
  // Convertir a base64 sin comprimir (preservar calidad como PublishedBooks)
  const base64 = buffer.toString('base64');
  console.log(`📊 Tamaño base64: ${base64.length} caracteres`);
  
  return `data:${mimetype};base64,${base64}`;
};

export { uploadProfileImage, handleUploadError }; 