# 🚀 Implementación Completa de MercadoPago en LibroConecta

## 📁 Archivos Modificados/Creados

### Backend (`/backend/`)
- ✅ `src/controllers/Payment.controller.js` - Agregada función `processDirectPayment()`
- ✅ `src/routes/Payment.routes.js` - Nueva ruta `POST /api/payments/process`
- ✅ `.env` - Credenciales de MercadoPago configuradas

### Frontend (`/frontend/`)
- ✅ `src/services/paymentService.js` - Servicio completo para MercadoPago
- ✅ `src/components/PaymentComponent.jsx` - Componente de pago
- ✅ `src/hooks/usePayment.js` - Hook personalizado para pagos
- ✅ `.env.example` - Ejemplo de variables de entorno

## 🔧 Configuración Requerida

### 1. Variables de Entorno del Backend

Actualiza tu archivo `backend/.env` con tus credenciales reales de MercadoPago:

```env
# MercadoPago Credentials (reemplaza con tus credenciales reales)
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXX-XXXXXX-XXXXXX
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXX-XXXXXX-XXXXXX
MP_CLIENT_ID=XXXXXXXXXX
MP_CLIENT_SECRET=XXXXXXXXXX
MP_WEBHOOK_SECRET=tu_webhook_secret
```

### 2. Variables de Entorno del Frontend

Crea el archivo `frontend/.env.local` basado en `.env.example`:

```env
VITE_API_URL=http://localhost:3000
VITE_MP_PUBLIC_KEY=APP_USR-XXXXXXXXXX-XXXXXX-XXXXXX
```

### 3. Instalación de Dependencias

Las dependencias ya están instaladas, pero verifica:

```bash
# Backend
cd backend
npm install mercadopago uuid

# Frontend (no requiere instalación adicional)
```

## 🔗 Nuevas Rutas API

### Procesamiento Directo de Pagos
```
POST /api/payments/process
Content-Type: application/json

{
  "transaction_amount": 1000,
  "description": "Compra de libro: Título del libro",
  "payment_method_id": "visa",
  "token": "card_token_from_frontend",
  "installments": 1,
  "payer": {
    "email": "comprador@email.com"
  },
  "external_reference": "LIBRO_123_456_1234567890"
}
```

## 🎨 Uso en Componentes React

### Componente Básico de Pago

```jsx
import PaymentComponent from '../components/PaymentComponent';

function BookDetails({ book }) {
  const handlePaymentSuccess = (paymentData) => {
    console.log('Pago exitoso:', paymentData);
    // Redirigir o mostrar mensaje de éxito
  };

  const handlePaymentError = (error) => {
    console.error('Error en pago:', error);
    // Mostrar mensaje de error
  };

  return (
    <div>
      <h1>{book.title}</h1>
      <PaymentComponent
        publishedBookId={book.published_book_id}
        bookInfo={book}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}
```

### Usando el Hook de Pago

```jsx
import { usePayment } from '../hooks/usePayment';

function CustomPaymentButton({ publishedBookId }) {
  const { 
    createPreference, 
    processPayment, 
    loading, 
    error 
  } = usePayment();

  const handleBuyBook = async () => {
    try {
      // Opción 1: Crear preferencia y redirigir
      const preference = await createPreference(publishedBookId);
      window.open(preference.init_point, '_blank');
      
      // Opción 2: Procesar pago directo (requiere token de tarjeta)
      // const paymentData = { ... };
      // const result = await processPayment(paymentData);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <button onClick={handleBuyBook} disabled={loading}>
      {loading ? 'Procesando...' : 'Comprar Libro'}
    </button>
  );
}
```

## 🔄 Flujo Completo de Pago

### 1. Pago con Preferencia (Redirect)
```javascript
// Crear preferencia
const preference = await paymentService.createPaymentPreference(bookId);

// Redirigir a MercadoPago
window.location.href = preference.init_point;
```

### 2. Pago Directo (API)
```javascript
// Obtener token de tarjeta del formulario de MercadoPago
const cardToken = await mp.fields.createCardToken({
  cardNumber: '4111111111111111',
  securityCode: '123',
  cardExpirationMonth: '12',
  cardExpirationYear: '2025',
  cardholderName: 'Juan Pérez',
  identificationType: 'DNI',
  identificationNumber: '12345678'
});

// Procesar pago
const paymentData = {
  transaction_amount: 1000,
  token: cardToken.id,
  description: 'Compra de libro',
  payment_method_id: 'visa',
  payer: {
    email: 'comprador@email.com'
  }
};

const result = await paymentService.processDirectPayment(paymentData);
```

## 🔍 Testing

### Credenciales de Prueba
- Access Token: `TEST-XXXXXXXXXXXX`
- Public Key: `TEST-XXXXXXXXXXXX`

### Tarjetas de Prueba
- **Visa**: 4111111111111111
- **Mastercard**: 5555555555554444
- **CVV**: 123
- **Fecha**: 12/25

### Usuarios de Prueba
Puedes crear usuarios de prueba en el [panel de MercadoPago](https://www.mercadopago.cl/developers/panel/test-users).

## 🚀 Despliegue en Producción

### 1. Configurar Webhook
- URL: `https://tu-dominio.com/api/payments/webhook`
- Eventos: `payment` y `merchant_order`

### 2. Variables de Producción
```env
MP_ACCESS_TOKEN=APP_USR-XXXXXXXXXX (producción)
MP_PUBLIC_KEY=APP_USR-XXXXXXXXXX (producción)
FRONTEND_URL=https://tu-dominio.com
BACKEND_URL=https://api.tu-dominio.com
```

### 3. Configurar HTTPS
MercadoPago requiere HTTPS en producción para webhooks y algunos métodos de pago.

## 📚 Documentación Adicional

- [MercadoPago Developers](https://www.mercadopago.cl/developers/es/reference)
- [SDK JavaScript](https://github.com/mercadopago/sdk-js)
- [Testing](https://www.mercadopago.cl/developers/es/guides/additional-content/test-environment)

## 🔧 Troubleshooting

### Error: "Access token inválido"
- Verifica que `MP_ACCESS_TOKEN` esté correcto
- En desarrollo usa credenciales de TEST
- En producción usa credenciales reales

### Error: "Public key inválido"
- Verifica `VITE_MP_PUBLIC_KEY` en el frontend
- Debe coincidir con el entorno (TEST o producción)

### Webhook no funciona
- Verifica que la URL sea accesible públicamente
- Usa ngrok o similar para desarrollo local
- Verifica que el endpoint devuelva status 200
