-- =====================================================
-- CAMBIOS EN LA BASE DE DATOS PARA AUTO-MATCH SYSTEM
-- =====================================================
-- Estos son los cambios que implementé en los modelos Sequelize
-- Necesitas aplicar estos cambios a tu base de datos existente

-- ====================================
-- 1. TABLA NUEVA: UserPublishedBookInteractions
-- ====================================
-- Esta tabla NO existía antes - ES COMPLETAMENTE NUEVA
-- Almacena todas las interacciones de swipe (like/dislike)

CREATE TABLE IF NOT EXISTS "UserPublishedBookInteractions" (
    interaction_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    published_book_id INTEGER NOT NULL,
    interaction_type VARCHAR(20) NOT NULL CHECK (interaction_type IN ('like', 'dislike')),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign keys
    CONSTRAINT fk_user_interaction 
        FOREIGN KEY (user_id) REFERENCES "Users"(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_published_book_interaction 
        FOREIGN KEY (published_book_id) REFERENCES "PublishedBooks"(published_book_id) ON DELETE CASCADE,
    
    -- Índices para optimizar consultas
    CONSTRAINT unique_user_book_interaction 
        UNIQUE (user_id, published_book_id)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_user_interactions ON "UserPublishedBookInteractions"(user_id);
CREATE INDEX IF NOT EXISTS idx_book_interactions ON "UserPublishedBookInteractions"(published_book_id);
CREATE INDEX IF NOT EXISTS idx_interaction_type ON "UserPublishedBookInteractions"(interaction_type);

-- ====================================
-- 2. MODIFICACIONES A LA TABLA Match
-- ====================================
-- La tabla Match YA EXISTÍA, pero agregué nuevas columnas

-- Agregar nuevas columnas a la tabla Match existente
-- Ejecutar paso a paso:

-- 1. Agregar columna match_type
ALTER TABLE "Match" ADD COLUMN match_type VARCHAR(20);

-- 2. Establecer valor por defecto para registros existentes  
UPDATE "Match" SET match_type = 'manual' WHERE match_type IS NULL;

-- 3. Agregar columna triggered_by_books
ALTER TABLE "Match" ADD COLUMN triggered_by_books TEXT;

-- Agregar comentarios para documentar las columnas
COMMENT ON COLUMN "Match".match_type IS 'Tipo de match: manual (creado por usuario) o automatic (por likes mutuos)';
COMMENT ON COLUMN "Match".triggered_by_books IS 'Información de los libros que generaron el match automático';

-- ====================================
-- 3. VERIFICAR ESTRUCTURA ACTUAL
-- ====================================
-- Estos queries te ayudan a verificar el estado actual de tu BD

-- Verificar si la tabla UserPublishedBookInteractions existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'UserPublishedBookInteractions';

-- Verificar estructura de la tabla Match
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Match' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- ====================================
-- 4. DATOS DE PRUEBA (OPCIONAL)
-- ====================================
-- Si quieres probar el sistema con datos de ejemplo

-- Insertar algunas interacciones de prueba
-- INSERT INTO "UserPublishedBookInteractions" (user_id, published_book_id, interaction_type)
-- VALUES 
--   ('user-uuid-1', 1, 'like'),
--   ('user-uuid-2', 2, 'like'),
--   ('user-uuid-1', 3, 'dislike');

-- ====================================
-- 5. ROLLBACK (SI NECESITAS DESHACER)
-- ====================================
-- En caso de que necesites revertir los cambios

-- DROP TABLE IF EXISTS "UserPublishedBookInteractions";
-- ALTER TABLE "Match" DROP COLUMN IF EXISTS match_type;
-- ALTER TABLE "Match" DROP COLUMN IF EXISTS triggered_by_books;

-- ====================================
-- RESUMEN DE CAMBIOS POR TABLA
-- ====================================

/*
TABLA NUEVA:
- UserPublishedBookInteractions (completa)

TABLA MODIFICADA: 
- Match:
  * Agregada: match_type (enum: manual/automatic)
  * Agregada: triggered_by_books (JSON)

NOTAS IMPORTANTES:
1. La tabla UserPublishedBookInteractions es completamente nueva
2. Los campos user_id_1_book_id y user_2_book_id que aparecían en errores de consola NO EXISTEN en el modelo - eran referencias incorrectas
3. El sistema de auto-match funciona comparando las interacciones entre usuarios, no libros específicos en el match
4. El campo triggered_by_books guarda información contextual sobre qué libros causaron el match
5. Solo se manejan interacciones 'like' y 'dislike' - NO hay super_like implementado
*/
