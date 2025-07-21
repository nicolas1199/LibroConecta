/**
 * Script de diagnóstico para debugging de pagos
 * Ejecuta esto en la consola del navegador para obtener información detallada
 */

// Función para diagnosticar el estado de la aplicación
window.debugPayments = async function() {
  console.log('🔍 === DIAGNÓSTICO DE PAGOS ===');
  
  // 1. Verificar variables de entorno
  console.log('📋 Variables de entorno:');
  console.log('  VITE_API_URL:', import.meta?.env?.VITE_API_URL || 'No definida');
  console.log('  VITE_MP_PUBLIC_KEY:', import.meta?.env?.VITE_MP_PUBLIC_KEY || 'No definida');
  
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
    } catch (e) {
      console.log('  Error decodificando token:', e.message);
    }
  }
  
  // 3. Verificar conectividad con el servidor
  console.log('\n🌐 Prueba de conectividad:');
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('  Status:', response.status);
    console.log('  Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.text();
      console.log('  Respuesta:', data);
    }
  } catch (error) {
    console.error('  Error de conectividad:', error.message);
  }
  
  // 4. Probar endpoint específico de pagos
  console.log('\n💳 Prueba de endpoint de pagos:');
  try {
    const testBookId = 11; // Usar el ID que está fallando
    const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/preferences/${testBookId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });
    
    console.log('  Status:', response.status);
    console.log('  Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('  Respuesta completa:', responseText);
    
    if (response.status === 500 && responseText.includes('<html>')) {
      // Extraer error del HTML
      const match = responseText.match(/<pre>(.*?)<\/pre>/s);
      if (match) {
        console.error('  🚨 Stack trace del servidor:');
        console.error(match[1].replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/g, ' '));
      }
    }
    
  } catch (error) {
    console.error('  Error en prueba de pagos:', error.message);
  }
  
  console.log('\n✅ Diagnóstico completado');
};

// Función para probar MercadoPago SDK
window.testMercadoPago = function() {
  console.log('🔍 === PRUEBA DE MERCADOPAGO SDK ===');
  
  console.log('MercadoPago disponible:', typeof window.MercadoPago !== 'undefined');
  console.log('Public Key:', import.meta?.env?.VITE_MP_PUBLIC_KEY);
  
  if (typeof window.MercadoPago !== 'undefined') {
    try {
      const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);
      console.log('✅ MercadoPago SDK inicializado correctamente');
      window.mpInstance = mp;
    } catch (error) {
      console.error('❌ Error inicializando MercadoPago:', error);
    }
  } else {
    console.log('⚠️ MercadoPago SDK no está cargado');
  }
};

console.log('🔧 Funciones de diagnóstico cargadas:');
console.log('  - debugPayments() - Diagnóstico completo');
console.log('  - testMercadoPago() - Prueba del SDK de MercadoPago');
