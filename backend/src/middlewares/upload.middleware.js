import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Crear directorio si no existe
const uploadDir = 'uploads/books';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp + random + extensión original
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Filtro para archivos de imagen
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen (JPEG, JPG, PNG, WebP)'), false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo por archivo
    files: 5 // Máximo 5 archivos
  },
  fileFilter: fileFilter
});

// Middleware para subir múltiples imágenes
export const uploadBookImages = upload.array('images', 5);

// Middleware para subir una sola imagen
export const uploadSingleImage = upload.single('image');

// Middleware para manejar errores de multer
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo muy grande',
        message: 'El archivo no puede exceder 5MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Demasiados archivos',
        message: 'No puedes subir más de 5 imágenes'
      });
    }
  }
  
  if (error.message.includes('Solo se permiten archivos de imagen')) {
    return res.status(400).json({
      error: 'Tipo de archivo no válido',
      message: error.message
    });
  }

  next(error);
}; 