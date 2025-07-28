# 🚀 Guía de Configuración MercadoPago - LibroConecta

## ✅ Implementación Actualizada

La implementación ha sido actualizada siguiendo las mejores prácticas y la referencia oficial de MercadoPago.

### 🔧 Cambios Realizados

#### 1. Estructura de Preferencias Simplificada
```javascript
const preferenceData = {
  items: [{
    id: publishedBookId.toString(),
    title: publishedBook.Book.title,
    description: `${publishedBook.Book.title} por ${publishedBook.Book.author}`,
    quantity: 1,
    currency_id: 'CLP',
    unit_price: parseFloat(publishedBook.price)
  }],
  external_reference: externalReference,
  notification_url: `${BACKEND_URL}/api/payments/webhook`,
  back_urls: {
    success: `${FRONTEND_URL}/payment/success`,
    failure: `${FRONTEND_URL}/payment/failure`,
    pending: `${FRONTEND_URL}/payment/pending`
  },
  payer: {
    name: buyerUser.first_name || buyerUser.username || 'Comprador',
    surname: buyerUser.last_name || 'LibroConecta',
    email: buyerUser.email
  },
  expires: true,
  expiration_date_from: new Date().toISOString(),
  expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  statement_descriptor: 'LIBROCONECTA'
};
```

#### 2. Auto-Return Deshabilitado
- ❌ **Antes**: `auto_return: "approved"` - Redirigía automáticamente
- ✅ **Ahora**: Sin auto-return - Usuario hace clic manual en "Volver a tu sitio"

#### 3. Webhook Mejorado
```javascript
export async function handlePaymentWebhook(req, res) {
  // Respuesta inmediata con 200
  res.status(200).send('OK');
  
  // Procesar notificación de forma asíncrona
  const paymentId = data?.id || id;
  const notificationType = type || topic;
  
  if (notificationType === 'payment' && paymentId) {
    // Obtener datos de MercadoPago y actualizar BD
  }
}
```

#### 4. Verificación Activa del Estado
- El endpoint `getPaymentStatus` ahora verifica directamente con MercadoPago si el pago está pendiente
- Actualiza automáticamente el estado en la base de datos

## 🔧 Variables de Entorno Requeridas

### Backend (.env)
```env
# MercadoPago
MP_ACCESS_TOKEN=APP_USR-tu_access_token_aqui
MP_PUBLIC_KEY=APP_USR-tu_public_key_aqui

# URLs de la aplicación
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
```

### Frontend (.env.local)
```env
VITE_MP_PUBLIC_KEY=APP_USR-tu_public_key_aqui
VITE_API_URL=http://localhost:3000/api
```

## 🎯 Flujo de Pago Actualizado

### 1. Crear Preferencia
```bash
POST /api/payments/preferences/:publishedBookId
Authorization: Bearer <token>
```

### 2. Usuario Paga en MercadoPago
- Usuario es redirigido a `init_point`
- Completa el pago en el sandbox
- **IMPORTANTE**: Usuario debe hacer clic en "Volver a tu sitio web"

### 3. Datos Recibidos en Back URLs
```
${FRONTEND_URL}/payment/success?collection_id=123&collection_status=approved&payment_id=456&status=approved&external_reference=LIBRO_123_456_789&preference_id=pref_xyz
```

### 4. Webhook Automático
```bash
POST ${BACKEND_URL}/api/payments/webhook
{
  "type": "payment",
  "data": {
    "id": "payment_id_from_mp"
  }
}
```

## 🧪 Testing

### 1. Credenciales de Prueba
Usa las credenciales de test de tu cuenta MercadoPago Developers.

### 2. Tarjetas de Prueba
```
VISA APROBADA: 4509 9535 6623 3704
CVV: 123
Fecha: 11/25
Nombre: APRO (cualquier nombre)

VISA RECHAZADA: 4013 5406 8274 6260
CVV: 123
Fecha: 11/25
Nombre: OTHE (rechazo general)
```

### 3. Usuarios de Prueba
Crear usuarios test en: https://www.mercadopago.com/developers/panel/test-users

## 📋 Endpoints Disponibles

### Crear Preferencia
```bash
POST /api/payments/preferences/:publishedBookId
```

### Webhook (POST y GET)
```bash
POST /api/payments/webhook
GET /api/payments/webhook
```

### Estado del Pago
```bash
GET /api/payments/:paymentId/status
```

### Historial
```bash
GET /api/payments/user/purchases
GET /api/payments/user/sales
```

## 🔍 Debugging

### 1. Logs del Backend
Los logs mostrarán:
- ✅ Creación de preferencias
- 🔔 Webhooks recibidos
- 💳 Estados de pago actualizados

### 2. Frontend Debug
- Página `/payment/debug` disponible en desarrollo
- Muestra todos los parámetros recibidos de MercadoPago

### 3. Verificar URLs
Asegúrate que las URLs en las variables de entorno sean accesibles:
- `BACKEND_URL` debe ser accesible por MercadoPago (webhook)
- `FRONTEND_URL` debe ser accesible por el navegador del usuario

## ⚠️ Importantes

1. **Sin Auto-Return**: El usuario debe hacer clic manualmente en "Volver a tu sitio web"
2. **Webhook Necesario**: El webhook es crítico para actualizar el estado del pago
3. **URLs Públicas**: Para producción, tanto backend como frontend deben tener URLs públicas
4. **HTTPS**: En producción, usar HTTPS para el webhook

## 🚀 Para Producción

1. Cambiar a credenciales reales de MercadoPago
2. Configurar URLs de producción
3. Habilitar HTTPS para el webhook
4. Configurar dominio público para el backend

¡La implementación está lista para usar! 🎉