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

// Store temporal para tracking de pagos pendientes (en producción usar Redis)
const pendingPayments = new Map();

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

    // Validar que el usuario comprador tenga email válido
    if (!buyerUser.email || !buyerUser.email.includes('@')) {
      return error(res, 'El usuario debe tener un email válido para realizar compras', 400);
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

    // Verificar que las variables de entorno estén definidas
    if (!FRONTEND_URL || !BACKEND_URL) {
      console.error('❌ Variables de entorno no definidas:', { FRONTEND_URL, BACKEND_URL });
      return error(res, 'Error en configuración de URLs', 500);
    }

    // Preparar URLs de retorno según documentación de MercadoPago
    // Usar external_reference en la URL path en lugar de query parameters
    const successUrl = `${FRONTEND_URL}/payment/success?ref=${externalReference}`;
    const failureUrl = `${FRONTEND_URL}/payment/failure?ref=${externalReference}`; 
    const pendingUrl = `${FRONTEND_URL}/payment/pending?ref=${externalReference}`;
    const notificationUrl = `${BACKEND_URL}/api/payments/webhook`;
    
    // Verificar que las URLs no estén corruptas
    const urlsAreValid = [successUrl, failureUrl, pendingUrl, notificationUrl].every(url => 
      url && !url.includes('undefined') && url.startsWith('http')
    );
    
    if (!urlsAreValid) {
      console.error('❌ Una o más URLs están mal formadas:', {
        successUrl, failureUrl, pendingUrl, notificationUrl
      });
      return error(res, 'Error en configuración de URLs', 500);
    }

    console.log('🔗 URLs configuradas:', {
      success: successUrl,
      failure: failureUrl,
      pending: pendingUrl,
      notification: notificationUrl,
      FRONTEND_URL_VALUE: FRONTEND_URL,
      BACKEND_URL_VALUE: BACKEND_URL,
      sin_auto_return: 'usamos_webhook_y_polling'
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
        email: buyerUser.email,
        // Usar información más específica para identificación
        identification: {
          type: 'other',
          number: `USER_${buyerUser.user_id.substring(0, 10)}_${Date.now().toString().slice(-6)}`
        },
        // Agregar información adicional del comprador
        phone: {
          area_code: '+56',
          number: '000000000'
        },
        address: {
          zip_code: '1234567',
          street_name: 'No especificada'
        }
      },
      external_reference: externalReference,
      notification_url: notificationUrl,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: "approved",
      // Configuración de tiempo de expiración
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutos
      statement_descriptor: 'LIBROCONECTA',
      // Configuración mejorada para marketplace
      binary_mode: false,
      // Información adicional para diferenciar transacciones
      additional_info: {
        items: [
          {
            id: publishedBookId,
            title: publishedBook.Book.title,
            description: `Libro: ${publishedBook.Book.title} por ${publishedBook.Book.author}`,
            picture_url: '',
            category_id: 'books',
            quantity: 1,
            unit_price: parseFloat(publishedBook.price)
          }
        ],
        payer: {
          first_name: buyerUser.first_name || buyerUser.username,
          last_name: buyerUser.last_name || 'Usuario',
          phone: {
            area_code: '+56',
            number: '000000000'
          },
          address: {
            street_name: 'Dirección no especificada',
            street_number: 0,
            zip_code: '1234567'
          },
          registration_date: buyerUser.createdAt || new Date().toISOString()
        },
        shipments: {
          receiver_address: {
            zip_code: '1234567',
            street_name: 'Retiro en persona',
            street_number: 0,
            floor: '',
            apartment: ''
          }
        }
      },
      metadata: {
        transaction_id: paymentRecord.payment_id,
        published_book_id: publishedBookId,
        buyer_user_id: userId,
        seller_user_id: publishedBook.user_id,
        book_title: publishedBook.Book.title,
        book_author: publishedBook.Book.author,
        transaction_type: 'book_purchase',
        platform: 'libroconecta',
        timestamp: Date.now()
      }
    };

    console.log('📋 Datos de preferencia a enviar:', JSON.stringify(preferenceData, null, 2));

    // Verificar que las URLs de retorno estén definidas antes de crear la preferencia
    if (!preferenceData.back_urls || !preferenceData.back_urls.success) {
      console.error('❌ back_urls.success no está definida:', preferenceData.back_urls);
      return error(res, 'Error: back_urls.success no está definida', 500);
    }

    // Log extra para debugging del error específico
    console.log('🔍 DEBUGGING - Verificando estructura back_urls:');
    console.log('back_urls objeto completo:', JSON.stringify(preferenceData.back_urls, null, 2));
    console.log('back_urls.success existe?', !!preferenceData.back_urls.success);
    console.log('back_urls.success valor:', preferenceData.back_urls.success);
    console.log('auto_return valor:', preferenceData.auto_return);
    
    // Verificar que las URLs no contengan caracteres problemáticos
    console.log('🔍 VERIFICANDO URLs:');
    console.log('successUrl length:', successUrl.length);
    console.log('successUrl contiene espacios?', successUrl.includes(' '));
    console.log('successUrl contiene undefined?', successUrl.includes('undefined'));
    console.log('successUrl encoded:', encodeURI(successUrl));

    // Log específico para las URLs de retorno
    console.log('🔗 URLs de retorno en preferenceData:', {
      back_urls: preferenceData.back_urls,
      notification_url: preferenceData.notification_url,
      auto_return: preferenceData.auto_return
    });

    // Log final de verificación antes de enviar a MercadoPago
    console.log('🔍 VERIFICACIÓN FINAL ANTES DE MERCADOPAGO:');
    console.log('👤 COMPRADOR:', {
      user_id: buyerUser.user_id,
      email: buyerUser.email,
      name: `${buyerUser.first_name} ${buyerUser.last_name}`,
      identification: preferenceData.payer.identification.number
    });
    console.log('🏪 VENDEDOR:', {
      user_id: publishedBook.user_id,
      email: sellerUser?.email,
      name: `${sellerUser?.first_name} ${sellerUser?.last_name}`
    });
    console.log('📚 LIBRO:', {
      id: publishedBookId,
      title: publishedBook.Book.title,
      price: publishedBook.price
    });

    // Crear preferencia en MercadoPago usando la nueva estructura del SDK
    const mpPreference = await preference.create({
      body: preferenceData
    });

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

    // Almacenar información del pago para redirección automática desde webhook
    pendingPayments.set(paymentRecord.payment_id, {
      externalReference: externalReference,
      buyerId: userId,
      createdAt: Date.now(),
      preferenceId: mpPreference.id
    });

    // Limpiar registros antiguos (más de 1 hora)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, value] of pendingPayments.entries()) {
      if (value.createdAt < oneHourAgo) {
        pendingPayments.delete(key);
      }
    }

    console.log(`📝 Pago rastreado para redirección: ${paymentRecord.payment_id}`);

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
    console.error('❌ Error creando preferencia de pago:', {
      message: err.message,
      error: err.error,
      status: err.status,
      cause: err.cause
    });
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
    console.log('🔔 Webhook recibido de MercadoPago:', {
      headers: req.headers,
      body: req.body,
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });

    const { type, data } = req.body;

    // Solo procesar notificaciones de pago
    if (type === 'payment') {
      const mpPaymentId = data.id;
      
      console.log(`💳 Procesando pago con ID: ${mpPaymentId}`);
      
      // Obtener información del pago desde MercadoPago
      const mpPaymentInfo = await payment.get({ id: mpPaymentId });
      
      console.log('💳 Información completa del pago de MercadoPago:', JSON.stringify(mpPaymentInfo, null, 2));

      // Buscar el pago en nuestra base de datos usando external_reference
      const paymentRecord = await Payment.findOne({
        where: { 
          mp_external_reference: mpPaymentInfo.external_reference 
        }
      });

      if (!paymentRecord) {
        console.error(`❌ Pago no encontrado en BD con external_reference: ${mpPaymentInfo.external_reference}`);
        
        // Intentar buscar por mp_payment_id si existe
        if (mpPaymentId) {
          const altPaymentRecord = await Payment.findOne({
            where: { mp_payment_id: mpPaymentId.toString() }
          });
          
          if (altPaymentRecord) {
            console.log(`✅ Pago encontrado por mp_payment_id: ${mpPaymentId}`);
            await updatePaymentFromWebhook(altPaymentRecord, mpPaymentInfo, mpPaymentId);
            return res.status(200).send('OK');
          }
        }
        
        return res.status(404).send('Payment not found');
      }

      console.log(`📋 Pago encontrado en BD: ${paymentRecord.payment_id}`);

      await updatePaymentFromWebhook(paymentRecord, mpPaymentInfo, mpPaymentId);

      console.log(`✅ Pago actualizado correctamente: ${paymentRecord.payment_id} - Estado: ${mpPaymentInfo.status}`);
    } else {
      console.log(`ℹ️ Notificación no es de tipo 'payment', ignorando: ${type}`);
    }

    return res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error procesando webhook de MercadoPago:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).send('Internal Server Error');
  }
}

