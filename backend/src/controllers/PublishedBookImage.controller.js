import { PublishedBookImage, PublishedBooks } from "../db/modelIndex.js";

// Obtener imágenes de un libro publicado
export async function getImagesByPublishedBook(req, res) {
  try {
    const { publishedBookId } = req.params;

    const images = await PublishedBookImage.findAll({
      where: { published_book_id: publishedBookId },
      order: [
        ["is_primary", "DESC"],
        ["published_book_image_id", "ASC"],
      ],
    });

    // Procesar imágenes para incluir datos base64 o URL según corresponda
    const processedImages = images.map(img => {
      const imageData = img.toJSON();
      
      // Si tiene datos base64, usarlos como fuente de imagen
      if (imageData.image_data) {
        imageData.src = imageData.image_data; // Base64 data URI
      } else if (imageData.image_url) {
        imageData.src = imageData.image_url; // URL externa (Cloudinary)
      }
      
      return imageData;
    });

    res.json(processedImages);
  } catch (error) {
    console.error("Error en getImagesByPublishedBook:", error);
    res.status(500).json({ error: "Error al obtener imágenes" });
  }
}

// Obtener imagen por ID
export async function getPublishedBookImageById(req, res) {
  try {
    const { id } = req.params;
    const image = await PublishedBookImage.findByPk(id, {
      include: [
        {
          model: PublishedBooks,
        },
      ],
    });

    if (!image) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    res.json(image);
  } catch (error) {
    console.error("Error en getPublishedBookImageById:", error);
    res.status(500).json({ error: "Error al obtener imagen" });
  }
}

// Agregar imagen a libro publicado
export async function addImageToPublishedBook(req, res) {
  try {
    const { publishedBookId } = req.params;
    const { image_url, is_primary = false } = req.body;

    if (!image_url) {
      return res
        .status(400)
        .json({ error: "La URL de la imagen es requerida" });
    }

    // Verificar que el libro publicado existe y pertenece al usuario
    const publishedBook = await PublishedBooks.findByPk(publishedBookId);
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    if (publishedBook.get("user_id") !== req.user.user_id) {
      return res
        .status(403)
        .json({
          error: "No tienes permisos para agregar imágenes a este libro",
        });
    }

    // Si se marca como primaria, desmarcar otras imágenes primarias
    if (is_primary) {
      await PublishedBookImage.update(
        { is_primary: false },
        { where: { published_book_id: publishedBookId } }
      );
    }

    const newImage = await PublishedBookImage.create({
      published_book_id: publishedBookId,
      image_url,
      is_primary,
    });

    res.status(201).json(newImage);
  } catch (error) {
    console.error("Error en addImageToPublishedBook:", error);
    res.status(500).json({ error: "Error al agregar imagen" });
  }
}

// Actualizar imagen
export async function updatePublishedBookImage(req, res) {
  try {
    const { id } = req.params;
    const { image_url, is_primary } = req.body;

    const image = await PublishedBookImage.findByPk(id, {
      include: [{ model: PublishedBooks }],
    });

    if (!image) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    // Verificar permisos
    if (image.PublishedBooks.user_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para actualizar esta imagen" });
    }

    // Si se marca como primaria, desmarcar otras imágenes primarias
    if (is_primary) {
      await PublishedBookImage.update(
        { is_primary: false },
        { where: { published_book_id: image.published_book_id } }
      );
    }

    await image.update({
      image_url,
      is_primary,
    });

    res.json(image);
  } catch (error) {
    console.error("Error en updatePublishedBookImage:", error);
    res.status(500).json({ error: "Error al actualizar imagen" });
  }
}

