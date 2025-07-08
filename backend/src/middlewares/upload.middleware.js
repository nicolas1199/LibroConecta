import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para asegurar que el directorio existe
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

// Función para generar nombre único de archivo
function generateUniqueFileName(originalName) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  return `${timestamp}_${random}${ext}`;
}

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

// Middleware para manejar upload de imágenes
export const uploadBookImages = async (req, res, next) => {
  try {
    // Verificar que sea multipart/form-data
    if (!req.headers['content-type']?.startsWith('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type debe ser multipart/form-data' });
    }

    // Parsear los datos
    const { files, fields } = await parseMultipartData(req);
    
    // Crear directorio si no existe
    const uploadDir = path.join(__dirname, '../../uploads/books');
    await ensureDirectoryExists(uploadDir);

    // Procesar archivos
    const processedFiles = [];
    
    for (const file of files) {
      // Validar tipo de archivo
      if (!file.mimetype.startsWith('image/')) {
        return res.status(400).json({ error: `Archivo ${file.originalname} no es una imagen válida` });
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: `Archivo ${file.originalname} excede el tamaño máximo de 5MB` });
      }

      // Generar nombre único
      const uniqueFileName = generateUniqueFileName(file.originalname);
      const filePath = path.join(uploadDir, uniqueFileName);

      // Guardar archivo
      await fs.writeFile(filePath, file.buffer);

      processedFiles.push({
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding,
        mimetype: file.mimetype,
        filename: uniqueFileName,
        path: filePath,
        size: file.size
      });
    }

    // Agregar archivos y campos al request
    req.files = processedFiles;
    req.body = { ...req.body, ...fields };

    next();
  } catch (error) {
    console.error('Error en uploadBookImages:', error);
    res.status(500).json({ error: 'Error al procesar archivos' });
  }
};

// Middleware alternativo si no se pueden subir archivos
export const uploadBookImagesLegacy = (req, res, next) => {
  // Para casos donde no se pueden subir archivos, crear placeholders
  req.files = [];
  next();
}; 