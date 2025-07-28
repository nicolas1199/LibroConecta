-- =====================================================
-- MIGRACIÓN: REMOVER SUPER_LIKE DEL SISTEMA
-- =====================================================
-- Este script elimina todas las referencias a super_like
-- Ejecutar SOLO si ya tienes la tabla creada con super_like

-- ====================================
-- 1. VERIFICAR DATOS EXISTENTES
-- ====================================

-- Ver si hay interacciones super_like existentes
SELECT interaction_type, COUNT(*) 
FROM "UserPublishedBookInteractions" 
GROUP BY interaction_type;

-- ====================================
-- 2. MIGRAR DATOS (SI ES NECESARIO)
-- ====================================

-- Opción A: Convertir super_like a like
-- UPDATE "UserPublishedBookInteractions" 
-- SET interaction_type = 'like' 
-- WHERE interaction_type = 'super_like';

-- Opción B: Eliminar super_like (más drástico)
-- DELETE FROM "UserPublishedBookInteractions" 
-- WHERE interaction_type = 'super_like';

-- ====================================
-- 3. ACTUALIZAR EL ENUM
-- ====================================

-- Crear el nuevo tipo sin super_like
CREATE TYPE interaction_type_new AS ENUM ('like', 'dislike');

-- Actualizar la columna para usar el nuevo tipo
ALTER TABLE "UserPublishedBookInteractions" 
ALTER COLUMN interaction_type TYPE interaction_type_new 
USING interaction_type::text::interaction_type_new;

-- Eliminar el tipo antiguo
DROP TYPE IF EXISTS interaction_type_old;

-- ====================================
-- 4. VERIFICAR RESULTADO
-- ====================================

-- Verificar que solo quedan like y dislike
SELECT DISTINCT interaction_type 
FROM "UserPublishedBookInteractions";

-- Verificar estructura de la tabla
\d "UserPublishedBookInteractions"

-- ====================================
-- NOTAS IMPORTANTES
-- ====================================

/*
ANTES DE EJECUTAR:
1. Haz backup de tu base de datos
2. Decide qué hacer con super_likes existentes:
   - Convertir a 'like' (recomendado)
   - Eliminarlos (más drástico)
3. Ejecuta paso a paso, no todo junto

ORDEN DE EJECUCIÓN:
1. Verificar datos existentes
2. Migrar/eliminar super_likes
3. Actualizar el ENUM
4. Verificar resultado

ROLLBACK (si algo sale mal):
- Restaurar desde backup
- O recrear tabla con super_like y reimportar datos
*/
