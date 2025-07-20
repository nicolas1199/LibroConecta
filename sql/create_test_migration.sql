-- Migración para corregir problema con múltiples imágenes base64
-- EJECUTAR ESTE SCRIPT SI TIENES PROBLEMAS CON IMÁGENES MÚLTIPLES

-- 1. Permitir que image_data sea NULL (para compatibilidad con Cloudinary)
ALTER TABLE "PublishedBookImage" 
ALTER COLUMN image_data DROP NOT NULL;

-- 2. Agregar comentarios para claridad
COMMENT ON COLUMN "PublishedBookImage".image_data IS 'Imagen codificada en base64 (opcional - usar image_url para Cloudinary)';
COMMENT ON COLUMN "PublishedBookImage".image_url IS 'URL de imagen externa como Cloudinary (opcional - usar image_data para base64)';

-- 3. Verificar que al menos uno de los dos campos tenga datos (constraint check)
ALTER TABLE "PublishedBookImage" 
ADD CONSTRAINT check_image_data_or_url CHECK (
  (image_data IS NOT NULL AND image_data != '') OR 
  (image_url IS NOT NULL AND image_url != '')
);

-- 4. Crear índices para mejor performance
CREATE INDEX IF NOT EXISTS idx_published_book_images_published_book 
ON "PublishedBookImage"(published_book_id);

CREATE INDEX IF NOT EXISTS idx_published_book_images_primary 
ON "PublishedBookImage"(published_book_id, is_primary) 
WHERE is_primary = true;

-- 5. Verificar la estructura actualizada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage'
ORDER BY ordinal_position;

-- NOTAS:
-- - Después de ejecutar esto, debería funcionar la subida de múltiples imágenes
-- - El constraint check_image_data_or_url asegura que siempre haya al menos una imagen
-- - Los índices mejoran la performance de las consultas
-- - Si ya tienes datos, este script es seguro de ejecutar 