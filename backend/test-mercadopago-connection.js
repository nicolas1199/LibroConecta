import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

console.log('🔍 Testing MercadoPago connection...');
console.log('MP_ACCESS_TOKEN:', MP_ACCESS_TOKEN ? `${MP_ACCESS_TOKEN.substring(0, 20)}...` : 'NOT FOUND');

if (!MP_ACCESS_TOKEN) {
  console.error('❌ MP_ACCESS_TOKEN not found in environment variables');
  process.exit(1);
}

// Configurar MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN,
  options: { timeout: 5000 }
});

const preference = new Preference(client);

// Datos de prueba
const testPreferenceData = {
  items: [
    {
      id: "test_book_1",
      title: "Libro de Prueba",
      description: "Descripción del libro de prueba",
      category_id: 'books',
      quantity: 1,
      currency_id: 'CLP',
      unit_price: 1000
    }
  ],
  payer: {
    name: "Test",
    surname: "User",
    email: "test@example.com"
  },
  external_reference: `TEST_${Date.now()}`,
  back_url: {
    success: "http://localhost:3000/success",
    failure: "http://localhost:3000/failure",
    pending: "http://localhost:3000/pending"
  },
  auto_return: 'approved'
};

async function testMercadoPago() {
  try {
    console.log('🚀 Creating test preference...');
    console.log('Test data:', JSON.stringify(testPreferenceData, null, 2));
    
    const mpPreference = await preference.create({ body: testPreferenceData });
    
    console.log('✅ Test preference created successfully!');
    console.log('Preference ID:', mpPreference.id);
    console.log('Init Point:', mpPreference.init_point);
    
  } catch (error) {
    console.error('❌ Error creating test preference:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      status: error.status,
      response: error.response?.data || 'No response data'
    });
    
    if (error.response && error.response.data) {
      console.error('❌ MercadoPago error details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testMercadoPago();
