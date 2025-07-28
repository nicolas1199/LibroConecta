import axios from 'axios';

const BACKEND_URL = 'http://146.83.198.35:1234';

async function testWebhookFix() {
  console.log('🧪 === PRUEBA DE WEBHOOK CORREGIDO ===');
  
  const testCases = [
    {
      name: 'Webhook POST con JSON válido',
      method: 'POST',
      data: {
        type: 'payment',
        data: {
          id: 'test_payment_123'
        }
      },
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Webhook POST sin body (como MercadoPago a veces envía)',
      method: 'POST',
      data: {},
      headers: {
        'Content-Type': 'application/json'
      }
    },
    {
      name: 'Webhook GET con query params',
      method: 'GET',
      params: {
        id: 'test_payment_456',
        topic: 'payment'
      }
    },
    {
      name: 'Webhook POST con form data',
      method: 'POST',
      data: 'type=payment&data[id]=test_payment_789',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📤 Probando: ${testCase.name}`);
    
    try {
      const config = {
        method: testCase.method,
        url: `${BACKEND_URL}/api/payments/webhook`,
        headers: testCase.headers || {}
      };

      if (testCase.method === 'GET') {
        config.params = testCase.params;
      } else {
        config.data = testCase.data;
      }

      const response = await axios(config);
      
      console.log(`✅ ${testCase.name} - Status: ${response.status}`);
      console.log(`📋 Respuesta: ${response.data}`);
      
    } catch (error) {
      console.error(`❌ Error en ${testCase.name}:`, error.message);
      if (error.response) {
        console.error(`📋 Status: ${error.response.status}`);
        console.error(`📋 Data: ${error.response.data}`);
      }
    }
  }
}

// También probar con datos reales de MercadoPago
async function testRealMercadoPagoFormat() {
  console.log('\n🧪 === PRUEBA CON FORMATO REAL DE MERCADOPAGO ===');
  
  const realWebhookData = {
    type: 'payment',
    data: {
      id: '4632f979-a2d1-47fb-ba85-1c0680732162'
    }
  };

  try {
    console.log('📤 Enviando webhook con formato real de MercadoPago...');
    const response = await axios.post(`${BACKEND_URL}/api/payments/webhook`, realWebhookData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook con formato real enviado correctamente');
    console.log('📋 Status:', response.status);
    console.log('📋 Respuesta:', response.data);
    
  } catch (error) {
    console.error('❌ Error enviando webhook con formato real:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
    }
  }
}

// Ejecutar pruebas
testWebhookFix()
  .then(() => testRealMercadoPagoFormat())
  .then(() => {
    console.log('\n✅ Todas las pruebas completadas');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Si las pruebas pasan, el webhook está funcionando');
    console.log('2. Configura la URL en MercadoPago: http://146.83.198.35:1234/api/payments/webhook');
    console.log('3. Prueba con un pago real');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en las pruebas:', error);
    process.exit(1);
  }); 