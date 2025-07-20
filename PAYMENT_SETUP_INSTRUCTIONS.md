# 🔧 Configuración de MercadoPago - Instrucciones para el Servidor

## 🚨 Problema Actual
El error 500 al intentar crear una preferencia de pago se debe a que las variables de entorno de MercadoPago no están configuradas en el servidor.

## 📋 Variables de Entorno Requeridas

### 1. **Variables de MercadoPago**
```bash
# Token de acceso de MercadoPago (obligatorio)
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxx

# Clave pública de MercadoPago (para el frontend)
MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxxx

# ID del cliente de MercadoPago
MP_CLIENT_ID=xxxxxxxxxxxxx

# Secreto del cliente de MercadoPago
MP_CLIENT_SECRET=xxxxxxxxxxxxx

# Secreto del webhook (opcional)
MP_WEBHOOK_SECRET=xxxxxxxxxxxxx
```

### 2. **URLs de la Aplicación**
```bash
# URL del frontend
FRONTEND_URL=http://146.83.198.35:1235

# URL del backend
BACKEND_URL=http://146.83.198.35:1234
```

### 3. **Configuración del Servidor**
```bash
# Puerto del servidor backend
PORT=1234

# Origen permitido para CORS
CORS_ORIGIN=http://146.83.198.35:1235
```

## 🔑 Cómo Obtener las Credenciales de MercadoPago

### 1. **Crear Cuenta de MercadoPago**
- Ve a [MercadoPago Developers](https://www.mercadopago.cl/developers)
- Crea una cuenta de desarrollador

### 2. **Obtener Credenciales de Prueba**
- Ve a la sección "Credenciales"
- Copia las credenciales de **Sandbox/Test**
- **Access Token**: `TEST-xxxxxxxxxxxxxxxxxxxxx`
- **Public Key**: `TEST-xxxxxxxxxxxxxxxxxxxxx`

### 3. **Configurar Webhook (Opcional)**
- Ve a la sección "Webhooks"
- Agrega la URL: `http://146.83.198.35:1234/api/payments/webhook`

## 🛠️ Pasos para Configurar en el Servidor

### 1. **Acceder al Servidor**
```bash
# Conectar al servidor donde está el backend
ssh usuario@146.83.198.35
```

### 2. **Editar Variables de Entorno**
```bash
# Navegar al directorio del backend
cd /ruta/al/backend

# Editar el archivo .env
nano .env
```

### 3. **Agregar las Variables**
```bash
# MercadoPago
MP_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxx
MP_PUBLIC_KEY=TEST-xxxxxxxxxxxxxxxxxxxxx
MP_CLIENT_ID=xxxxxxxxxxxxx
MP_CLIENT_SECRET=xxxxxxxxxxxxx

# URLs
FRONTEND_URL=http://146.83.198.35:1235
BACKEND_URL=http://146.83.198.35:1234

# Servidor
PORT=1234
CORS_ORIGIN=http://146.83.198.35:1235
```

### 4. **Reiniciar el Servidor**
```bash
# Detener el proceso actual
pm2 stop libroconecta-backend

# Reiniciar con las nuevas variables
pm2 start libroconecta-backend

# Verificar logs
pm2 logs libroconecta-backend
```

## 🔍 Verificación

### 1. **Verificar Variables de Entorno**
```bash
# En el servidor, verificar que las variables estén cargadas
echo $MP_ACCESS_TOKEN
```

### 2. **Probar Endpoint**
```bash
# Hacer una petición de prueba
curl -X POST http://146.83.198.35:1234/api/payments/preferences/11 \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "Content-Type: application/json"
```

### 3. **Revisar Logs**
```bash
# Ver logs del servidor
pm2 logs libroconecta-backend --lines 50
```

## 🚨 Errores Comunes y Soluciones

### **Error: "MP_ACCESS_TOKEN no configurado"**
- **Solución**: Agregar `MP_ACCESS_TOKEN` al archivo `.env`

### **Error: "Error al procesar el pago"**
- **Solución**: Verificar que las credenciales de MercadoPago sean válidas

### **Error: "Connection refused"**
- **Solución**: Verificar que el servidor esté ejecutándose en el puerto 1234

### **Error: "CORS error"**
- **Solución**: Verificar que `CORS_ORIGIN` esté configurado correctamente

## 📞 Contacto
Si necesitas ayuda para obtener las credenciales de MercadoPago o configurar el servidor, contacta al administrador del sistema.

---

**Nota**: Estas son credenciales de prueba. Para producción, necesitarás credenciales reales de MercadoPago. 