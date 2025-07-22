-- Migración para agregar soporte de imágenes base64 en mensajes
-- Ejecutar en PostgreSQL

-- Agregar columna para tipo de mensaje
ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(10) DEFAULT 'text' CHECK (message_type IN ('text', 'image'));

-- Agregar columnas para datos de imagen base64 (igual que PublishedBookImage)
ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS image_data TEXT;

ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS image_filename VARCHAR(255);

ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS image_mimetype VARCHAR(100);

ALTER TABLE "Message" 
ADD COLUMN IF NOT EXISTS image_size INTEGER;

-- Hacer que message_text pueda ser null (para cuando solo se envía imagen)
ALTER TABLE "Message" 
ALTER COLUMN message_text DROP NOT NULL;

-- Agregar constraint para validar que al menos uno de los dos campos esté presente
ALTER TABLE "Message"
ADD CONSTRAINT check_message_content 
CHECK (
  (message_type = 'text' AND message_text IS NOT NULL AND TRIM(message_text) != '') OR
  (message_type = 'image' AND image_data IS NOT NULL AND TRIM(image_data) != '')
);

-- Comentarios
COMMENT ON COLUMN "Message".message_type IS 'Tipo de mensaje: text o image';
COMMENT ON COLUMN "Message".image_data IS 'Imagen codificada en base64 (data:image/type;base64,...)';
COMMENT ON COLUMN "Message".image_filename IS 'Nombre original del archivo de imagen';
COMMENT ON COLUMN "Message".image_mimetype IS 'Tipo MIME de la imagen';
COMMENT ON COLUMN "Message".image_size IS 'Tamaño del archivo en bytes';