// Eliminar imagen
export async function deletePublishedBookImage(req, res) {
  try {
    const { id } = req.params;
    console.log(`🗑️ Iniciando eliminación de imagen con ID: ${id}`);
    console.log(`👤 Usuario autenticado: ${req.user?.user_id}`);
    console.log(`📍 Headers de la petición:`, req.headers);

    // Validar que el ID sea un número válido
    if (!id || isNaN(parseInt(id))) {
      console.log(`❌ ID de imagen inválido: ${id}`);
      return res.status(400).json({ error: "ID de imagen inválido" });
    }

    const image = await PublishedBookImage.findByPk(id, {
      include: [{ 
        model: PublishedBooks,
        attributes: ['published_book_id', 'user_id'] 
      }],
    });

    console.log(`📸 Imagen encontrada:`, image ? 'SÍ' : 'NO');
    
    if (!image) {
      console.log(`❌ Error: Imagen ${id} no encontrada en la base de datos`);
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    console.log(`📖 Libro publicado asociado: ${image.PublishedBooks?.published_book_id}`);
    console.log(`👤 Propietario del libro: ${image.PublishedBooks?.user_id}`);

    // Verificar que existe la relación con PublishedBooks
    if (!image.PublishedBooks) {
      console.log(`❌ Error: La imagen ${id} no tiene un libro publicado asociado`);
      return res.status(500).json({ error: "La imagen no tiene un libro publicado asociado" });
    }

    // Verificar permisos
    if (image.PublishedBooks.user_id !== req.user.user_id) {
      console.log(`🚫 Error de permisos: usuario ${req.user.user_id} no es propietario (propietario real: ${image.PublishedBooks.user_id})`);
      return res
        .status(403)
        .json({ error: "No tienes permisos para eliminar esta imagen" });
    }

    console.log(`🗑️ Eliminando imagen de la base de datos...`);
    
    // DIAGNÓSTICO: Intentar eliminación simple primero
    try {
      console.log(`🔄 Intentando eliminación directa sin transacción...`);
      
      // Verificar que la imagen existe antes de eliminar
      const imageExists = await PublishedBookImage.findByPk(id);
      console.log(`📸 Imagen existe antes de eliminar:`, !!imageExists);
      
      // Eliminar directamente
      const deleteResult = await image.destroy();
      console.log(`🗑️ Resultado de eliminación:`, deleteResult);
      
      // Verificar que la imagen ya no existe
      const imageAfterDelete = await PublishedBookImage.findByPk(id);
      console.log(`📸 Imagen existe después de eliminar:`, !!imageAfterDelete);
      
      if (imageAfterDelete) {
        console.log(`❌ PROBLEMA: La imagen aún existe en la base de datos después de destroy()`);
        throw new Error("La imagen no se eliminó de la base de datos");
      }
      
      console.log(`✅ Imagen eliminada exitosamente de la base de datos`);
    } catch (dbError) {
      console.error(`❌ Error al eliminar de la base de datos:`, dbError);
      console.error(`❌ Tipo de error:`, dbError.name);
      console.error(`❌ Mensaje de error:`, dbError.message);
      throw dbError;
    }
    
    res.json({ 
      message: "Imagen eliminada correctamente",
      deleted_image_id: id
    });
  } catch (error) {
    console.error("❌ Error en deletePublishedBookImage:", error);
    console.error("❌ Stack trace:", error.stack);
    console.error("❌ Información adicional:", {
      imageId: req.params.id,
      userId: req.user?.user_id,
      timestamp: new Date().toISOString()
    });
    
    // Respuesta de error más específica
    if (error.name === 'SequelizeConnectionError') {
      res.status(503).json({ error: "Error de conexión a la base de datos" });
    } else if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: "Error de validación de datos" });
    } else {
      res.status(500).json({ 
        error: "Error al eliminar imagen",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

// Establecer imagen como primaria
export async function setPrimaryImage(req, res) {
  try {
    const { id } = req.params;

    const image = await PublishedBookImage.findByPk(id, {
      include: [{ model: PublishedBooks }],
    });

    if (!image) {
      return res.status(404).json({ error: "Imagen no encontrada" });
    }

    // Verificar permisos
    if (image.PublishedBooks.user_id !== req.user.user_id) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para modificar esta imagen" });
    }

    // Desmarcar otras imágenes primarias
    await PublishedBookImage.update(
      { is_primary: false },
      { where: { published_book_id: image.published_book_id } }
    );

    // Marcar esta imagen como primaria
    await image.update({ is_primary: true });

    res.json(image);
  } catch (error) {
    console.error("Error en setPrimaryImage:", error);
    res.status(500).json({ error: "Error al establecer imagen primaria" });
  }
}

// Subir múltiples imágenes con archivos reales
export async function uploadImagesForPublishedBook(req, res) {
  try {
    const { publishedBookId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron archivos" });
    }

    // Verificar que el libro publicado existe y pertenece al usuario
    const publishedBook = await PublishedBooks.findByPk(publishedBookId);
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    if (publishedBook.user_id !== req.user.user_id) {
      return res
        .status(403)
        .json({
          error: "No tienes permisos para agregar imágenes a este libro",
        });
    }

    // Crear registros de imagen para cada archivo subido
    const imagePromises = files.map((file, index) => {
      const imageUrl = file.url; // URL completa de Cloudinary
      console.log(`💾 Guardando imagen en BD: ${imageUrl}`);
      return PublishedBookImage.create({
        published_book_id: publishedBookId,
        image_url: imageUrl, // URL completa de Cloudinary
        is_primary: index === 0, // Primera imagen es primaria por defecto
      });
    });

    const savedImages = await Promise.all(imagePromises);
    console.log(
      `✅ ${savedImages.length} imágenes guardadas en BD exitosamente`
    );

    res.status(201).json({
      message: `${savedImages.length} imágenes subidas exitosamente`,
      images: savedImages,
    });
  } catch (error) {
    console.error("Error en uploadImagesForPublishedBook:", error);
    res.status(500).json({ error: "Error al subir imágenes" });
  }
}

// Subir múltiples imágenes en formato base64 desde JSON
export async function uploadImagesBase64JSONForPublishedBook(req, res) {
  try {
    const { publishedBookId } = req.params;
    const { images } = req.body;

    console.log(`💾 Controlador: Iniciando subida de imágenes base64 JSON para libro ${publishedBookId}`);

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron imágenes en el formato correcto" });
    }

    // Verificar que el libro publicado existe y pertenece al usuario
    const publishedBook = await PublishedBooks.findByPk(publishedBookId);
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    if (publishedBook.user_id !== req.user.user_id) {
      return res
        .status(403)
        .json({
          error: "No tienes permisos para agregar imágenes a este libro",
        });
    }

    // Validar formato de las imágenes base64
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.base64 || typeof img.base64 !== 'string') {
        return res.status(400).json({ 
          error: `La imagen ${i + 1} no tiene datos base64 válidos` 
        });
      }
      
      // Verificar que sea un data URI válido
      if (!img.base64.startsWith('data:image/')) {
        return res.status(400).json({ 
          error: `La imagen ${i + 1} no es una imagen válida en formato base64` 
        });
      }
    }

    // Crear registros de imagen para cada imagen base64
    const imagePromises = images.map((img, index) => {
      console.log(`💾 Guardando imagen base64 JSON ${index + 1}/${images.length}`);
      
      // Extraer información del data URI
      const mimeTypeMatch = img.base64.match(/data:([^;]+);base64,/);
      const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/png';
      const extension = mimeType.split('/')[1] || 'png';
      const filename = `image_${Date.now()}_${index}.${extension}`;

      return PublishedBookImage.create({
        published_book_id: publishedBookId,
        image_data: img.base64, // Datos base64 de la imagen
        image_url: null, // No hay URL externa
        image_filename: filename,
        image_mimetype: mimeType,
        image_size: img.base64.length, // Tamaño aproximado
        is_primary: img.is_primary || (index === 0), // Primera imagen es primaria por defecto
      });
    });

    const savedImages = await Promise.all(imagePromises);
    console.log(
      `✅ ${savedImages.length} imágenes base64 JSON guardadas en BD exitosamente`
    );

    res.status(201).json({
      message: `${savedImages.length} imágenes subidas exitosamente en formato base64`,
      images: savedImages.map(img => ({
        ...img.toJSON(),
        // No devolver el base64 completo en la respuesta (es muy largo)
        image_data: img.image_data ? `[BASE64 DATA - ${img.image_data.length} characters]` : null
      })),
    });
  } catch (error) {
    console.error("Error en uploadImagesBase64JSONForPublishedBook:", error);
    res.status(500).json({ error: "Error al subir imágenes en base64" });
  }
}

