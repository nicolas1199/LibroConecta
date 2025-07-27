// Script de prueba para simular auto-matches
// Ejecutar con: node test-auto-match.js

import { checkAndCreateAutoMatch } from './src/services/AutoMatch.service.js';

// Datos de prueba simulados
const testCases = [
  {
    name: "Test 1: Usuario válido con libro válido",
    userId: "test-user-1",
    publishedBookId: 1,
    description: "Debería simular la lógica de auto-match"
  },
  {
    name: "Test 2: Usuario diferente",
    userId: "test-user-2", 
    publishedBookId: 2,
    description: "Probar con diferentes usuarios"
  }
];

async function runTests() {
  console.log("🧪 Iniciando pruebas de Auto-Match...\n");
  
  for (const testCase of testCases) {
    console.log(`📋 ${testCase.name}`);
    console.log(`   Usuario: ${testCase.userId}`);
    console.log(`   Libro: ${testCase.publishedBookId}`);
    console.log(`   Descripción: ${testCase.description}`);
    
    try {
      const result = await checkAndCreateAutoMatch(testCase.userId, testCase.publishedBookId);
      console.log(`   ✅ Resultado:`, result);
    } catch (error) {
      console.log(`   ❌ Error:`, error.message);
    }
    
    console.log(''); // Línea en blanco
  }
  
  console.log("🎉 Pruebas completadas!");
}

// Función para pruebas más específicas
async function testSpecificScenario() {
  console.log("🎯 Prueba específica de escenario de auto-match\n");
  
  try {
    // Este sería un test más realista con datos de base de datos reales
    console.log("📝 Para usar con datos reales:");
    console.log("   1. Asegúrate de tener usuarios reales en la BD");
    console.log("   2. Crea interacciones de 'like' entre usuarios");
    console.log("   3. Ejecuta checkAndCreateAutoMatch()");
    console.log("   4. Verifica que se creó el match en la tabla Match");
    
  } catch (error) {
    console.error("Error en prueba específica:", error);
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  await runTests();
  await testSpecificScenario();
}

export { runTests, testSpecificScenario };
