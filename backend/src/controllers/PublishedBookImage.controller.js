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

    res.json(images);
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
        .json({ error: "No tienes permisos para eliminar esta imagen" });
    }

    await image.destroy();
    res.json({ message: "Imagen eliminada correctamente" });
  } catch (error) {
    console.error("Error en deletePublishedBookImage:", error);
    res.status(500).json({ error: "Error al eliminar imagen" });
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
