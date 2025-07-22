/**
 * Script de diagnóstico para debugging de pagos - VERSIÓN CONSOLA
 * Ejecuta esto directamente en la consola del navegador
 */

// Función para diagnosticar el estado de la aplicación
window.debugPayments = async function() {
  console.log('🔍 === DIAGNÓSTICO DE PAGOS ===');
  
  // 1. Verificar variables de entorno desde el DOM o localStorage
  console.log('📋 Variables de entorno:');
  
  // Intentar obtener las variables de diferentes maneras
  const apiUrl = window.location.hostname === '146.83.198.35' 
    ? 'http://146.83.198.35:1234/api' 
    : 'http://localhost:3000/api';
  
  const publicKey = 'TEST-b46527b0-bd93-4cd4-a6d1-204c8383bd95'; // Tu clave actual
  
  console.log('  API_URL:', apiUrl);
  console.log('  MP_PUBLIC_KEY:', publicKey);
  
  // 2. Verificar autenticación
  console.log('\n🔐 Estado de autenticación:');
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  console.log('  Token presente:', token ? 'Sí' : 'No');
  console.log('  Refresh token presente:', refreshToken ? 'Sí' : 'No');
  
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('  Token expira en:', new Date(payload.exp * 1000));
      console.log('  Usuario ID:', payload.user_id);
      console.log('  Token válido:', new Date(payload.exp * 1000) > new Date());
    } catch (e) {
      console.log('  Error decodificando token:', e.message);
    }
  }
  
  // 3. Verificar conectividad con el servidor
  console.log('\n🌐 Prueba de conectividad:');
  try {
    const response = await fetch(`${apiUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('  Usuario autenticado:', data);
    } else {
      const errorText = await response.text();
      console.log('  Error de autenticación:', errorText);
    }
  } catch (error) {
    console.error('  Error de conectividad:', error.message);
  }
  
  // 4. Probar endpoint específico de pagos con información detallada
  console.log('\n💳 Prueba DETALLADA de endpoint de pagos:');
  try {
    const testBookId = 11; // Usar el ID que está fallando
    
    console.log(`  📞 Llamando a: ${apiUrl}/payments/preferences/${testBookId}`);
    console.log('  📋 Headers enviados:', {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token.substring(0, 20)}...` : 'No token'
    });
    
    const response = await fetch(`${apiUrl}/payments/preferences/${testBookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('  📊 Status:', response.status);
    console.log('  📊 Status Text:', response.statusText);
    console.log('  📊 Headers respuesta:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('  📄 Respuesta completa (primeros 500 chars):', responseText.substring(0, 500));
    
    if (response.status === 500) {
      console.log('  🚨 ERROR 500 DETECTADO');
      
      // Intentar extraer información del error
      if (responseText.includes('<html>')) {
        console.log('  📄 Respuesta es HTML (error del servidor)');
        
        // Buscar stack trace
        const preMatch = responseText.match(/<pre[^>]*>(.*?)<\/pre>/s);
        if (preMatch) {
          console.log('  🔍 Stack trace encontrado:');
          const stackTrace = preMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/&nbsp;/g, ' ')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
          console.error(stackTrace);
        }
        
        // Buscar mensaje de error
        const errorMatch = responseText.match(/<h1[^>]*>(.*?)<\/h1>/i);
        if (errorMatch) {
          console.log('  💥 Mensaje de error:', errorMatch[1]);
        }
      } else {
        try {
          const errorData = JSON.parse(responseText);
          console.log('  📋 Error JSON:', errorData);
        } catch {
          console.log('  📄 Error como texto:', responseText);
        }
      }
    } else if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('  ✅ Respuesta exitosa:', data);
      } catch {
        console.log('  ✅ Respuesta exitosa (texto):', responseText);
      }
    }
    
  } catch (error) {
    console.error('  ❌ Error en prueba de pagos:', error);
    console.error('  ❌ Stack completo:', error.stack);
  }
  
  // 5. Verificar el libro específico
  console.log('\n📖 Verificación del libro ID 11:');
  try {
    const bookResponse = await fetch(`${apiUrl}/published-books/11`);
    console.log('  📊 Status libro:', bookResponse.status);
    
    if (bookResponse.ok) {
      const book = await bookResponse.json();
      console.log('  📚 Datos del libro:');
      console.log('    - Título:', book.Book?.title || 'NO DISPONIBLE');
      console.log('    - Precio:', book.price || 'NO DISPONIBLE');
      console.log('    - Usuario:', book.User?.first_name || 'NO DISPONIBLE');
      console.log('    - ¿Comprable?:', !!(book.price && book.Book?.title && book.User));
    } else {
      console.log('  ❌ Error obteniendo libro:', await bookResponse.text());
    }
  } catch (error) {
    console.error('  ❌ Error verificando libro:', error);
  }
  
  console.log('\n✅ Diagnóstico completado');
  console.log('📋 Resumen:');
  console.log('  - Si ves errores 500, revisa los logs del servidor');
  console.log('  - Si el token está expirado, haz login nuevamente');
  console.log('  - Si el libro no tiene datos, ese es el problema');
};

// Función para probar MercadoPago SDK
window.testMercadoPago = function() {
  console.log('🔍 === PRUEBA DE MERCADOPAGO SDK ===');
  
  const publicKey = 'TEST-b46527b0-bd93-4cd4-a6d1-204c8383bd95';
  
  console.log('MercadoPago disponible:', typeof window.MercadoPago !== 'undefined');
  console.log('Public Key:', publicKey);
  
  if (typeof window.MercadoPago !== 'undefined') {
    try {
      const mp = new window.MercadoPago(publicKey);
      console.log('✅ MercadoPago SDK inicializado correctamente');
      window.mpInstance = mp;
      return mp;
    } catch (error) {
      console.error('❌ Error inicializando MercadoPago:', error);
    }
  } else {
    console.log('⚠️ MercadoPago SDK no está cargado');
    console.log('🔧 Intentando cargar SDK...');
    
    // Intentar cargar el SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.mercadopago.com/js/v2';
    script.onload = () => {
      console.log('✅ SDK cargado, prueba testMercadoPago() nuevamente');
    };
    document.head.appendChild(script);
  }
};

// Función para simular una petición de pago paso a paso
window.simulatePayment = async function(bookId = 11) {
  console.log(`🎯 === SIMULACIÓN DE PAGO PASO A PASO - LIBRO ${bookId} ===`);
  
  const apiUrl = 'http://146.83.198.35:1234/api';
  const token = localStorage.getItem('token');
  
  console.log('🔍 Paso 1: Verificar autenticación');
  if (!token) {
    console.error('❌ No hay token de autenticación');
    return;
  }
  console.log('✅ Token presente');
  
  console.log('🔍 Paso 2: Verificar libro');
  try {
    const bookResponse = await fetch(`${apiUrl}/published-books/${bookId}`);
    if (!bookResponse.ok) {
      console.error('❌ Error obteniendo libro:', bookResponse.status);
      return;
    }
    const book = await bookResponse.json();
    console.log('✅ Libro obtenido:', {
      titulo: book.Book?.title,
      precio: book.price,
      usuario: book.User?.first_name
    });
  } catch (error) {
    console.error('❌ Error verificando libro:', error);
    return;
  }
  
  console.log('🔍 Paso 3: Crear preferencia de pago');
  try {
    const paymentResponse = await fetch(`${apiUrl}/payments/preferences/${bookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('📊 Status de pago:', paymentResponse.status);
    const responseText = await paymentResponse.text();
    
    if (paymentResponse.ok) {
      console.log('✅ Preferencia creada exitosamente');
      try {
        const paymentData = JSON.parse(responseText);
        console.log('💳 Datos de pago:', paymentData);
      } catch {
        console.log('💳 Respuesta de pago:', responseText);
      }
    } else {
      console.error('❌ Error creando preferencia');
      console.error('📄 Respuesta completa:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Error en petición de pago:', error);
  }
};

console.log('🔧 Funciones de diagnóstico cargadas:');
console.log('  - debugPayments() - Diagnóstico completo');
console.log('  - testMercadoPago() - Prueba del SDK de MercadoPago');
console.log('  - simulatePayment(bookId) - Simula pago paso a paso');
console.log('');
console.log('🚀 Ejecuta: debugPayments()');
