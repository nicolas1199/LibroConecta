import multer from 'multer';

// Configurar multer para el upload temporal
const uploadProfileImage = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
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
        message: 'El archivo es demasiado grande. Máximo 5MB.',
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

// Función para convertir imagen a base64
export const convertImageToBase64 = (buffer, mimetype) => {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

export { uploadProfileImage, handleUploadError }; 