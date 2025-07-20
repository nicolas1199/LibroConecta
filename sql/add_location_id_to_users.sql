-- Migración para agregar location_id a la tabla Users
-- Ejecutar este script en la base de datos

-- Agregar la columna location_id a la tabla Users
ALTER TABLE Users 
ADD COLUMN location_id INT NULL;

-- Agregar la clave foránea que referencia a LocationBooks
ALTER TABLE Users 
ADD CONSTRAINT fk_users_location_id 
FOREIGN KEY (location_id) REFERENCES LocationBooks(location_id);

-- Opcional: Actualizar registros existentes que tengan location como texto
-- para mapearlos a location_id basado en el nombre de la comuna
UPDATE Users 
SET location_id = (
    SELECT lb.location_id 
    FROM LocationBooks lb 
    WHERE lb.comuna = Users.location 
    LIMIT 1
) 
WHERE Users.location IS NOT NULL 
AND Users.location != '';

-- Verificar que los datos se actualizaron correctamente
SELECT u.user_id, u.first_name, u.location, u.location_id, lb.comuna, lb.region
FROM Users u
LEFT JOIN LocationBooks lb ON u.location_id = lb.location_id
WHERE u.location_id IS NOT NULL;
