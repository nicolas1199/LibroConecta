// Script de debug específico para verificar el estado de datos
// Ejecutar en la consola del navegador

console.log("🔍 DEBUG ESPECÍFICO - ESTADO DE DATOS");

// 1. Verificar si los datos están cargados
const checkDataLoading = () => {
  // Buscar elementos que indiquen carga
  const loadingIndicator = document.querySelector('.animate-spin');
  const isLoadingData = !!loadingIndicator;
  
  console.log("⏳ Estado de carga:", {
    isLoading: isLoadingData,
    loadingElement: loadingIndicator
  });
  
  return !isLoadingData;
};

// 2. Verificar el contenido del formulario
const checkFormData = () => {
  // Buscar sección de imágenes existentes
  const existingImagesSection = document.querySelector('h4');
  const existingImagesSectionText = Array.from(document.querySelectorAll('h4'))
    .find(h4 => h4.textContent.includes('Imágenes actuales'));
  
  console.log("📋 Sección de imágenes existentes:", {
    found: !!existingImagesSectionText,
    element: existingImagesSectionText
  });
  
  // Verificar si hay imágenes en el DOM
  const allImages = document.querySelectorAll('img');
  const base64Images = Array.from(allImages).filter(img => 
    img.src && img.src.startsWith('data:image/')
  );
  
  console.log("🖼️ Imágenes en DOM:", {
    totalImages: allImages.length,
    base64Images: base64Images.length,
    imageDetails: base64Images.map((img, index) => ({
      index,
      alt: img.alt,
      srcStart: img.src.substring(0, 50) + '...',
      parent: img.parentElement?.className
    }))
  });
  
  return {
    hasExistingImagesSection: !!existingImagesSectionText,
    totalImages: allImages.length,
    base64Images: base64Images.length
  };
};

// 3. Verificar datos en localStorage o estado
const checkStoredData = () => {
  const user = localStorage.getItem('user');
  const token = localStorage.getItem('token');
  
  console.log("💾 Datos almacenados:", {
    hasUser: !!user,
    hasToken: !!token,
    userId: user ? JSON.parse(user).user_id : null
  });
  
  return {
    hasUser: !!user,
    hasToken: !!token
  };
};

// 4. Verificar URL actual para obtener ID de publicación
const checkCurrentUrl = () => {
  const url = window.location.href;
  const pathParts = window.location.pathname.split('/');
  const publicationId = pathParts[pathParts.length - 1];
  
  console.log("🌐 URL actual:", {
    fullUrl: url,
    pathname: window.location.pathname,
    publicationId: publicationId,
    isNumeric: !isNaN(parseInt(publicationId))
  });
  
  return {
    publicationId,
    isValidId: !isNaN(parseInt(publicationId))
  };
};

// 5. Función para hacer petición manual de datos
window.debugFetchPublication = async function() {
  const { publicationId } = checkCurrentUrl();
  
  if (!publicationId || isNaN(parseInt(publicationId))) {
    console.error("❌ ID de publicación inválido:", publicationId);
    return;
  }
  
  const token = localStorage.getItem('token');
  
  try {
    console.log(`🔄 Obteniendo datos de publicación ${publicationId}...`);
    
    const response = await fetch(`/api/published-books/${publicationId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log("📡 Respuesta de la API:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("📄 Datos de publicación:", data);
      console.log("🖼️ Imágenes en datos:", {
        hasImages: !!(data.PublishedBookImages),
        imageCount: data.PublishedBookImages?.length || 0,
        imageDetails: data.PublishedBookImages?.map(img => ({
          id: img.published_book_image_id,
          hasImageData: !!img.image_data,
          hasImageUrl: !!img.image_url,
          isPrimary: img.is_primary,
          dataLength: img.image_data?.length || 0
        })) || []
      });
      
      return data;
    } else {
      const errorData = await response.text();
      console.error("❌ Error en respuesta:", errorData);
    }
    
  } catch (error) {
    console.error("❌ Error en petición:", error);
  }
};

// Ejecutar verificaciones iniciales
console.log("🚀 Iniciando verificaciones...");

setTimeout(() => {
  const dataLoaded = checkDataLoading();
  const formInfo = checkFormData();
  const storedData = checkStoredData();
  const urlInfo = checkCurrentUrl();
  
  console.log("\n📊 RESUMEN DE VERIFICACIONES:");
  console.log("✅ Datos cargados:", dataLoaded);
  console.log("✅ Datos almacenados:", storedData.hasUser && storedData.hasToken);
  console.log("✅ URL válida:", urlInfo.isValidId);
  console.log("✅ Imágenes encontradas:", formInfo.base64Images > 0);
  
  if (!formInfo.hasExistingImagesSection) {
    console.log("⚠️ No se encontró la sección 'Imágenes actuales'");
    console.log("💡 Esto podría indicar que formData.existingImages está vacío");
  }
  
  console.log("\n🎯 PRÓXIMO PASO:");
  console.log("Ejecuta: debugFetchPublication() para obtener datos frescos de la API");
  
}, 1000);
