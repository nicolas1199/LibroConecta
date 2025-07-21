# 🔧 Script de Diagnóstico Mejorado

Ejecuta este código en la consola del navegador para obtener más información:

```javascript
(async function() {
  console.log('🔍 === DIAGNÓSTICO DETALLADO ===');
  
  const bookId = 11;
  const token = localStorage.getItem('token');
  
  // Parsear el token para obtener información del usuario
  let userId = null;
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.user_id;
      console.log('👤 Usuario ID:', userId);
      console.log('⏰ Token expira:', new Date(payload.exp * 1000));
    } catch (e) {
      console.log('❌ Error decodificando token:', e.message);
    }
  }
  
  try {
    // Primero, verificar si el libro existe
    console.log('\n📚 Verificando libro...');
    const bookResponse = await fetch(`http://146.83.198.35:1234/api/published-books/${bookId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (bookResponse.ok) {
      const bookData = await bookResponse.json();
      console.log('✅ Libro encontrado:', bookData.data?.Book?.title || 'Sin título');
      console.log('💰 Precio:', bookData.data?.price);
      console.log('👤 Vendedor ID:', bookData.data?.user_id);
      
      if (bookData.data?.user_id === userId) {
        console.log('⚠️ PROBLEMA: Estás tratando de comprar tu propio libro!');
      }
    } else {
      console.log('❌ Libro no encontrado o sin acceso');
    }
    
    // Ahora probar el endpoint de pagos
    console.log('\n💳 Probando creación de preferencia...');
    const response = await fetch(`http://146.83.198.35:1234/api/payments/preferences/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseData = await response.json();
    console.log('📄 Respuesta completa:', responseData);
    
    if (!response.ok) {
      // Intentar obtener más información del error
      console.log('\n🔍 Analizando error...');
      
      if (responseData.error) {
        console.log('📝 Error específico:', responseData.error);
      }
      
      if (responseData.details) {
        console.log('📝 Detalles:', responseData.details);
      }
      
      // Verificar credenciales de MercadoPago
      console.log('\n🔑 Verificando configuración de MercadoPago...');
      console.log('Public Key Frontend:', import.meta.env.VITE_MP_PUBLIC_KEY);
    }
    
  } catch (error) {
    console.error('💥 Error en diagnóstico:', error);
  }
  
  console.log('\n✅ Diagnóstico completado');
})();
```