/**
 * Actualizar pago desde webhook de MercadoPago
 */
async function updatePaymentFromWebhook(paymentRecord, mpPaymentInfo, mpPaymentId) {
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
    console.log(`✅ Pago aprobado, creando transacción para: ${paymentRecord.payment_id}`);
    await createTransactionFromPayment(paymentRecord);
    
    // Verificar si este pago está siendo rastreado para redirección
    const pendingPayment = pendingPayments.get(paymentRecord.payment_id);
    if (pendingPayment) {
      console.log(`🔄 Iniciando redirección automática para pago: ${paymentRecord.payment_id}`);
      
      // Enviar notificación de redirección al frontend (usando WebSocket o similar)
      // Por ahora, almacenamos que el pago está listo para redirección
      pendingPayments.set(paymentRecord.payment_id, {
        ...pendingPayment,
        status: 'approved',
        readyForRedirect: true,
        redirectUrl: `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}&collection_id=${mpPaymentInfo.collection_id}&collection_status=${mpPaymentInfo.status}`
      });
      
      console.log(`✅ Pago marcado para redirección: ${paymentRecord.payment_id}`);
    }
  }
}

/**
 * Manejar retorno de MercadoPago
 * Esta función maneja los parámetros que MercadoPago envía en las URLs de retorno
 */
