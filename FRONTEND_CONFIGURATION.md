# 🔧 Configuración del Frontend - Variables de Entorno

## 🚨 Problema Actual
El error "Type of public_key must be string. Received undefined" indica que la variable de entorno `VITE_MP_PUBLIC_KEY` no está configurada en el frontend.

## 📋 Variables de Entorno Requeridas

### 1. **Crear archivo `.env` en el directorio `frontend/`**

```bash
# Variables de entorno para el frontend
# Copia este archivo como .env y configura los valores

# URL de la API del backend
VITE_API_URL=http://146.83.198.35:1234/api

# Clave pública de MercadoPago (para el frontend)
VITE_MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxxx

# URL del frontend (para redirecciones)
VITE_FRONTEND_URL=http://146.83.198.35:1235
```

### 2. **Obtener la Clave Pública de MercadoPago**

1. Ve a [MercadoPago Developers](https://www.mercadopago.cl/developers)
2. Inicia sesión en tu cuenta
3. Ve a la sección "Credenciales"
4. Copia la **Public Key** de Sandbox/Test
5. Reemplaza `TEST-xxxxxxxxxxxxxxxxxxxxx` con tu clave real

## 🛠️ Pasos para Configurar

### **Paso 1: Crear archivo .env**
```bash
# En el servidor, navegar al directorio del frontend
cd /ruta/al/frontend

# Crear archivo .env
nano .env
```

### **Paso 2: Agregar las variables**
```bash
VITE_API_URL=http://146.83.198.35:1234/api
VITE_MP_PUBLIC_KEY=TEST-tu_clave_publica_aqui
VITE_FRONTEND_URL=http://146.83.198.35:1235
```

### **Paso 3: Reiniciar el servidor frontend**
```bash
# Detener el proceso actual
pm2 stop libroconecta-frontend

# Reiniciar con las nuevas variables
pm2 start libroconecta-frontend

# Verificar logs
pm2 logs libroconecta-frontend
```

## 🔍 Verificación

### **1. Verificar Variables de Entorno**
En el navegador, abre la consola y ejecuta:
```javascript
console.log('VITE_MP_PUBLIC_KEY:', import.meta.env.VITE_MP_PUBLIC_KEY);
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
```

### **2. Probar el Botón de Pago**
- Ve a un libro que no sea tuyo
- Haz clic en "Comprar"
- Debería cargar MercadoPago sin errores

## 🚨 Errores Comunes y Soluciones

### **Error: "Type of public_key must be string. Received undefined"**
- **Solución**: Verificar que `VITE_MP_PUBLIC_KEY` esté configurada en el archivo `.env`

### **Error: "VITE_API_URL is not defined"**
- **Solución**: Verificar que `VITE_API_URL` esté configurada correctamente

### **Error: "Cannot read properties of undefined"**
- **Solución**: Reiniciar el servidor frontend después de cambiar las variables

## 📞 Contacto
Si necesitas ayuda para obtener las credenciales de MercadoPago o configurar el frontend, contacta al administrador del sistema.

---

**Nota**: Las variables que empiezan con `VITE_` son accesibles en el frontend. Las variables sin este prefijo solo están disponibles en el servidor. 