# 🔍 Guía de Diagnóstico - Error 500 en Pagos

## 📋 Estado Actual

✅ **Frontend funcionando**: URL, token, y configuración correctos  
✅ **Servidor remoto**: Tiene los cambios y credenciales  
❌ **Error 500**: Viene del backend remoto  

## 🧪 Pasos para Diagnosticar

### 1. **Ejecutar Diagnóstico Avanzado**

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Cargar script de diagnóstico
await import('./debug-payments.js');

// Ejecutar diagnóstico completo
await debugPayments();
```

Esto te dará información detallada del error del servidor.

### 2. **Verificar Logs del Servidor**

Si tienes acceso al servidor remoto, revisa los logs para ver el error específico:

```bash
# En el servidor remoto
tail -f /var/log/nodejs/app.log  # o donde estén los logs
```

### 3. **Posibles Causas del Error 500**

#### A. **Error en el Controlador**
- Verificar que el controlador `Payment.controller.js` tenga los cambios (`catch (err)` en lugar de `catch (error)`)

#### B. **Credenciales de MercadoPago**
- Verificar que `MP_ACCESS_TOKEN` sea válido
- Verificar que `MP_PUBLIC_KEY` coincida con el `ACCESS_TOKEN`

#### C. **Base de Datos**
- Verificar que las tablas `Payment`, `PublishedBooks`, `User`, `Book` existan
- Verificar relaciones entre tablas

#### D. **Dependencias**
- Verificar que `mercadopago` esté instalado: `npm list mercadopago`

### 4. **Prueba Directa de MercadoPago**

Ejecuta esto en la consola del servidor remoto para probar MercadoPago:

```javascript
import { MercadoPagoConfig, Payment } from 'mercadopago';

const client = new MercadoPagoConfig({ 
  accessToken: 'TU_ACCESS_TOKEN_AQUÍ' 
});

const payment = new Payment(client);

// Crear pago de prueba
payment.create({ 
  body: {
    transaction_amount: 100,
    description: 'Test',
    payment_method_id: 'account_money',
    payer: { email: 'test@test.com' }
  }
}).then(console.log).catch(console.error);
```

## 🔧 Script de Diagnóstico Automático

He creado un script que puedes ejecutar desde la consola del navegador para obtener información detallada del error.

### Cómo usar:

1. **Abre la consola** del navegador (F12)

2. **Copia y pega este código**:
```javascript
// Script de diagnóstico inline
(async function() {
  console.log('🔍 === DIAGNÓSTICO RÁPIDO ===');
  
  const bookId = 11; // El ID que está fallando
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`http://146.83.198.35:1234/api/payments/preferences/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    
    if (text.includes('<pre>')) {
      const match = text.match(/<pre>(.*?)<\/pre>/s);
      if (match) {
        console.error('🚨 ERROR DEL SERVIDOR:');
        console.error(match[1].replace(/<br\s*\/?>/gi, '\n'));
      }
    } else {
      console.log('Respuesta:', text);
    }
  } catch (error) {
    console.error('Error:', error);
  }
})();
```

3. **Ejecuta el script** y revisa el output

## 📊 Resultados Esperados

El script debería mostrar:
- ✅ **Status 201**: Pago creado exitosamente
- ❌ **Error específico**: Stack trace del problema exacto

## 🎯 Próximos Pasos

Dependiendo del resultado:

1. **Si es error de credenciales**: Verificar `MP_ACCESS_TOKEN`
2. **Si es error de BD**: Verificar conexión y tablas
3. **Si es error de código**: Revisar el controlador específico
4. **Si es error de dependencias**: Reinstalar `mercadopago`

---

**¿Puedes ejecutar el script de diagnóstico y compartir el output?** Esto nos dirá exactamente qué está fallando en el servidor.
