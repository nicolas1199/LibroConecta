import { v2 as cloudinary } from 'cloudinary';

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Función para procesar multipart/form-data manualmente
function parseMultipartData(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      return reject(new Error('No boundary found'));
    }

    let buffer = Buffer.alloc(0);
    
    req.on('data', chunk => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    req.on('end', () => {
      try {
        const files = [];
        const fields = {};
        
        // Procesar el buffer y extraer archivos
        const parts = buffer.toString('binary').split(`--${boundary}`);
        
        parts.forEach(part => {
          if (part.includes('Content-Disposition: form-data')) {
            const nameMatch = part.match(/name="([^"]+)"/);
            const filenameMatch = part.match(/filename="([^"]+)"/);
            
            if (nameMatch && filenameMatch) {
              // Es un archivo
              const fieldName = nameMatch[1];
              const filename = filenameMatch[1];
              
              if (filename) {
                const contentTypeMatch = part.match(/Content-Type: ([^\r\n]+)/);
                const contentType = contentTypeMatch ? contentTypeMatch[1] : 'application/octet-stream';
                
                // Extraer el contenido binario del archivo
                const headerEndIndex = part.indexOf('\r\n\r\n');
                if (headerEndIndex !== -1) {
                  const fileContent = part.substring(headerEndIndex + 4);
                  const fileBuffer = Buffer.from(fileContent, 'binary');
                  
                  files.push({
                    fieldname: fieldName,
                    originalname: filename,
                    encoding: '7bit',
                    mimetype: contentType,
                    buffer: fileBuffer,
                    size: fileBuffer.length
                  });
                }
              }
            } else if (nameMatch) {
              // Es un campo de texto
              const fieldName = nameMatch[1];
              const valueStartIndex = part.indexOf('\r\n\r\n');
              if (valueStartIndex !== -1) {
                const value = part.substring(valueStartIndex + 4).trim();
                fields[fieldName] = value;
              }
            }
          }
        });

        resolve({ files, fields });
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

// Función para subir buffer a Cloudinary
function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'image',
        folder: 'libroconecta/books', // Organizar en carpetas
        public_id: `book_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        transformation: [
          { width: 800, height: 600, crop: 'limit' }, // Redimensionar automáticamente
          { quality: 'auto' }, // Optimización automática
          { format: 'auto' } // Formato automático (WebP si es compatible)
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

// Middleware para subir imágenes a Cloudinary
export const uploadBookImagesCloudinary = async (req, res, next) => {
  try {
    // Verificar configuración de Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return res.status(500).json({ 
        error: 'Configuración de Cloudinary no encontrada',
        message: 'Variables de entorno CLOUDINARY_* no configuradas' 
      });
    }

    // Verificar que sea multipart/form-data
    if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type debe ser multipart/form-data' });
    }

    // Parsear los datos
    const { files, fields } = await parseMultipartData(req);
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron archivos' });
    }

    // Procesar archivos
    const processedFiles = [];
    
    for (const file of files) {
      // Validar tipo de archivo
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: `Archivo ${file.originalname} no es una imagen válida` });
      }

      // Validar tamaño (máximo 10MB para Cloudinary)
      if (file.size > 10 * 1024 * 1024) {
        return res.status(400).json({ error: `Archivo ${file.originalname} excede el tamaño máximo de 10MB` });
      }

      try {
        // Subir a Cloudinary
        console.log(`☁️ Subiendo ${file.originalname} a Cloudinary...`);
        const result = await uploadToCloudinary(file.buffer, file.originalname);
        
        console.log(`✅ Imagen subida exitosamente: ${result.secure_url}`);
        
        processedFiles.push({
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: file.mimetype,
          filename: result.public_id,
          url: result.secure_url, // URL pública de Cloudinary
          size: file.size,
          width: result.width,
          height: result.height
        });
      } catch (uploadError) {
        console.error(`❌ Error subiendo ${file.originalname}:`, uploadError);
        return res.status(500).json({ error: `Error subiendo ${file.originalname}: ${uploadError.message}` });
      }
    }

    // Agregar archivos y campos al request
    req.files = processedFiles;
    req.body = { ...req.body, ...fields };

    next();
  } catch (error) {
    console.error('Error en uploadBookImagesCloudinary:', error);
    res.status(500).json({ error: 'Error al procesar archivos' });
  }
};

// Función para eliminar imagen de Cloudinary
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Error eliminando imagen de Cloudinary:', error);
    throw error;
  }
};

// Middleware alternativo si Cloudinary no está configurado
export const uploadBookImagesLocal = (req, res, next) => {
  console.log('⚠️ Cloudinary no configurado, usando sistema local');
  req.files = [];
  next();
}; 