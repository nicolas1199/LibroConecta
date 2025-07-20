-- Script para verificar y corregir la tabla PublishedBookImage
-- Ejecutar en phpPgAdmin

-- 1. Verificar la estructura actual de la tabla
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
ORDER BY ordinal_position;

-- 2. Verificar si existe la columna image_data
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
AND column_name = 'image_data';

-- 3. Si no existe image_data, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PublishedBookImage' 
        AND column_name = 'image_data'
    ) THEN
        ALTER TABLE "PublishedBookImage" 
        ADD COLUMN image_data TEXT;
        
        RAISE NOTICE 'Columna image_data agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna image_data ya existe';
    END IF;
END $$;

-- 4. Verificar si existe la columna image_filename
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
AND column_name = 'image_filename';

-- 5. Si no existe image_filename, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PublishedBookImage' 
        AND column_name = 'image_filename'
    ) THEN
        ALTER TABLE "PublishedBookImage" 
        ADD COLUMN image_filename VARCHAR(255);
        
        RAISE NOTICE 'Columna image_filename agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna image_filename ya existe';
    END IF;
END $$;

-- 6. Verificar si existe la columna image_mimetype
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
AND column_name = 'image_mimetype';

-- 7. Si no existe image_mimetype, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PublishedBookImage' 
        AND column_name = 'image_mimetype'
    ) THEN
        ALTER TABLE "PublishedBookImage" 
        ADD COLUMN image_mimetype VARCHAR(100);
        
        RAISE NOTICE 'Columna image_mimetype agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna image_mimetype ya existe';
    END IF;
END $$;

-- 8. Verificar si existe la columna image_size
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
AND column_name = 'image_size';

-- 9. Si no existe image_size, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PublishedBookImage' 
        AND column_name = 'image_size'
    ) THEN
        ALTER TABLE "PublishedBookImage" 
        ADD COLUMN image_size INTEGER;
        
        RAISE NOTICE 'Columna image_size agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna image_size ya existe';
    END IF;
END $$;

-- 10. Verificar si existe la columna is_primary
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
AND column_name = 'is_primary';

-- 11. Si no existe is_primary, agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'PublishedBookImage' 
        AND column_name = 'is_primary'
    ) THEN
        ALTER TABLE "PublishedBookImage" 
        ADD COLUMN is_primary BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Columna is_primary agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna is_primary ya existe';
    END IF;
END $$;

-- 12. Verificar la estructura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'PublishedBookImage' 
ORDER BY ordinal_position;

-- 13. Verificar restricciones de la tabla
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'PublishedBookImage';

-- 14. Verificar índices
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'PublishedBookImage';

-- 15. Verificar si hay datos en la tabla
SELECT COUNT(*) as total_images FROM "PublishedBookImage";

-- 16. Mostrar algunos registros de ejemplo (sin mostrar el base64 completo)
SELECT 
    published_book_image_id,
    published_book_id,
    CASE 
        WHEN image_data IS NOT NULL THEN 
            'BASE64_DATA_' || LENGTH(image_data) || '_chars'
        ELSE 'NULL'
    END as image_data_info,
    image_url,
    image_filename,
    image_mimetype,
    image_size,
    is_primary
FROM "PublishedBookImage" 
LIMIT 5; 