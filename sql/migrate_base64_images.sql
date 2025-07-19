-- Migración para soporte de imágenes Base64 - PostgreSQL
-- Agregar campos para almacenamiento de imágenes como base64
-- EJECUTAR ESTE ARCHIVO EN TU BASE DE DATOS ANTES DE USAR LA FUNCIONALIDAD

-- 1. Agregar campo para datos base64 de la imagen
ALTER TABLE "PublishedBookImage" 
ADD COLUMN image_data TEXT;

COMMENT ON COLUMN "PublishedBookImage".image_data IS 'Imagen codificada en base64';

-- 2. Modificar image_url para ser opcional (permitir NULL)
ALTER TABLE "PublishedBookImage" 
ALTER COLUMN image_url DROP NOT NULL;

COMMENT ON COLUMN "PublishedBookImage".image_url IS 'URL de imagen externa (opcional para compatibilidad)';

-- 3. Agregar metadatos adicionales de la imagen
ALTER TABLE "PublishedBookImage" 
ADD COLUMN image_filename VARCHAR(255),
ADD COLUMN image_mimetype VARCHAR(100),
ADD COLUMN image_size INTEGER;

COMMENT ON COLUMN "PublishedBookImage".image_filename IS 'Nombre original del archivo';
COMMENT ON COLUMN "PublishedBookImage".image_mimetype IS 'Tipo MIME de la imagen (image/jpeg, image/png, etc.)';
COMMENT ON COLUMN "PublishedBookImage".image_size IS 'Tamaño del archivo en bytes';

-- 4. Agregar índice para mejor rendimiento en consultas
CREATE INDEX IF NOT EXISTS idx_published_book_images_book_primary 
ON "PublishedBookImage"(published_book_id, is_primary);

-- 5. Verificar la estructura actualizada (PostgreSQL)
\d "PublishedBookImage";

-- Notas de migración:
-- - Todas las imágenes existentes seguirán funcionando (image_url)
-- - Las nuevas imágenes pueden usar image_data (base64) o image_url
-- - El sistema detecta automáticamente qué tipo de imagen mostrar
-- - Es recomendable hacer backup antes de ejecutar esta migración

-- Para verificar que la migración fue exitosa, ejecuta:
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage'
ORDER BY ordinal_position;

-- INSTRUCCIONES PARA EJECUTAR ESTA MIGRACIÓN:
--
-- Opción 1: Usando psql (si tienes acceso directo)
-- psql -h tu_host -U tu_usuario -d tu_base_datos -f sql/migrate_base64_images.sql
--
-- Opción 2: Desde pgAdmin o cualquier cliente PostgreSQL
-- Copia y pega todo este contenido en una nueva query y ejecútalo
--
-- Opción 3: Usando Node.js (crear script temporal)
-- Crea un archivo migrate.js en la raíz del backend y ejecútalo 