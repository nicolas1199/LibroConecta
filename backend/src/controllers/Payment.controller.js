import { MercadoPagoConfig, Preference, Payment as MPPayment } from 'mercadopago';
import { Op } from 'sequelize';
import { 
  MP_ACCESS_TOKEN, 
  FRONTEND_URL, 
  BACKEND_URL 
} from '../config/configEnv.js';
import { 
  Payment, 
  Transaction, 
  PublishedBooks, 
  User,
  Book 
} from '../db/modelIndex.js';
import { success, error } from '../utils/responses.util.js';
import { v4 as uuidv4 } from 'uuid';

// Configurar MercadoPago
if (!MP_ACCESS_TOKEN) {
  console.error('❌ MP_ACCESS_TOKEN no está configurado');
}

const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN || 'TEST-1234567890',
  options: { timeout: 5000 }
});

const preference = new Preference(client);
const payment = new MPPayment(client);

/**
 * Crear preferencia de pago para un libro
 * Según la documentación: https://www.mercadopago.cl/developers/es/reference/preferences/_checkout_preferences/post
 */
export async function createPaymentPreference(req, res) {
  try {
    // Validar configuración de MercadoPago
    if (!MP_ACCESS_TOKEN) {
      console.error('❌ MP_ACCESS_TOKEN no configurado - usando modo prueba');
      // Si no hay configuración de MercadoPago, usar modo prueba
      return await createPaymentPreferenceTest(req, res);
    }

    const { publishedBookId } = req.params;
    const userId = req.user.user_id;

    // Verificar que el libro existe y está disponible para venta
    const publishedBook = await PublishedBooks.findByPk(publishedBookId, {
      include: [
        {
          model: Book,
          as: 'Book'
        },
        {
          model: User,
          as: 'User'
        }
      ]
    });

    if (!publishedBook) {
      return error(res, 'Libro no encontrado', 404);
    }

    // Verificar que no sea el propio dueño del libro
    if (publishedBook.user_id === userId) {
      return error(res, 'No puedes comprar tu propio libro', 400);
    }

    // Verificar que el libro esté disponible para venta
    if (!publishedBook.price || publishedBook.price <= 0) {
      return error(res, 'Este libro no está disponible para venta', 400);
    }

    // Crear referencia externa única
    const externalReference = `LIBRO_${publishedBookId}_${userId}_${Date.now()}`;

    // Crear registro de pago en la base de datos
    const paymentRecord = await Payment.create({
      published_book_id: publishedBookId,
      buyer_id: userId,
      seller_id: publishedBook.user_id,
      amount: publishedBook.price,
      currency: 'CLP',
      mp_external_reference: externalReference,
      description: `Compra de libro: ${publishedBook.Book.title}`,
      status: 'pending'
    });

    // Preparar datos para MercadoPago
    const preferenceData = {
      items: [
        {
          id: publishedBookId.toString(),
          title: publishedBook.Book.title,
          description: `${publishedBook.Book.title} por ${publishedBook.Book.author}`,
          category_id: 'books',
          quantity: 1,
          currency_id: 'CLP',
          unit_price: parseFloat(publishedBook.price)
        }
      ],
      payer: {
        name: req.user.first_name,
        surname: req.user.last_name,
        email: req.user.email
      },
      external_reference: externalReference,
      notification_url: `${BACKEND_URL}/api/payments/webhook`,
      back_urls: {
        success: `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}`,
        failure: `${FRONTEND_URL}/payment/failure?payment_id=${paymentRecord.payment_id}`,
        pending: `${FRONTEND_URL}/payment/pending?payment_id=${paymentRecord.payment_id}`
      },
      auto_return: 'approved',
      statement_descriptor: 'LIBROCONECTA',
      metadata: {
        payment_id: paymentRecord.payment_id,
        book_id: publishedBookId,
        buyer_id: userId,
        seller_id: publishedBook.user_id
      }
    };

    // Crear preferencia en MercadoPago
    let mpPreference;
    try {
      mpPreference = await preference.create({ body: preferenceData });
      console.log('✅ Preferencia creada en MercadoPago:', mpPreference.id);
    } catch (mpError) {
      console.error('❌ Error creando preferencia en MercadoPago:', mpError);
      
      // Eliminar el registro de pago creado
      await paymentRecord.destroy();
      
      return error(res, 'Error al procesar el pago. Intente nuevamente.', 500);
    }

    // Actualizar registro con ID de preferencia
    await paymentRecord.update({
      mp_preference_id: mpPreference.id,
      notification_url: `${BACKEND_URL}/api/payments/webhook`,
      success_url: `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}`,
      failure_url: `${FRONTEND_URL}/payment/failure?payment_id=${paymentRecord.payment_id}`,
      pending_url: `${FRONTEND_URL}/payment/pending?payment_id=${paymentRecord.payment_id}`
    });

    console.log(`✅ Preferencia de pago creada: ${mpPreference.id} para libro ${publishedBookId}`);

    return success(res, {
      payment_id: paymentRecord.payment_id,
      preference_id: mpPreference.id,
      init_point: mpPreference.init_point,
      sandbox_init_point: mpPreference.sandbox_init_point,
      book_info: {
        title: publishedBook.Book.title,
        author: publishedBook.Book.author,
        price: publishedBook.price
      }
    }, 'Preferencia de pago creada exitosamente', 201);

  } catch (error) {
    console.error('❌ Error creando preferencia de pago:', error);
    
    // Log detallado del error
    if (error.response) {
      console.error('❌ Error de MercadoPago:', error.response.data);
    }
    
    return error(res, 'Error interno del servidor. Intente nuevamente.', 500);
  }
}

