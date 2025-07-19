// Función para procesar multipart/form-data manualmente
function parseMultipartData(req) {
  return new Promise((resolve, reject) => {
    const boundary = req.headers["content-type"]?.split("boundary=")[1];
    if (!boundary) {
      return reject(new Error("No boundary found"));
    }

    let buffer = Buffer.alloc(0);

    req.on("data", (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
    });

    req.on("end", () => {
      try {
        const files = [];
        const fields = {};

        // Procesar el buffer y extraer archivos
        const parts = buffer.toString("binary").split(`--${boundary}`);

        parts.forEach((part) => {
          if (part.includes("Content-Disposition: form-data")) {
            const nameMatch = part.match(/name="([^"]+)"/);
            const filenameMatch = part.match(/filename="([^"]+)"/);

            if (nameMatch && filenameMatch) {
              // Es un archivo
              const fieldName = nameMatch[1];
              const filename = filenameMatch[1];

              if (filename && filename !== '""') {
                const headerEndIndex = part.indexOf("\r\n\r\n");
                if (headerEndIndex !== -1) {
                  const fileData = part.substring(headerEndIndex + 4);
                  const cleanFileData = fileData.replace(/\r\n$/, "");

                  const fileBuffer = Buffer.from(cleanFileData, "binary");

                  // Detectar tipo MIME basado en los primeros bytes del archivo
                  let mimetype = "application/octet-stream";
                  if (fileBuffer.length > 10) {
                    const header = fileBuffer.toString("hex", 0, 10).toLowerCase();
                    if (header.startsWith("ffd8ff")) {
                      mimetype = "image/jpeg";
                    } else if (header.startsWith("89504e47")) {
                      mimetype = "image/png";
                    } else if (header.startsWith("474946383") || header.startsWith("474946387")) {
                      mimetype = "image/gif";
                    } else if (header.includes("57454250")) {
                      mimetype = "image/webp";
                    }
                  }

                  files.push({
                    fieldname: fieldName,
                    originalname: filename,
                    encoding: "binary",
                    mimetype,
                    buffer: fileBuffer,
                    size: fileBuffer.length,
                  });
                }
              }
            } else if (nameMatch && !filenameMatch) {
              // Es un campo de texto
              const fieldName = nameMatch[1];
              const valueStartIndex = part.indexOf("\r\n\r\n");
              if (valueStartIndex !== -1) {
                const value = part
                  .substring(valueStartIndex + 4)
                  .replace(/\r\n$/, "");
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
  });
}

// Función para convertir imagen a base64
function convertImageToBase64(buffer, mimetype) {
  const base64String = buffer.toString('base64');
  return `data:${mimetype};base64,${base64String}`;
}

// Función para redimensionar imagen si es muy grande (opcional)
function validateAndOptimizeImage(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    try {
      // Validar tamaño de archivo (máximo 5MB para evitar problemas en BD)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        return reject(new Error(`La imagen ${filename} es demasiado grande. Máximo 5MB permitido.`));
      }

      // Validar que sea una imagen
      if (!mimetype.startsWith('image/')) {
        return reject(new Error(`El archivo ${filename} no es una imagen válida.`));
      }

      // Para optimización futura, aquí podrías agregar lógica de redimensionamiento
      // Por ahora, devolvemos la imagen tal como está
      resolve({
        buffer,
        mimetype,
        optimized: false
      });

    } catch (error) {
      reject(error);
    }
  });
}

// Middleware principal para convertir imágenes a base64
export const uploadBookImagesBase64 = async (req, res, next) => {
  try {
    // Verificar que sea multipart/form-data
    if (!req.headers["content-type"]?.startsWith("multipart/form-data")) {
      return res
        .status(400)
        .json({ error: "Content-Type debe ser multipart/form-data" });
    }

    // Parsear los datos
    const { files, fields } = await parseMultipartData(req);

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron archivos" });
    }

    console.log(`📄 Procesando ${files.length} imagen(es) para conversión a base64...`);

    // Procesar archivos
    const processedFiles = [];

    for (const file of files) {
      try {
        console.log(`🔄 Procesando: ${file.originalname} (${file.size} bytes)`);

        // Validar y optimizar imagen
        const { buffer, mimetype } = await validateAndOptimizeImage(
          file.buffer, 
          file.originalname, 
          file.mimetype
        );

        // Convertir a base64
        const base64Data = convertImageToBase64(buffer, mimetype);
        
        console.log(`✅ ${file.originalname} convertida a base64 (${base64Data.length} caracteres)`);

        processedFiles.push({
          fieldname: file.fieldname,
          originalname: file.originalname,
          encoding: file.encoding,
          mimetype: mimetype,
          filename: `base64_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
          base64: base64Data,
          size: file.size,
          base64Size: base64Data.length
        });

      } catch (fileError) {
        console.error(`❌ Error procesando ${file.originalname}:`, fileError);
        return res
          .status(400)
          .json({
            error: `Error procesando ${file.originalname}: ${fileError.message}`,
          });
      }
    }

    console.log(`🎉 Todas las imágenes convertidas exitosamente a base64`);

    // Agregar archivos y campos al request
    req.files = processedFiles;
    req.body = { ...req.body, ...fields };

    next();
  } catch (error) {
    console.error("Error en uploadBookImagesBase64:", error);
    res.status(500).json({ error: "Error al procesar archivos para base64" });
  }
};

// Middleware alternativo para desarrollo/testing
export const uploadBookImagesBase64Local = (req, res, next) => {
  console.log("💾 Usando conversión local a base64");
  req.files = [];
  next();
}; 