// Subir múltiples imágenes en formato base64
export async function uploadImagesBase64ForPublishedBook(req, res) {
  try {
    const { publishedBookId } = req.params;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No se proporcionaron archivos" });
    }

    // Verificar que el libro publicado existe y pertenece al usuario
    const publishedBook = await PublishedBooks.findByPk(publishedBookId);
    if (!publishedBook) {
      return res.status(404).json({ error: "Libro publicado no encontrado" });
    }

    if (publishedBook.user_id !== req.user.user_id) {
      return res
        .status(403)
        .json({
          error: "No tienes permisos para agregar imágenes a este libro",
        });
    }

    // Crear registros de imagen para cada archivo convertido a base64
    const imagePromises = files.map((file, index) => {
      console.log(`💾 Guardando imagen base64 en BD: ${file.originalname}`);
      return PublishedBookImage.create({
        published_book_id: publishedBookId,
        image_data: file.base64, // Datos base64 de la imagen
        image_url: null, // No hay URL externa
        image_filename: file.originalname,
        image_mimetype: file.mimetype,
        image_size: file.size,
        is_primary: index === 0, // Primera imagen es primaria por defecto
      });
    });

    const savedImages = await Promise.all(imagePromises);
    console.log(
      `✅ ${savedImages.length} imágenes base64 guardadas en BD exitosamente`
    );

    res.status(201).json({
      message: `${savedImages.length} imágenes subidas exitosamente en formato base64`,
      images: savedImages.map(img => ({
        ...img.toJSON(),
        // No devolver el base64 completo en la respuesta (es muy largo)
        image_data: img.image_data ? `[BASE64 DATA - ${img.image_data.length} characters]` : null
      })),
    });
  } catch (error) {
    console.error("Error en uploadImagesBase64ForPublishedBook:", error);
    res.status(500).json({ error: "Error al subir imágenes en base64" });
  }
}
