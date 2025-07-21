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
const client = new MercadoPagoConfig({ 
  accessToken: MP_ACCESS_TOKEN,
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
    console.log('🔍 Iniciando createPaymentPreference...');
    console.log('🔍 Variables de entorno:', {
      MP_ACCESS_TOKEN_LENGTH: MP_ACCESS_TOKEN ? MP_ACCESS_TOKEN.length : 0,
      FRONTEND_URL,
      BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV
    });
    
    // Verificar variables de entorno críticas
    if (!MP_ACCESS_TOKEN) {
      console.error('❌ MP_ACCESS_TOKEN no está configurado');
      return error(res, 'Configuración de pagos incompleta: MP_ACCESS_TOKEN faltante', 500);
    }
    
    if (!FRONTEND_URL) {
      console.error('❌ FRONTEND_URL no está configurado');
      return error(res, 'Configuración de pagos incompleta: FRONTEND_URL faltante', 500);
    }
    
    if (!BACKEND_URL) {
      console.error('❌ BACKEND_URL no está configurado');
      return error(res, 'Configuración de pagos incompleta: BACKEND_URL faltante', 500);
    }
    
    console.log('✅ MP_ACCESS_TOKEN presente:', MP_ACCESS_TOKEN.substring(0, 20) + '...');
    console.log('✅ FRONTEND_URL:', FRONTEND_URL);
    console.log('✅ BACKEND_URL:', BACKEND_URL);
    
    const { publishedBookId } = req.params;
    const userId = req.user.user_id;
    
    console.log('📋 Parámetros recibidos:', { publishedBookId, userId });
    console.log('👤 Datos del usuario:', {
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      user_id: req.user.user_id
    });

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

    // Preparar URLs de retorno
    const successUrl = `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}`;
    const failureUrl = `${FRONTEND_URL}/payment/failure?payment_id=${paymentRecord.payment_id}`;
    const pendingUrl = `${FRONTEND_URL}/payment/pending?payment_id=${paymentRecord.payment_id}`;
    const notificationUrl = `${BACKEND_URL}/api/payments/webhook`;

    console.log('🔗 URLs configuradas:', {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
      notification: notificationUrl,
      FRONTEND_URL_VALUE: FRONTEND_URL,
      BACKEND_URL_VALUE: BACKEND_URL
    });

    // Validar que las URLs estén bien formadas
    if (!successUrl || successUrl.includes('undefined')) {
      console.error('❌ successUrl está mal formada:', successUrl);
      return error(res, 'Error en configuración de URLs de retorno', 500);
    }

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
        name: req.user.first_name || 'Usuario',
        surname: req.user.last_name || 'LibroConecta',
        email: req.user.email || 'usuario@libroconecta.com'
      },
      external_reference: externalReference,
      notification_url: notificationUrl,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      statement_descriptor: 'LIBROCONECTA',
      metadata: {
        payment_id: paymentRecord.payment_id,
        book_id: publishedBookId,
        buyer_id: userId,
        seller_id: publishedBook.user_id
      }
    };

    console.log('📋 Datos de preferencia a enviar:', JSON.stringify(preferenceData, null, 2));

    // Crear preferencia en MercadoPago
    const mpPreference = await preference.create({ body: preferenceData });

    console.log('✅ Preferencia creada en MercadoPago:', {
      id: mpPreference.id,
      init_point: mpPreference.init_point
    });

    // Actualizar registro con ID de preferencia
    await paymentRecord.update({
      mp_preference_id: mpPreference.id,
      notification_url: notificationUrl,
      success_url: successUrl,
      failure_url: failureUrl,
      pending_url: pendingUrl
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

  } catch (err) {
    console.error('❌ Error creando preferencia de pago:', err);
    console.error('❌ Stack trace completo:', err.stack);
    console.error('❌ Detalles del error:', {
      message: err.message,
      name: err.name,
      code: err.code,
      status: err.status,
      response: err.response?.data || 'No response data'
    });
    
    // Si es un error de MercadoPago, mostrar detalles específicos
    if (err.response && err.response.data) {
      console.error('❌ Error de MercadoPago:', JSON.stringify(err.response.data, null, 2));
      return error(res, `Error de MercadoPago: ${JSON.stringify(err.response.data)}`, 500);
    }
    
    // Enviar más información en desarrollo
    return error(res, `Error interno del servidor: ${err.message}`, 500);
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

  } catch (err) {
    console.error('❌ Error obteniendo estado del pago:', err);
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

  } catch (err) {
    console.error('❌ Error obteniendo pagos del usuario:', err);
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

/**
 * Procesar pago directo usando MercadoPago Payment API
 * Basado en el snippet proporcionado
 */
export async function processDirectPayment(req, res) {
  try {
    console.log('🔄 Procesando pago directo con MercadoPago...');
    console.log('📋 Datos recibidos:', JSON.stringify(req.body, null, 2));

    // Configurar cliente de MercadoPago
    const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN });
    const payment = new MPPayment(client);

    // Procesar el pago
    const result = await payment.create({ body: req.body });
    
    console.log('✅ Pago procesado exitosamente:', JSON.stringify(result, null, 2));

    // Si el pago tiene external_reference, actualizar en la base de datos
    if (result.external_reference) {
      const paymentRecord = await Payment.findOne({
        where: { mp_external_reference: result.external_reference }
      });

      if (paymentRecord) {
        await paymentRecord.update({
          mp_payment_id: result.id.toString(),
          mp_collection_id: result.collection_id,
          mp_collection_status: result.status,
          payment_method: result.payment_method_id,
          payment_date: result.date_approved || new Date(),
          status: mapMercadoPagoStatus(result.status)
        });

        // Si el pago fue aprobado, crear la transacción
        if (result.status === 'approved') {
          await createTransactionFromPayment(paymentRecord);
        }

        console.log(`✅ Pago actualizado en BD: ${paymentRecord.payment_id}`);
      }
    }

    return success(res, result, 'Pago procesado exitosamente', 201);

  } catch (err) {
    console.error('❌ Error procesando pago directo:', err);
    return error(res, `Error procesando pago: ${err.message}`, 500);
  }
} 