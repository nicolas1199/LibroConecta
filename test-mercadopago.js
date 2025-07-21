/**
 * Script para probar las credenciales de MercadoPago
 * Ejecutar con: node test-mercadopago.js
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config({ path: './backend/.env' });

async function testMercadoPago() {
  console.log('🔍 === PRUEBA DE CREDENCIALES MERCADOPAGO ===');
  
  const accessToken = process.env.MP_ACCESS_TOKEN;
  const publicKey = process.env.MP_PUBLIC_KEY;
  
  console.log('📋 Credenciales encontradas:');
  console.log('  MP_ACCESS_TOKEN:', accessToken ? accessToken.substring(0, 20) + '...' : 'NO ENCONTRADO');
  console.log('  MP_PUBLIC_KEY:', publicKey ? publicKey.substring(0, 20) + '...' : 'NO ENCONTRADO');
  
  if (!accessToken) {
    console.error('❌ MP_ACCESS_TOKEN no está configurado');
    return;
  }
  
  try {
    console.log('\n🔧 Inicializando cliente MercadoPago...');
    const client = new MercadoPagoConfig({ 
      accessToken: accessToken,
      options: { timeout: 5000 }
    });
    
    const preference = new Preference(client);
    console.log('✅ Cliente MercadoPago inicializado correctamente');
    
    console.log('\n💳 Creando preferencia de prueba...');
    const testPreference = {
      items: [
        {
          id: 'test-item',
          title: 'Libro de Prueba',
          description: 'Test para verificar credenciales',
          category_id: 'books',
          quantity: 1,
          currency_id: 'CLP',
          unit_price: 1000
        }
      ],
      payer: {
        name: 'Test',
        surname: 'User',
        email: 'test@example.com'
      },
      external_reference: 'TEST_' + Date.now(),
      back_urls: {
        success: 'http://146.83.198.35:1235/payment/success',
        failure: 'http://146.83.198.35:1235/payment/failure',
        pending: 'http://146.83.198.35:1235/payment/pending'
      },
      auto_return: 'approved'
    };
    
    const result = await preference.create({ body: testPreference });
    
    console.log('✅ Preferencia creada exitosamente!');
    console.log('📋 Detalles:');
    console.log('  - ID:', result.id);
    console.log('  - Init Point:', result.init_point);
    console.log('  - Sandbox Init Point:', result.sandbox_init_point);
    
    console.log('\n🎉 ¡Las credenciales de MercadoPago están funcionando correctamente!');
    
  } catch (error) {
    console.error('❌ Error probando MercadoPago:');
    console.error('  Mensaje:', error.message);
    console.error('  Código:', error.code);
    console.error('  Status:', error.status);
    
    if (error.cause) {
      console.error('  Causa:', error.cause);
    }
    
    // Detalles específicos del error
    if (error.message.includes('invalid')) {
      console.error('\n🚨 Posible problema: Credenciales inválidas');
      console.error('   - Verifica que MP_ACCESS_TOKEN sea correcto');
      console.error('   - Asegúrate de usar credenciales de TEST para pruebas');
    }
    
    if (error.message.includes('timeout')) {
      console.error('\n🚨 Posible problema: Timeout de conexión');
      console.error('   - Verifica la conectividad a internet');
    }
    
    console.error('\n📄 Error completo:', error);
  }
}

// Ejecutar la prueba
testMercadoPago().catch(console.error);