export async function handlePaymentReturn(req, res) {
  try {
    console.log('🔙 Retorno de MercadoPago recibido:', {
      query: req.query,
      headers: req.headers,
      method: req.method,
      url: req.url,
      originalUrl: req.originalUrl,
      timestamp: new Date().toISOString()
    });

    // Determinar el tipo de retorno basado en la URL
    const returnType = req.originalUrl.includes('/success') ? 'success' :
                      req.originalUrl.includes('/failure') ? 'failure' :
                      req.originalUrl.includes('/pending') ? 'pending' : 'unknown';

    console.log(`📍 Tipo de retorno detectado: ${returnType}`);

    const { 
      collection_id, 
      collection_status, 
      payment_id, 
      status, 
      external_reference,
      payment_type,
      merchant_order_id,
      preference_id
    } = req.query;

    let frontendPath = '/payment/processing'; // por defecto a processing

    // Determinar la página de destino basada en el tipo de retorno
    switch (returnType) {
      case 'success':
        frontendPath = '/payment/processing'; // Ir a processing, no directamente a success
        break;
      case 'failure':
        frontendPath = '/payment/failure';
        break;
      case 'pending':
        frontendPath = '/payment/processing'; // También ir a processing para pending
        break;
      default:
        frontendPath = '/payment/failure';
    }

    // Si hay información de pago, intentar actualizar nuestro registro
    if (collection_id && external_reference) {
      try {
        // Buscar el pago por external_reference
        const paymentRecord = await Payment.findOne({
          where: { mp_external_reference: external_reference }
        });

        if (paymentRecord) {
          console.log(`✅ Actualizando pago desde retorno: ${paymentRecord.payment_id}`);
          
          // Determinar el estado basado en el tipo de retorno y los parámetros
          let finalStatus = collection_status || status;
          if (returnType === 'success' && !finalStatus) {
            finalStatus = 'approved';
          } else if (returnType === 'failure' && !finalStatus) {
            finalStatus = 'rejected';
          } else if (returnType === 'pending' && !finalStatus) {
            finalStatus = 'pending';
          }

          // Actualizar el estado del pago
          await paymentRecord.update({
            mp_payment_id: collection_id,
            mp_collection_id: collection_id,
            mp_collection_status: finalStatus,
            status: mapMercadoPagoStatus(finalStatus),
            payment_date: finalStatus === 'approved' ? new Date() : paymentRecord.payment_date
          });

          // Crear transacción si fue aprobado
          if (finalStatus === 'approved') {
            await createTransactionFromPayment(paymentRecord);
          }
        }
      } catch (updateError) {
        console.error('❌ Error actualizando pago desde retorno:', updateError);
      }
    }

    // Redireccionar al frontend con los parámetros
    const redirectUrl = new URL(`${FRONTEND_URL}${frontendPath}`);
    
    // Agregar parámetros relevantes
    if (external_reference) {
      // Extraer payment_id de nuestra DB del external_reference
      const paymentRecord = await Payment.findOne({
        where: { mp_external_reference: external_reference }
      });
      if (paymentRecord) {
        redirectUrl.searchParams.set('payment_id', paymentRecord.payment_id);
      }
    }
    
    if (collection_id) redirectUrl.searchParams.set('collection_id', collection_id);
    if (collection_status) redirectUrl.searchParams.set('collection_status', collection_status);
    if (preference_id) redirectUrl.searchParams.set('preference_id', preference_id);
    if (status) redirectUrl.searchParams.set('status', status);

    console.log(`🔄 Redirigiendo a: ${redirectUrl.toString()}`);

    return res.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ Error manejando retorno de MercadoPago:', error);
    
    // Redireccionar a página de error
    const errorUrl = `${FRONTEND_URL}/payment/failure?error=return_processing_failed`;
    return res.redirect(errorUrl);
  }
}

