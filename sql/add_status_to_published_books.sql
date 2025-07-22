-- Migración: Añadir campo status a PublishedBooks
-- Fecha: 2025-07-21
-- Descripción: Añade campo para controlar la disponibilidad de libros

-- Añadir columna status
ALTER TABLE PublishedBooks 
ADD COLUMN status ENUM('available', 'sold', 'reserved', 'inactive') 
DEFAULT 'available' 
NOT NULL 
COMMENT 'Estado de la publicación: available, sold, reserved, inactive';

-- Actualizar libros existentes como disponibles
UPDATE PublishedBooks 
SET status = 'available' 
WHERE status IS NULL;

-- Verificar la migración
SELECT 
    published_book_id,
    status,
    date_published
FROM PublishedBooks 
LIMIT 10;
