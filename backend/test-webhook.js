import axios from 'axios';

const BACKEND_URL = 'http://146.83.198.35:1234';

async function testWebhook() {
  console.log('🧪 === PRUEBA DE WEBHOOK MERCADOPAGO ===');
  
  // Simular datos de webhook de MercadoPago
  const webhookData = {
    type: 'payment',
    data: {
      id: '123456789' // ID de prueba
    }
  };

  const webhookQuery = {
    id: '123456789',
    topic: 'payment'
  };

  try {
    console.log('📤 Enviando webhook POST...');
    const postResponse = await axios.post(`${BACKEND_URL}/api/payments/webhook`, webhookData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook POST enviado correctamente');
    console.log('📋 Respuesta:', postResponse.status, postResponse.data);

    console.log('\n📤 Enviando webhook GET...');
    const getResponse = await axios.get(`${BACKEND_URL}/api/payments/webhook`, {
      params: webhookQuery
    });
    
    console.log('✅ Webhook GET enviado correctamente');
    console.log('📋 Respuesta:', getResponse.status, getResponse.data);

  } catch (error) {
    console.error('❌ Error enviando webhook:', error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// También probar con datos reales de un pago existente
async function testWithRealPayment() {
  console.log('\n🧪 === PRUEBA CON PAGO REAL ===');
  
  // Usar el external_reference del log que proporcionaste
  const realWebhookData = {
    type: 'payment',
    data: {
      id: '4632f979-a2d1-47fb-ba85-1c0680732162' // ID del pago real
    }
  };

  try {
    console.log('📤 Enviando webhook con pago real...');
    const response = await axios.post(`${BACKEND_URL}/api/payments/webhook`, realWebhookData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook con pago real enviado correctamente');
    console.log('📋 Respuesta:', response.status, response.data);

  } catch (error) {
    console.error('❌ Error enviando webhook con pago real:', error.message);
    if (error.response) {
      console.error('📋 Respuesta del servidor:', error.response.status, error.response.data);
    }
  }
}

// Ejecutar pruebas
testWebhook()
  .then(() => testWithRealPayment())
  .then(() => {
    console.log('\n✅ Todas las pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }); 