// Diagnóstico completo de eliminación de imágenes desde el frontend
// Ejecutar en la consola del navegador

console.log("🔍 DIAGNÓSTICO COMPLETO DE ELIMINACIÓN - SERVIDOR ONLINE");

// 1. Función para verificar el estado actual
async function getCurrentState() {
  const publicationId = window.location.pathname.split('/').pop();
  const token = localStorage.getItem('token');
  
  console.log("📊 ESTADO ACTUAL:");
  console.log("🆔 Publication ID:", publicationId);
  console.log("👤 User ID:", JSON.parse(localStorage.getItem('user')).user_id);
  
  try {
    // Obtener datos de la publicación
    const response = await fetch(`/api/published-books/${publicationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("📄 Datos actuales de la publicación:", {
        id: data.published_book_id,
        user_id: data.user_id,
        imageCount: data.PublishedBookImages?.length || 0,
        images: data.PublishedBookImages?.map(img => ({
          id: img.published_book_image_id,
          isPrimary: img.is_primary,
          hasData: !!img.image_data
        })) || []
      });
      
      return data;
    } else {
      console.error("❌ Error obteniendo publicación:", await response.text());
    }
  } catch (error) {
    console.error("❌ Error de red:", error);
  }
}

// 2. Función para probar eliminación paso a paso
async function testStepByStepDeletion(imageId) {
  const token = localStorage.getItem('token');
  
  console.log(`\n🧪 PRUEBA PASO A PASO - IMAGEN ${imageId}`);
  
  // Paso 1: Verificar que la imagen existe
  console.log("📋 Paso 1: Verificando que la imagen existe...");
  try {
    const checkResponse = await fetch(`/api/published-book-images/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (checkResponse.ok) {
      const imageData = await checkResponse.json();
      console.log("✅ Imagen encontrada:", {
        id: imageData.published_book_image_id,
        published_book_id: imageData.published_book_id,
        isPrimary: imageData.is_primary
      });
    } else {
      console.log("❌ Imagen no encontrada:", checkResponse.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Error verificando imagen:", error);
    return false;
  }
  
  // Paso 2: Intentar eliminación
  console.log("🗑️ Paso 2: Intentando eliminación...");
  try {
    const deleteResponse = await fetch(`/api/published-book-images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("📡 Respuesta de eliminación:", {
      status: deleteResponse.status,
      statusText: deleteResponse.statusText,
      ok: deleteResponse.ok
    });
    
    const deleteResult = await deleteResponse.text();
    console.log("📄 Contenido de respuesta:", deleteResult);
    
    if (!deleteResponse.ok) {
      console.log("❌ Error en eliminación:", deleteResult);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Error en petición de eliminación:", error);
    return false;
  }
  
  // Paso 3: Verificar eliminación inmediata
  console.log("🔍 Paso 3: Verificando eliminación inmediata...");
  await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
  
  try {
    const verifyResponse = await fetch(`/api/published-book-images/${imageId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (verifyResponse.ok) {
      console.log("❌ PROBLEMA: La imagen AÚN EXISTE después de eliminación");
      const stillExists = await verifyResponse.json();
      console.log("📄 Datos de imagen que aún existe:", stillExists);
      return false;
    } else if (verifyResponse.status === 404) {
      console.log("✅ ÉXITO: La imagen ya no existe (404)");
      return true;
    } else {
      console.log("⚠️ Respuesta inesperada:", verifyResponse.status);
      return false;
    }
  } catch (error) {
    console.log("✅ Error al buscar imagen (probablemente eliminada):", error.message);
    return true;
  }
}

// 3. Función para probar con múltiples imágenes
async function testMultipleImages() {
  console.log("\n🔄 PROBANDO CON MÚLTIPLES IMÁGENES");
  
  // Primero obtener el estado actual
  const currentData = await getCurrentState();
  
  if (!currentData || !currentData.PublishedBookImages || currentData.PublishedBookImages.length === 0) {
    console.log("❌ No hay imágenes para probar");
    return;
  }
  
  const imageIds = currentData.PublishedBookImages.map(img => img.published_book_image_id);
  console.log("🎯 IDs de imágenes a probar:", imageIds);
  
  // Probar con la primera imagen
  const firstImageId = imageIds[0];
  console.log(`\n🧪 Probando con primera imagen ID: ${firstImageId}`);
  
  const success = await testStepByStepDeletion(firstImageId);
  
  if (success) {
    console.log("✅ ELIMINACIÓN EXITOSA");
    
    // Verificar el estado después de la eliminación
    console.log("\n📊 Verificando estado después de eliminación...");
    await new Promise(resolve => setTimeout(resolve, 2000));
    await getCurrentState();
    
  } else {
    console.log("❌ ELIMINACIÓN FALLÓ");
    
    // Analizar posibles causas
    console.log("\n🔍 ANÁLISIS DE POSIBLES CAUSAS:");
    console.log("1. ¿Problema de permisos? - Verificar user_id en respuesta");
    console.log("2. ¿Problema de base de datos? - La eliminación no se persiste");
    console.log("3. ¿Problema de caché? - El servidor devuelve datos cacheados");
    console.log("4. ¿Restricciones FK? - Hay relaciones que impiden la eliminación");
  }
}

// 4. Función para analizar respuestas de error
async function analyzeErrorResponse(imageId) {
  const token = localStorage.getItem('token');
  
  console.log(`\n🔬 ANÁLISIS DETALLADO DE RESPUESTA - IMAGEN ${imageId}`);
  
  try {
    const response = await fetch(`/api/published-book-images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Analizar headers de respuesta
    console.log("📋 Headers de respuesta:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Analizar el cuerpo de la respuesta
    const responseText = await response.text();
    console.log("📄 Cuerpo de respuesta (texto):", responseText);
    
    // Intentar parsear como JSON
    try {
      const responseJson = JSON.parse(responseText);
      console.log("📋 Cuerpo de respuesta (JSON):", responseJson);
    } catch (e) {
      console.log("⚠️ La respuesta no es JSON válido");
    }
    
    // Analizar código de estado
    console.log("📊 Análisis de código de estado:");
    switch(response.status) {
      case 200:
        console.log("✅ 200: Eliminación reportada como exitosa");
        break;
      case 404:
        console.log("❌ 404: Imagen no encontrada");
        break;
      case 403:
        console.log("❌ 403: Sin permisos para eliminar");
        break;
      case 500:
        console.log("❌ 500: Error interno del servidor");
        break;
      default:
        console.log(`❓ ${response.status}: Código de estado inesperado`);
    }
    
  } catch (error) {
    console.error("❌ Error en análisis:", error);
  }
}

// Ejecutar diagnóstico automático
console.log("🚀 Iniciando diagnóstico automático...");

setTimeout(async () => {
  await getCurrentState();
  
  // Esperar un poco y luego probar
  setTimeout(() => {
    console.log("\n💡 FUNCIONES DISPONIBLES:");
    console.log("- getCurrentState() - Ver estado actual");
    console.log("- testStepByStepDeletion(imageId) - Prueba paso a paso");
    console.log("- testMultipleImages() - Prueba automática");
    console.log("- analyzeErrorResponse(imageId) - Análisis detallado");
    console.log("\n🎯 EJECUTA: testMultipleImages() para prueba completa");
  }, 1000);
}, 500);
