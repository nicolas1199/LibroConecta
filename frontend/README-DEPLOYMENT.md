# Guía de Despliegue - LibroConecta Frontend

Este proyecto es una Single Page Application (SPA) que requiere configuración especial del servidor para manejar el routing del lado del cliente.

## 🚀 Opciones de Despliegue

### 1. **Apache Server**
Copiar el archivo `.htaccess` al directorio raíz:
```bash
npm run build
# El archivo .htaccess se copia automáticamente a dist/
# Subir todo el contenido de dist/ al servidor Apache
```

### 2. **Nginx Server**
Usar la configuración en `nginx.conf`:
```bash
npm run build
# Copiar nginx.conf a /etc/nginx/sites-available/
# Actualizar la ruta root en nginx.conf
# Reiniciar nginx
```

### 3. **Node.js/Express Server**
```bash
npm install express
npm run build
npm run serve
# O en producción: pm2 start server.js
```

### 4. **Netlify**
El archivo `_redirects` maneja automáticamente el routing:
```bash
npm run build
# Subir la carpeta dist/ a Netlify
```

### 5. **Vercel**
Crear `vercel.json` en la raíz:
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## 🔧 Configuración de URLs

- **Desarrollo**: `http://localhost:1235`
- **Producción**: Actualizar las URLs en `src/api/api.js`

## ⚠️ Problemas Comunes

### Error 404 al recargar
- **Causa**: El servidor no está configurado para SPAs
- **Solución**: Usar una de las configuraciones de arriba

### CORS Errors
- **Causa**: Backend y frontend en dominios diferentes
- **Solución**: Configurar CORS en el backend

### Rutas no funcionan
- **Causa**: Archivos de configuración no copiados
- **Solución**: Verificar que `.htaccess` o `_redirects` estén en dist/

## 📝 Variables de Entorno

Crear `.env.production` para producción:
```env
VITE_API_URL=https://tu-backend.com/api
VITE_APP_URL=https://tu-frontend.com
``` 