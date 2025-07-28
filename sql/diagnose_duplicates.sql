-- =====================================================
-- DIAGNÓSTICO DE DUPLICADOS EN RECOMENDACIONES
-- =====================================================
-- Ejecuta estos queries para investigar el problema de libros duplicados

-- ====================================
-- 1. VERIFICAR DUPLICADOS EN PUBLISHED BOOKS
-- ====================================

-- Buscar registros duplicados por published_book_id
SELECT published_book_id, COUNT(*) as count
FROM "PublishedBooks"
GROUP BY published_book_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Verificar si hay NULLs en published_book_id
SELECT COUNT(*) as total_books,
       COUNT(published_book_id) as books_with_id,
       COUNT(*) - COUNT(published_book_id) as books_without_id
FROM "PublishedBooks";

-- ====================================
-- 2. VERIFICAR ESTRUCTURA DE LA TABLA
-- ====================================

-- Ver la estructura de PublishedBooks
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'PublishedBooks' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar constraints y índices
SELECT conname, contype, conkey, confkey
FROM pg_constraint 
WHERE conrelid = 'PublishedBooks'::regclass;

-- ====================================
-- 3. VERIFICAR DATOS PROBLEMÁTICOS
-- ====================================

-- Libros con información incompleta
SELECT published_book_id, user_id, date_published, 
       CASE WHEN user_id IS NULL THEN 'NULL user_id' ELSE 'OK' END as user_status,
       CASE WHEN date_published IS NULL THEN 'NULL date' ELSE 'OK' END as date_status
FROM "PublishedBooks"
WHERE user_id IS NULL OR date_published IS NULL
LIMIT 10;

-- Verificar si hay libros del mismo usuario con datos duplicados
SELECT user_id, COUNT(*) as total_books,
       COUNT(DISTINCT published_book_id) as unique_books
FROM "PublishedBooks"
GROUP BY user_id
HAVING COUNT(*) != COUNT(DISTINCT published_book_id)
ORDER BY total_books DESC;

-- ====================================
-- 4. SIMULAR LA CONSULTA DE RECOMENDACIONES
-- ====================================

-- Consulta similar a la del backend (ajustar user_id)
SELECT pb.published_book_id, pb.user_id, pb.date_published, 
       b.title, u.first_name, u.last_name
FROM "PublishedBooks" pb
LEFT JOIN "Books" b ON pb.book_id = b.book_id
LEFT JOIN "Users" u ON pb.user_id = u.user_id
WHERE pb.user_id != 'USER_ID_AQUI'  -- Reemplazar con un user_id real
ORDER BY pb.date_published DESC, RANDOM()
LIMIT 20;

-- ====================================
-- 5. VERIFICAR JOINS PROBLEMÁTICOS
-- ====================================

-- Verificar si los JOINs están causando duplicados
SELECT pb.published_book_id, 
       COUNT(*) as join_count,
       COUNT(DISTINCT pbi.image_id) as image_count,
       COUNT(DISTINCT c.category_id) as category_count
FROM "PublishedBooks" pb
LEFT JOIN "PublishedBookImages" pbi ON pb.published_book_id = pbi.published_book_id
LEFT JOIN "Books" b ON pb.book_id = b.book_id
LEFT JOIN "BookCategories" bc ON b.book_id = bc.book_id
LEFT JOIN "Category" c ON bc.category_id = c.category_id
GROUP BY pb.published_book_id
HAVING COUNT(*) > 1
ORDER BY join_count DESC
LIMIT 10;

-- ====================================
-- SOLUCIONES SUGERIDAS
-- ====================================

/*
POSIBLES CAUSAS DE DUPLICADOS:

1. JOINS PROBLEMÁTICOS:
   - LEFT JOIN con múltiples imágenes por libro
   - LEFT JOIN con múltiples categorías por libro
   - Esto causa que cada libro aparezca múltiples veces

2. DATOS DUPLICADOS:
   - Registros realmente duplicados en PublishedBooks
   - NULLs en campos importantes

3. QUERY SEQUELIZE:
   - Falta DISTINCT
   - Falta GROUP BY published_book_id

SOLUCIONES:

1. Usar DISTINCT en la consulta
2. Filtrar duplicados en código (ya implementado)
3. Revisar estructura de joins
4. Limpiar datos duplicados si existen
*/
