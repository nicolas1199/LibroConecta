import { MercadoPagoConfig, Payment as MPPayment } from 'mercadopago';
import { Payment, PublishedBooks } from './src/db/modelIndex.js';
import { connectDB } from './src/config/configDb.js';

const accessToken = process.env.MP_ACCESS_TOKEN;

if (!accessToken) {
  console.error('❌ MP_ACCESS_TOKEN no está configurado');
  process.exit(1);
}

const client = new MercadoPagoConfig({ accessToken });
const mpPayment = new MPPayment(client);

async function checkPaymentStatus(externalReference) {
  console.log(`🔍 === VERIFICANDO ESTADO DE PAGO ===`);
  console.log(`📋 External Reference: ${externalReference}`);
  
  try {
    // Conectar a la base de datos
    await connectDB();
    
    // Buscar el pago en nuestra base de datos
    const paymentRecord = await Payment.findOne({
      where: { mp_external_reference: externalReference }
    });
    
    if (!paymentRecord) {
      console.error(`❌ Pago no encontrado con external_reference: ${externalReference}`);
      return;
    }
    
    console.log(`📋 Pago encontrado en BD:`, {
      payment_id: paymentRecord.payment_id,
      status: paymentRecord.status,
      mp_payment_id: paymentRecord.mp_payment_id,
      published_book_id: paymentRecord.published_book_id
    });
    
    // Si tenemos un mp_payment_id, consultar directamente con MercadoPago
    if (paymentRecord.mp_payment_id) {
      console.log(`🔍 Consultando estado en MercadoPago...`);
      
      try {
        const mpPaymentInfo = await mpPayment.get({ id: paymentRecord.mp_payment_id });
        
        console.log(`💳 Estado en MercadoPago:`, {
          id: mpPaymentInfo.id,
          status: mpPaymentInfo.status,
          external_reference: mpPaymentInfo.external_reference,
          date_approved: mpPaymentInfo.date_approved
        });
        
        // Actualizar el estado en nuestra BD si es diferente
        if (mpPaymentInfo.status !== paymentRecord.mp_collection_status) {
          console.log(`🔄 Actualizando estado de pago...`);
          
          await paymentRecord.update({
            mp_collection_status: mpPaymentInfo.status,
            status: mapMercadoPagoStatus(mpPaymentInfo.status),
            payment_date: mpPaymentInfo.date_approved || paymentRecord.payment_date
          });
          
          console.log(`✅ Estado actualizado: ${mpPaymentInfo.status}`);
          
          // Actualizar estado del libro según el resultado
          if (mpPaymentInfo.status === 'approved') {
            await PublishedBooks.update(
              { status: 'sold' },
              { where: { published_book_id: paymentRecord.published_book_id } }
            );
            console.log(`📚 Libro marcado como vendido: ${paymentRecord.published_book_id}`);
          } else if (mpPaymentInfo.status === 'rejected' || mpPaymentInfo.status === 'cancelled') {
            await PublishedBooks.update(
              { status: 'available' },
              { where: { published_book_id: paymentRecord.published_book_id } }
            );
            console.log(`📚 Libro marcado como disponible: ${paymentRecord.published_book_id}`);
          }
        }
        
      } catch (mpError) {
        console.error(`❌ Error consultando MercadoPago:`, mpError.message);
      }
    } else {
      console.log(`ℹ️ No hay mp_payment_id, no se puede consultar MercadoPago`);
    }
    
    // Mostrar estado final
    const finalPayment = await Payment.findByPk(paymentRecord.payment_id);
    const finalBook = await PublishedBooks.findByPk(paymentRecord.published_book_id);
    
    console.log(`\n📊 ESTADO FINAL:`);
    console.log(`   Pago: ${finalPayment.status}`);
    console.log(`   Libro: ${finalBook.status}`);
    
  } catch (error) {
    console.error(`❌ Error verificando pago:`, error);
  }
}

// Función para mapear estados de MercadoPago
function mapMercadoPagoStatus(mpStatus) {
  const statusMap = {
    'approved': 'paid',
    'pending': 'pending',
    'in_process': 'pending',
    'rejected': 'failed',
    'cancelled': 'failed',
    'refunded': 'refunded'
  };
  return statusMap[mpStatus] || 'pending';
}

// Obtener external_reference desde argumentos de línea de comandos
const externalReference = process.argv[2];

if (!externalReference) {
  console.error('❌ Uso: node check-payment-status.js <external_reference>');
  console.error('Ejemplo: node check-payment-status.js LIBRO_44_01b6f362-05d9-45f5-940d-4a8209ba8aa9_1753688449571');
  process.exit(1);
}

checkPaymentStatus(externalReference)
  .then(() => {
    console.log('\n✅ Verificación completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 