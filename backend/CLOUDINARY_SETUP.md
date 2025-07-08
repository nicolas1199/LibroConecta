# Configuración de Cloudinary

## ¿Qué es Cloudinary?
Cloudinary es un servicio de gestión de imágenes en la nube que maneja automáticamente:
- Subida de imágenes
- Optimización automática
- Redimensionamiento dinámico
- CDN global
- Transformaciones avanzadas

## Configuración

### 1. Crear cuenta en Cloudinary
1. Ve a [https://cloudinary.com/](https://cloudinary.com/)
2. Crea una cuenta gratuita
3. Obtén tus credenciales del Dashboard

### 2. Configurar variables de entorno
Agrega estas variables a tu archivo `.env`:

```bash
# Configuración de Cloudinary
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

### 3. Ejemplo de configuración
```bash
# Ejemplo real (usar tus propias credenciales)
CLOUDINARY_CLOUD_NAME=libroconecta
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456
```

### 4. Verificar configuración
Usa el endpoint de prueba para verificar la configuración:
```bash
GET /api/published-book-images/test-cloudinary
```

## Beneficios

### ✅ Ventajas sobre el sistema local:
- **Sin espacio en servidor**: Las imágenes se almacenan en la nube
- **Optimización automática**: Compresión y formatos modernos (WebP)
- **CDN global**: Carga rápida desde cualquier ubicación
- **Redimensionamiento dinámico**: Múltiples tamaños sin almacenamiento extra
- **Backup automático**: No se pierden imágenes
- **Escalabilidad**: Maneja millones de imágenes

### 📊 Plan gratuito:
- 25 GB de almacenamiento
- 25 GB de ancho de banda mensual
- Todas las características principales
- Más que suficiente para comenzar

## Estructura de imágenes
Las imágenes se organizan en:
```
libroconecta/
  books/
    book_1704123456789_abc123.jpg
    book_1704123456790_def456.jpg
```

## URLs de ejemplo
```
https://res.cloudinary.com/tu_cloud_name/image/upload/v1704123456/libroconecta/books/book_1704123456789_abc123.jpg
```

## Transformaciones automáticas
- Tamaño máximo: 800x600px
- Calidad: Automática
- Formato: Automático (WebP si es compatible)

## Eliminación de imágenes
El sistema incluye funciones para eliminar imágenes de Cloudinary cuando se borran libros.

## Fallback
Si Cloudinary no está configurado, el sistema detectará automáticamente y mostrará un mensaje de error claro. 