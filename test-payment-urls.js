/**
 * Script para probar las URLs de retorno de MercadoPago
 * Uso: node test-payment-urls.js
 */

import axios from 'axios';

const BACKEND_URL = 'http://146.83.198.35:1234';

async function testPaymentUrls() {
  console.log('🧪 Probando URLs de retorno de MercadoPago...\n');

  const testCases = [
    {
      name: 'Success URL',
      url: `${BACKEND_URL}/api/payments/return/success`,
      params: {
        collection_id: '123456789',
        collection_status: 'approved',
        payment_id: '123456789',
        status: 'approved',
        external_reference: 'LIBRO_test_user_123456789',
        payment_type: 'account_money',
        merchant_order_id: '987654321',
        preference_id: 'test-preference-id'
      }
    },
    {
      name: 'Failure URL',
      url: `${BACKEND_URL}/api/payments/return/failure`,
      params: {
        collection_id: '123456789',
        collection_status: 'rejected',
        payment_id: '123456789',
        status: 'rejected',
        external_reference: 'LIBRO_test_user_123456789',
        payment_type: 'account_money',
        merchant_order_id: '987654321',
        preference_id: 'test-preference-id'
      }
    },
    {
      name: 'Pending URL',
      url: `${BACKEND_URL}/api/payments/return/pending`,
      params: {
        collection_id: '123456789',
        collection_status: 'pending',
        payment_id: '123456789',
        status: 'pending',
        external_reference: 'LIBRO_test_user_123456789',
        payment_type: 'account_money',
        merchant_order_id: '987654321',
        preference_id: 'test-preference-id'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`🔍 Probando: ${testCase.name}`);
    console.log(`📍 URL: ${testCase.url}`);
    
    try {
      const response = await axios.get(testCase.url, {
        params: testCase.params,
        maxRedirects: 0, // No seguir redirects para ver la respuesta
        validateStatus: function (status) {
          return status < 400; // Acepta códigos de redirect (3xx)
        }
      });

      console.log(`✅ Status: ${response.status}`);
      if (response.headers.location) {
        console.log(`🔄 Redirect a: ${response.headers.location}`);
      }
      console.log(''); // Línea vacía para separar
      
    } catch (error) {
      if (error.response && error.response.status >= 300 && error.response.status < 400) {
        console.log(`✅ Status: ${error.response.status} (Redirect)`);
        if (error.response.headers.location) {
          console.log(`🔄 Redirect a: ${error.response.headers.location}`);
        }
      } else {
        console.log(`❌ Error: ${error.message}`);
        if (error.response) {
          console.log(`📋 Status: ${error.response.status}`);
          console.log(`📋 Data: ${JSON.stringify(error.response.data)}`);
        }
      }
      console.log(''); // Línea vacía para separar
    }
  }

  console.log('🧪 Pruebas completadas!');
}

// Ejecutar las pruebas
testPaymentUrls().catch(console.error);
