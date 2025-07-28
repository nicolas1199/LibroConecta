// Script para probar eliminación de imágenes Base64 en frontend
// Ejecutar en la consola del navegador en la página EditPublication

console.log("🔍 PROBANDO ELIMINACIÓN DE IMÁGENES BASE64");

function testBase64ImageDeletion() {
  console.log("📸 Buscando imágenes en la página...");
  
  // Buscar botones de eliminar imagen
  const deleteButtons = document.querySelectorAll('button[onclick*="removeExistingImage"], .delete-image-btn, button:has(svg)');
  console.log(`🗑️ Botones de eliminar encontrados: ${deleteButtons.length}`);
  
  if (deleteButtons.length === 0) {
    console.log("ℹ️ No se encontraron botones de eliminar");
    
    // Buscar imágenes existentes de otra manera
    const existingImages = document.querySelectorAll('[data-image-id], .existing-image, img[src*="data:image"]');
    console.log(`📸 Imágenes existentes encontradas: ${existingImages.length}`);
    
    existingImages.forEach((img, index) => {
      console.log(`  📸 Imagen ${index + 1}:`, {
        src: img.src?.substring(0, 50) + "...",
        id: img.getAttribute('data-image-id') || 'sin ID',
        isBase64: img.src?.startsWith('data:image/')
      });
    });
    
    return;
  }
  
  // Mostrar información de los botones encontrados
  deleteButtons.forEach((btn, index) => {
    console.log(`🗑️ Botón ${index + 1}:`, {
      text: btn.textContent?.trim(),
      onclick: btn.onclick?.toString(),
      classes: btn.className
    });
  });
  
  console.log("💡 Para probar eliminación:");
  console.log("1. Haz clic en el botón 'X' de una imagen");
  console.log("2. Confirma la eliminación");
  console.log("3. La imagen debería desaparecer inmediatamente");
  console.log("4. NO debería aparecer error en la consola");
}

// Función para simular eliminación programática
function simulateImageDeletion() {
  // Buscar el primer botón de eliminar y hacer clic
  const deleteButton = document.querySelector('button[onclick*="removeExistingImage"], .delete-image-btn');
  
  if (deleteButton) {
    console.log("🎯 Simulando clic en botón de eliminar...");
    deleteButton.click();
  } else {
    console.log("❌ No se encontró botón de eliminar para simular");
  }
}

// Ejecutar prueba
testBase64ImageDeletion();

// Exponer funciones para uso manual
window.testBase64ImageDeletion = testBase64ImageDeletion;
window.simulateImageDeletion = simulateImageDeletion;

console.log("✅ Prueba lista. Puedes usar:");
console.log("  - testBase64ImageDeletion() - para analizar botones");
console.log("  - simulateImageDeletion() - para simular clic");