/**
 * Verificar el estado de un pago para redirección automática usando external_reference
 * Este endpoint permite al frontend hacer polling cuando viene desde MercadoPago
 */
export async function checkPaymentRedirectByReference(req, res) {
  try {
    const { externalReference } = req.params;
    
    console.log(`🔍 Verificando redirección para external_reference: ${externalReference}`);
    
    // Buscar el pago por external_reference
    const paymentRecord = await Payment.findOne({
      where: { mp_external_reference: externalReference }
    });
    
    if (!paymentRecord) {
      return error(res, 'Pago no encontrado', 404);
    }
    
    console.log(`📋 Pago encontrado: ${paymentRecord.payment_id} - Estado: ${paymentRecord.status}`);
    
    // Verificar si el pago está marcado para redirección en memoria
    const pendingPayment = pendingPayments.get(paymentRecord.payment_id);
    
    if (pendingPayment && pendingPayment.readyForRedirect) {
      console.log(`✅ Pago listo para redirección: ${paymentRecord.payment_id}`);
      
      // Limpiar el registro una vez que se ha enviado la redirección
      pendingPayments.delete(paymentRecord.payment_id);
      
      return success(res, {
        ready: true,
        payment_id: paymentRecord.payment_id,
        redirectUrl: pendingPayment.redirectUrl,
        status: pendingPayment.status
      }, 'Pago procesado, redirección disponible');
    }
    
    // También verificar en la base de datos
    if (paymentRecord.status === 'paid') {
      const redirectUrl = `${FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}&collection_id=${paymentRecord.mp_collection_id}&collection_status=${paymentRecord.mp_collection_status}`;
      
      return success(res, {
        ready: true,
        payment_id: paymentRecord.payment_id,
        redirectUrl: redirectUrl,
        status: 'paid'
      }, 'Pago completado');
    }
    
    return success(res, {
      ready: false,
      payment_id: paymentRecord.payment_id,
      status: paymentRecord.status
    }, 'Pago aún pendiente');
    
  } catch (err) {
    console.error('❌ Error verificando redirección de pago por referencia:', err);
    return error(res, 'Error verificando estado del pago', 500);
  }
}

/**
 * Verificar el estado de un pago para redirección automática
 * Este endpoint permite al frontend hacer polling para detectar cuando un pago ha sido procesado
 */
export async function checkPaymentRedirect(req, res) {
  try {
    const { paymentId } = req.params;
    
    console.log(`🔍 Verificando redirección para pago: ${paymentId}`);
    
    // Verificar si el pago está marcado para redirección
    const pendingPayment = pendingPayments.get(paymentId);
    
    if (pendingPayment && pendingPayment.readyForRedirect) {
      console.log(`✅ Pago listo para redirección: ${paymentId}`);
      
      // Limpiar el registro una vez que se ha enviado la redirección
      pendingPayments.delete(paymentId);
      
      return success(res, {
        ready: true,
        redirectUrl: pendingPayment.redirectUrl,
        status: pendingPayment.status
      }, 'Pago procesado, redirección disponible');
    }
    
    // También verificar en la base de datos
    const paymentRecord = await Payment.findByPk(paymentId);
    
    if (paymentRecord && paymentRecord.status === 'paid') {
      const redirectUrl = `${FRONTEND_URL}/payment/success?payment_id=${paymentId}&collection_id=${paymentRecord.mp_collection_id}&collection_status=${paymentRecord.mp_collection_status}`;
      
      return success(res, {
        ready: true,
        redirectUrl: redirectUrl,
        status: 'paid'
      }, 'Pago completado');
    }
    
    return success(res, {
      ready: false,
      status: paymentRecord ? paymentRecord.status : 'pending'
    }, 'Pago aún pendiente');
    
  } catch (err) {
    console.error('❌ Error verificando redirección de pago:', err);
    return error(res, 'Error verificando estado del pago', 500);
  }
}

/**
 * Obtener pago por external_reference
 */
export async function getPaymentByReference(req, res) {
  try {
    const { externalReference } = req.params;
    
    const payment = await Payment.findOne({
      where: { mp_external_reference: externalReference },
      include: [
        {
          model: PublishedBooks,
          include: [
            {
              model: Book,
              attributes: ['title', 'author']
            }
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

    if (!payment) {
      return error(res, 'Pago no encontrado', 404);
    }

    return success(res, payment, 'Pago encontrado');
  } catch (err) {
    console.error('Error obteniendo pago por referencia:', err);
    return error(res, 'Error interno del servidor', 500);
  }
}

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