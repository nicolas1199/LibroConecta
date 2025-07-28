import { MercadoPagoConfig } from 'mercadopago';
import axios from 'axios';

const BACKEND_URL = 'http://146.83.198.35:1234';

async function setupWebhook() {
  console.log('🔧 === CONFIGURACIÓN DE WEBHOOK MERCADOPAGO ===');
  
  const accessToken = process.env.MP_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('❌ MP_ACCESS_TOKEN no está configurado');
    return;
  }

  try {
    // Configurar cliente de MercadoPago
    const client = new MercadoPagoConfig({ 
      accessToken: accessToken,
      options: { timeout: 5000 }
    });

    console.log('✅ Cliente MercadoPago configurado');

    // URL del webhook
    const webhookUrl = `${BACKEND_URL}/api/payments/webhook`;
    
    console.log('🔗 URL del webhook:', webhookUrl);

    // Verificar que el webhook sea accesible
    console.log('🔍 Verificando accesibilidad del webhook...');
    
    try {
      const response = await axios.get(webhookUrl);
      console.log('✅ Webhook es accesible (GET):', response.status);
    } catch (error) {
      console.log('⚠️ Webhook GET no accesible (normal para GET):', error.message);
    }

    try {
      const response = await axios.post(webhookUrl, { test: true });
      console.log('✅ Webhook es accesible (POST):', response.status);
    } catch (error) {
      console.log('❌ Webhook POST no accesible:', error.message);
    }

    console.log('\n📋 INSTRUCCIONES PARA CONFIGURAR WEBHOOK EN MERCADOPAGO:');
    console.log('1. Ve a https://www.mercadopago.cl/developers/panel/notifications');
    console.log('2. Haz clic en "Crear notificación"');
    console.log('3. Configura los siguientes parámetros:');
    console.log(`   - URL: ${webhookUrl}`);
    console.log('   - Eventos: payment');
    console.log('   - Método: POST');
    console.log('4. Guarda la configuración');
    console.log('\n5. Prueba el webhook con el botón "Probar" en el panel');

    console.log('\n🔍 PARA VERIFICAR QUE EL WEBHOOK FUNCIONA:');
    console.log('1. Realiza un pago de prueba');
    console.log('2. Revisa los logs del servidor para ver si llega la notificación');
    console.log('3. Verifica que el estado del pago se actualice correctamente');

  } catch (error) {
    console.error('❌ Error configurando webhook:', error);
  }
}

// También crear un script para simular webhooks de prueba
async function testWebhookSimulation() {
  console.log('\n🧪 === SIMULACIÓN DE WEBHOOKS ===');
  
  const testCases = [
    {
      name: 'Pago Aprobado',
      data: {
        type: 'payment',
        data: { id: 'test_approved_123' }
      }
    },
    {
      name: 'Pago Rechazado',
      data: {
        type: 'payment',
        data: { id: 'test_rejected_456' }
      }
    },
    {
      name: 'Pago Pendiente',
      data: {
        type: 'payment',
        data: { id: 'test_pending_789' }
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📤 Enviando ${testCase.name}...`);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/payments/webhook`, testCase.data, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${testCase.name} enviado correctamente:`, response.status);
    } catch (error) {
      console.error(`❌ Error enviando ${testCase.name}:`, error.message);
    }
  }
}

// Ejecutar configuración
setupWebhook()
  .then(() => testWebhookSimulation())
  .then(() => {
    console.log('\n✅ Configuración de webhook completada');
    console.log('\n📝 PRÓXIMOS PASOS:');
    console.log('1. Configura el webhook en el panel de MercadoPago');
    console.log('2. Realiza un pago de prueba');
    console.log('3. Verifica que el estado del libro se actualice correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error en la configuración:', error);
    process.exit(1);
  }); 