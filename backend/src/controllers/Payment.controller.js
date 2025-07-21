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
  Book,
  Rating,
  Category
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
  console.log('🚨 FUNCIÓN EJECUTADA - createPaymentPreference');
  console.log('🚨 METHOD:', req.method);
  console.log('🚨 URL:', req.url);
  console.log('🚨 PARAMS:', JSON.stringify(req.params));
  console.log('🚨 USER:', req.user ? 'Present' : 'Missing');
  
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
    console.log('👤 Datos del usuario desde req.user:', {
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      user_id: req.user.user_id
    });

    // Obtener datos completos del usuario comprador
    const buyerUser = await User.findByPk(userId);
    if (!buyerUser) {
      return error(res, 'Usuario comprador no encontrado', 404);
    }

    console.log('👤 Datos completos del usuario comprador:', {
      first_name: buyerUser.first_name,
      last_name: buyerUser.last_name,
      email: buyerUser.email,
      username: buyerUser.username,
      user_id: buyerUser.user_id
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

    console.log('📖 Datos del libro encontrado:', {
      published_book_id: publishedBook.published_book_id,
      user_id: publishedBook.user_id,
      book_title: publishedBook.Book?.title,
      book_author: publishedBook.Book?.author,
      price: publishedBook.price
    });

    console.log('🔍 Comparación de usuarios:', {
      libro_owner_id: publishedBook.user_id,
      current_user_id: userId,
      son_iguales: publishedBook.user_id === userId,
      tipos: {
        libro_owner_type: typeof publishedBook.user_id,
        current_user_type: typeof userId
      }
    });

    // Obtener datos del vendedor para comparación
    const sellerUser = await User.findByPk(publishedBook.user_id);
    console.log('🏪 Datos del vendedor:', {
      seller_id: sellerUser?.user_id,
      seller_email: sellerUser?.email,
      seller_name: `${sellerUser?.first_name || ''} ${sellerUser?.last_name || ''}`.trim()
    });

    console.log('⚖️ Comparación comprador vs vendedor:', {
      buyer_email: buyerUser.email,
      seller_email: sellerUser?.email,
      emails_diferentes: buyerUser.email !== sellerUser?.email,
      buyer_name: `${buyerUser.first_name || ''} ${buyerUser.last_name || ''}`.trim(),
      seller_name: `${sellerUser?.first_name || ''} ${sellerUser?.last_name || ''}`.trim()
    });

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
        name: buyerUser.first_name || buyerUser.username || 'Comprador',
        surname: buyerUser.last_name || 'LibroConecta',
        email: buyerUser.email || `usuario_${buyerUser.user_id.substring(0, 8)}@libroconecta.com`,
        // Añadir identificación única para evitar conflictos
        identification: {
          type: 'other',
          number: buyerUser.user_id.substring(0, 15) // Usar parte del UUID como identificador único
        }
      },
      external_reference: externalReference,
      notification_url: notificationUrl,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      // Configuración de tiempo de expiración
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      statement_descriptor: 'LIBROCONECTA',
      // Añadir configuraciones adicionales para evitar detección de auto-pago
      binary_mode: false,
      expires: false,
      marketplace: 'NONE',
      marketplace_fee: 0,
      metadata: {
        payment_id: paymentRecord.payment_id,
        book_id: publishedBookId,
        buyer_id: userId,
        seller_id: publishedBook.user_id,
        buyer_email: buyerUser.email,
        seller_email: sellerUser?.email,
        transaction_timestamp: Date.now()
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
    console.log(`🎯 URL de éxito: ${successUrl}`);

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
 * Obtener historial de compras del usuario
 */
export async function getUserPurchaseHistory(req, res) {
  try {
    const userId = req.user.user_id;
    const { status = 'all', limit = 20, offset = 0 } = req.query;

    const whereClause = {
      buyer_id: userId,
      status: 'paid' // Solo mostrar compras exitosas
    };

    const purchases = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PublishedBooks,
          as: 'PublishedBook',
          include: [
            { 
              model: Book, 
              as: 'Book',
              include: [{
                model: Category,
                as: 'Categories',
                through: { attributes: [] }
              }]
            },
            {
              model: User,
              as: 'User', // Vendedor
              attributes: ['user_id', 'first_name', 'last_name', 'username']
            }
          ]
        },
        {
          model: User,
          as: 'Seller',
          attributes: ['user_id', 'first_name', 'last_name', 'username']
        }
      ],
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Verificar si ya calificó cada transacción
    const purchasesWithRatings = await Promise.all(
      purchases.rows.map(async (purchase) => {
        const existingRating = await Rating.findOne({
          where: {
            rater_id: userId,
            rated_id: purchase.seller_id,
            transaction_id: purchase.payment_id
          }
        });

        return {
          ...purchase.toJSON(),
          has_rated: !!existingRating,
          rating_info: existingRating || null
        };
      })
    );

    return success(res, {
      purchases: purchasesWithRatings,
      total: purchases.count,
      hasMore: purchases.count > parseInt(offset) + parseInt(limit)
    }, 'Historial de compras obtenido exitosamente');

  } catch (err) {
    console.error('❌ Error obteniendo historial de compras:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * Obtener historial de ventas del usuario
 */
export async function getUserSalesHistory(req, res) {
  try {
    const userId = req.user.user_id;
    const { limit = 20, offset = 0 } = req.query;

    const whereClause = {
      seller_id: userId,
      status: 'paid' // Solo mostrar ventas exitosas
    };

    const sales = await Payment.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: PublishedBooks,
          as: 'PublishedBook',
          include: [
            { 
              model: Book, 
              as: 'Book',
              include: [{
                model: Category,
                as: 'Categories',
                through: { attributes: [] }
              }]
            }
          ]
        },
        {
          model: User,
          as: 'Buyer',
          attributes: ['user_id', 'first_name', 'last_name', 'username']
        }
      ],
      order: [['payment_date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Verificar si ya fue calificado por el comprador
    const salesWithRatings = await Promise.all(
      sales.rows.map(async (sale) => {
        const receivedRating = await Rating.findOne({
          where: {
            rater_id: sale.buyer_id,
            rated_id: userId,
            transaction_id: sale.payment_id
          }
        });

        return {
          ...sale.toJSON(),
          buyer_has_rated: !!receivedRating,
          received_rating: receivedRating || null
        };
      })
    );

    return success(res, {
      sales: salesWithRatings,
      total: sales.count,
      hasMore: sales.count > parseInt(offset) + parseInt(limit)
    }, 'Historial de ventas obtenido exitosamente');

  } catch (err) {
    console.error('❌ Error obteniendo historial de ventas:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

/**
 * Calificar una transacción
 */
export async function rateTransaction(req, res) {
  try {
    const { transactionId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.user_id;

    // Validar datos
    if (!rating || rating < 1 || rating > 5) {
      return error(res, 'La calificación debe ser entre 1 y 5', 400);
    }

    // Verificar que la transacción existe y el usuario puede calificarla
    const paymentRecord = await Payment.findOne({
      where: { 
        payment_id: transactionId,
        buyer_id: userId, // Solo el comprador puede calificar
        status: 'paid' // Solo transacciones exitosas
      }
    });

    if (!paymentRecord) {
      return error(res, 'Transacción no encontrada o no autorizada', 404);
    }

    // Verificar si ya calificó esta transacción
    const existingRating = await Rating.findOne({
      where: {
        rater_id: userId,
        rated_id: paymentRecord.seller_id,
        transaction_id: transactionId
      }
    });

    if (existingRating) {
      return error(res, 'Ya has calificado esta transacción', 400);
    }

    // Crear la calificación
    const newRating = await Rating.create({
      rater_id: userId,
      rated_id: paymentRecord.seller_id,
      transaction_id: transactionId,
      rating: parseInt(rating),
      comment: comment || null
    });

    console.log(`✅ Calificación creada: ${newRating.rating_id} - ${rating} estrellas para usuario ${paymentRecord.seller_id}`);

    return success(res, newRating, 'Calificación guardada exitosamente', 201);

  } catch (err) {
    console.error('❌ Error guardando calificación:', err);
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

    // 🚀 NUEVO: Marcar el libro como vendido
    await PublishedBooks.update(
      { status: 'sold' },
      { where: { published_book_id: paymentRecord.published_book_id } }
    );

    console.log(`✅ Transacción creada: ${transaction.transaction_id}`);
    console.log(`📚 Libro marcado como vendido: ${paymentRecord.published_book_id}`);
    
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