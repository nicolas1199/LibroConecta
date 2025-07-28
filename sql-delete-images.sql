// Script SQL para eliminar imágenes directamente de la base de datos
// Ejecutar en la consola de la base de datos o en el servidor

-- Para eliminar una imagen específica por ID
DELETE FROM PublishedBookImages WHERE published_book_image_id = 29;

-- Para eliminar múltiples imágenes por IDs
DELETE FROM PublishedBookImages WHERE published_book_image_id IN (27, 28, 29);

-- Para verificar qué imágenes existen para una publicación específica
SELECT 
    published_book_image_id,
    published_book_id,
    is_primary,
    LENGTH(image_data) as image_size,
    image_filename
FROM PublishedBookImages 
WHERE published_book_id = 44;

-- Para eliminar todas las imágenes de una publicación específica
-- DELETE FROM PublishedBookImages WHERE published_book_id = 44;