/**
 * Crear preferencia de pago para un libro (MODO PRUEBA)
 * Esta función simula la creación de una preferencia sin usar MercadoPago
 */
export async function createPaymentPreferenceTest(req, res) {
  try {
    const { publishedBookId } = req.params;
    const userId = req.user.user_id;

    // Verificar que el libro existe y está disponible para venta
    const publishedBook = await PublishedBooks.findByPk(publishedBookId, {
      include: [
        {
          model: Book,
          as: 'Book'
        },
        {
          model: User,
          as: 'User'
        }
      ]
    });

    if (!publishedBook) {
      return error(res, 'Libro no encontrado', 404);
    }

    // Verificar que no sea el propio dueño del libro
    if (publishedBook.user_id === userId) {
      return error(res, 'No puedes comprar tu propio libro', 400);
    }

    // Verificar que el libro esté disponible para venta
    if (!publishedBook.price || publishedBook.price <= 0) {
      return error(res, 'Este libro no está disponible para venta', 400);
    }

    // Crear referencia externa única
    const externalReference = `LIBRO_${publishedBookId}_${userId}_${Date.now()}`;

    // Crear registro de pago en la base de datos
    const paymentRecord = await Payment.create({
      published_book_id: publishedBookId,
      buyer_id: userId,
      seller_id: publishedBook.user_id,
      amount: publishedBook.price,
      currency: 'CLP',
      mp_external_reference: externalReference,
      description: `Compra de libro: ${publishedBook.Book.title}`,
      status: 'pending'
    });

    // Simular respuesta de MercadoPago
    const mockPreferenceId = `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Actualizar registro con ID de preferencia simulado
    await paymentRecord.update({
      mp_preference_id: mockPreferenceId,
      notification_url: `${BACKEND_URL}/api/payments/webhook`,
      success_url: `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}`,
      failure_url: `${FRONTEND_URL}/payment/failure?payment_id=${paymentRecord.payment_id}`,
      pending_url: `${FRONTEND_URL}/payment/pending?payment_id=${paymentRecord.payment_id}`
    });

    console.log(`✅ Preferencia de pago simulada creada: ${mockPreferenceId} para libro ${publishedBookId}`);

    return success(res, {
      payment_id: paymentRecord.payment_id,
      preference_id: mockPreferenceId,
      init_point: `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}`,
      sandbox_init_point: `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}`,
      book_info: {
        title: publishedBook.Book.title,
        author: publishedBook.Book.author,
        price: publishedBook.price
      }
    }, 'Preferencia de pago creada exitosamente (MODO PRUEBA)', 201);

  } catch (error) {
    console.error('❌ Error creando preferencia de pago (modo prueba):', error);
    return error(res, 'Error interno del servidor. Intente nuevamente.', 500);
  }
}

/**
 * Webhook para notificaciones de MercadoPago
 * Documentación: https://www.mercadopago.cl/developers/es/guides/additional-content/notifications/webhooks
 */
export async function handlePaymentWebhook(req, res) {
  try {
    console.log('🔔 Webhook recibido:', JSON.stringify(req.body, null, 2));

    const { type, data } = req.body;

    // Solo procesar notificaciones de pago
    if (type === 'payment') {
      const mpPaymentId = data.id;
      
      // Obtener información del pago desde MercadoPago
      const mpPaymentInfo = await payment.get({ id: mpPaymentId });
      
      console.log('💳 Información del pago:', JSON.stringify(mpPaymentInfo, null, 2));

      // Buscar el pago en nuestra base de datos
      const paymentRecord = await Payment.findOne({
        where: { 
          mp_external_reference: mpPaymentInfo.external_reference 
        }
      });

      if (!paymentRecord) {
        console.error(`❌ Pago no encontrado en BD: ${mpPaymentInfo.external_reference}`);
        return res.status(404).send('Payment not found');
      }

      // Actualizar información del pago
      await paymentRecord.update({
        mp_payment_id: mpPaymentId.toString(),
        mp_collection_id: mpPaymentInfo.collection_id,
        mp_collection_status: mpPaymentInfo.status,
        payment_method: mpPaymentInfo.payment_method_id,
        payment_date: mpPaymentInfo.date_approved || new Date(),
        status: mapMercadoPagoStatus(mpPaymentInfo.status)
      });

      // Si el pago fue aprobado, crear la transacción
      if (mpPaymentInfo.status === 'approved') {
        await createTransactionFromPayment(paymentRecord);
      }

      console.log(`✅ Pago actualizado: ${paymentRecord.payment_id} - Estado: ${mpPaymentInfo.status}`);
    }

    return res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error procesando webhook:', error);
    return res.status(500).send('Internal Server Error');
  }
}

/**
 * Obtener estado de un pago
 */
export async function getPaymentStatus(req, res) {
  try {
    const { paymentId } = req.params;
    const userId = req.user.user_id;

    const paymentRecord = await Payment.findOne({
      where: { 
        payment_id: paymentId,
        // Solo el comprador o vendedor pueden ver el pago
        [Op.or]: [
          { buyer_id: userId },
          { seller_id: userId }
        ]
      },
      include: [
        {
          model: PublishedBooks,
          as: 'PublishedBook',
          include: [
            { model: Book, as: 'Book' }
          ]
        },
        {
          model: User,
          as: 'Buyer',
          attributes: ['user_id', 'first_name', 'last_name', 'email']
        },
        {
          model: User,
          as: 'Seller',
          attributes: ['user_id', 'first_name', 'last_name', 'email']
        }
      ]
    });

    if (!paymentRecord) {
      return error(res, 'Pago no encontrado', 404);
    }

    return success(res, paymentRecord, 'Estado del pago obtenido');

  } catch (error) {
    console.error('❌ Error obteniendo estado del pago:', error);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * Listar pagos del usuario
 */
export async function getUserPayments(req, res) {
  try {
    const userId = req.user.user_id;
    const { type = 'all', status, limit = 20, offset = 0 } = req.query;

    const whereClause = {};
    
    // Filtrar por tipo (compras o ventas)
    if (type === 'purchases') {
      whereClause.buyer_id = userId;
    } else if (type === 'sales') {
      whereClause.seller_id = userId;
    } else {
      whereClause[Op.or] = [
        { buyer_id: userId },
        { seller_id: userId }
      ];
    }

    // Filtrar por estado
    if (status) {
      whereClause.status = status;
    }

    const payments = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PublishedBooks,
          as: 'PublishedBook',
          include: [
            { model: Book, as: 'Book' }
          ]
        },
        {
          model: User,
          as: 'Buyer',
          attributes: ['user_id', 'first_name', 'last_name']
        },
        {
          model: User,
          as: 'Seller',
          attributes: ['user_id', 'first_name', 'last_name']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    return success(res, {
      payments: payments.rows,
      total: payments.count,
      hasMore: payments.count > parseInt(offset) + parseInt(limit)
    }, 'Pagos obtenidos exitosamente');

  } catch (error) {
    console.error('❌ Error obteniendo pagos del usuario:', error);
    return error(res, 'Error interno del servidor', 500);
  }
}

// Funciones auxiliares

/**
 * Mapear estados de MercadoPago a nuestros estados internos
 */
function mapMercadoPagoStatus(mpStatus) {
  const statusMap = {
    'pending': 'pending',
    'approved': 'paid',
    'authorized': 'paid',
    'in_process': 'pending',
    'in_mediation': 'disputed',
    'rejected': 'failed',
    'cancelled': 'cancelled',
    'refunded': 'refunded',
    'charged_back': 'disputed'
  };
  
  return statusMap[mpStatus] || 'pending';
}

/**
 * Crear transacción a partir de un pago aprobado
 */
async function createTransactionFromPayment(paymentRecord) {
  try {
    // Verificar si ya existe una transacción para este pago
    const existingTransaction = await Transaction.findOne({
      where: { payment_id: paymentRecord.payment_id }
    });

    if (existingTransaction) {
      console.log(`ℹ️ Transacción ya existe para pago ${paymentRecord.payment_id}`);
      return existingTransaction;
    }

    // Crear nueva transacción
    const transaction = await Transaction.create({
      published_book_id: paymentRecord.published_book_id,
      seller_id: paymentRecord.seller_id,
      buyer_id: paymentRecord.buyer_id,
      transaction_type: 'sale',
      payment_id: paymentRecord.payment_id,
      amount: paymentRecord.amount,
      status: 'confirmed',
      seller_confirmed: true, // Auto-confirmado porque el pago fue exitoso
      buyer_confirmed: true,  // Auto-confirmado porque el pago fue exitoso
      seller_confirmed_at: new Date(),
      buyer_confirmed_at: new Date()
    });

    console.log(`✅ Transacción creada: ${transaction.transaction_id}`);
    return transaction;

  } catch (error) {
    console.error('❌ Error creando transacción:', error);
    throw error;
  }
} 