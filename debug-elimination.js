// Script de diagnóstico para servidor online
console.log("🔍 DIAGNÓSTICO PARA SERVIDOR ONLINE");

async function testServerConfig() {
  const token = localStorage.getItem('token');
  const baseUrl = window.location.origin;
  
  console.log("🌐 Base URL:", baseUrl);
  console.log("🔑 Token presente:", !!token);
  
  // 1. Probar rutas básicas del API
  const testRoutes = [
    '/api/health',
    '/api/transaction-types',
    '/api/published-book-images/test/27'
  ];
  
  for (const route of testRoutes) {
    try {
      console.log(`\n🔗 Probando: ${route}`);
      const response = await fetch(`${baseUrl}${route}`);
      const text = await response.text();
      
      console.log(`📡 Status: ${response.status}`);
      console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
      
      if (text.includes('<!doctype html>')) {
        console.error(`❌ ${route} devuelve HTML (no existe o error)`);
      } else {
        console.log(`✅ ${route} funciona correctamente`);
      }
    } catch (error) {
      console.error(`❌ Error en ${route}:`, error.message);
    }
  }
  
  // 2. Verificar si el middleware de autenticación funciona
  console.log("\n🔐 Probando autenticación...");
  try {
    const authResponse = await fetch(`${baseUrl}/api/published-book-images/test/27`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const authText = await authResponse.text();
    console.log(`📡 Auth Status: ${authResponse.status}`);
    
    if (authText.includes('<!doctype html>')) {
      console.error("❌ Ruta de prueba DELETE devuelve HTML");
      console.log("🔍 Esto indica que las rutas API no están siendo procesadas");
    } else {
      console.log("✅ Ruta de prueba DELETE funciona");
      console.log("📄 Respuesta:", authText);
    }
  } catch (error) {
    console.error("❌ Error en prueba de autenticación:", error);
  }
  
  // 3. Verificar headers específicos
  console.log("\n🔍 Verificando headers del servidor...");
  try {
    const headResponse = await fetch(`${baseUrl}/api/transaction-types`, {
      method: 'HEAD'
    });
    
    console.log("📡 Headers del servidor:");
    headResponse.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (error) {
    console.error("❌ Error obteniendo headers:", error);
  }
  
  // 4. Probar la ruta real con más información
  console.log("\n� Probando ruta real de eliminación...");
  try {
    const realResponse = await fetch(`${baseUrl}/api/published-book-images/27`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    console.log("📡 Real DELETE Status:", realResponse.status);
    console.log("📡 Real DELETE Headers:");
    realResponse.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
    
    const realText = await realResponse.text();
    
    if (realText.includes('<!doctype html>')) {
      console.error("❌ PROBLEMA CONFIRMADO: API devuelve HTML");
      console.log("� POSIBLES CAUSAS:");
      console.log("  1. El servidor backend no está corriendo");
      console.log("  2. Las rutas API no están configuradas");
      console.log("  3. Hay un proxy que redirige a frontend");
      console.log("  4. Error en la configuración del servidor");
    } else {
      console.log("✅ Respuesta JSON correcta:", realText);
    }
  } catch (error) {
    console.error("❌ Error en ruta real:", error);
  }
}

// Ejecutar diagnóstico
setTimeout(testServerConfig, 1000);
