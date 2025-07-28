// Script simple para diagnosticar eliminación de imágenes
// Copiar y pegar en la consola del navegador en la página EditPublication

console.log("🔍 DIAGNÓSTICO SIMPLE - ELIMINACIÓN DE IMÁGENES");

async function testImageDeletion() {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("❌ No hay token de autenticación");
    return;
  }
  
  console.log("🔑 Token encontrado");
  
  // Probar ruta de prueba primero
  console.log("\n1️⃣ Probando ruta de prueba GET...");
  try {
    const testUrl = `${window.location.origin}/api/published-book-images/test/27`;
    const testResponse = await fetch(testUrl);
    const testText = await testResponse.text();
    console.log("📡 Test GET Status:", testResponse.status);
    console.log("📄 Test GET Response:", testText);
  } catch (error) {
    console.error("❌ Error en test GET:", error);
  }
  
  // Probar ruta de prueba DELETE
  console.log("\n2️⃣ Probando ruta de prueba DELETE...");
  try {
    const testDeleteUrl = `${window.location.origin}/api/published-book-images/test/27`;
    const testDeleteResponse = await fetch(testDeleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const testDeleteText = await testDeleteResponse.text();
    console.log("📡 Test DELETE Status:", testDeleteResponse.status);
    console.log("📄 Test DELETE Response:", testDeleteText);
  } catch (error) {
    console.error("❌ Error en test DELETE:", error);
  }
  
  // Ahora probar la ruta real
  console.log("\n3️⃣ Probando ruta real DELETE...");
  const imageId = 27; // Usar ID fijo para prueba
  const url = `${window.location.origin}/api/published-book-images/${imageId}`;
  console.log("🌐 URL:", url);
  
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("📡 Status:", response.status);
    const text = await response.text();
    
    if (text.startsWith('<')) {
      console.error("❌ PROBLEMA: Respuesta es HTML");
      console.log("📄 HTML recibido:", text.substring(0, 200));
    } else {
      console.log("✅ Respuesta JSON:", text);
    }
    
  } catch (error) {
    console.error("❌ Error de red:", error);
  }
}

// Ejecutar automáticamente
setTimeout(testImageDeletion, 1000);
