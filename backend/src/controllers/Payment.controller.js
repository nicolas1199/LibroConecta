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
    const { publishedBookId } = req.params;
    const userId = req.user.user_id;

    console.log('🔍 Iniciando createPaymentPreference...');
    console.log('🔍 Variables de entorno:', {
      MP_ACCESS_TOKEN_LENGTH: process.env.MP_ACCESS_TOKEN?.length || 0,
      FRONTEND_URL: process.env.FRONTEND_URL,
      BACKEND_URL: process.env.BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV
    });

    // Verificar credenciales
    if (!process.env.MP_ACCESS_TOKEN) {
      console.error('❌ MP_ACCESS_TOKEN no configurado');
      return error(res, 'Configuración de pagos no disponible', 500);
    }

    if (!process.env.FRONTEND_URL || !process.env.BACKEND_URL) {
      console.error('❌ URLs no configuradas');
      return error(res, 'Configuración de URLs no disponible', 500);
    }

    console.log('✅ MP_ACCESS_TOKEN presente:', process.env.MP_ACCESS_TOKEN.substring(0, 20) + '...');
    console.log('✅ FRONTEND_URL:', process.env.FRONTEND_URL);
    console.log('✅ BACKEND_URL:', process.env.BACKEND_URL);

    console.log('📋 Parámetros recibidos:', {
      publishedBookId,
      userId
    });

    // Obtener datos del usuario comprador
    const buyerUser = await User.findByPk(userId);
    if (!buyerUser) {
      return error(res, 'Usuario no encontrado', 404);
    }

    console.log('👤 Datos del usuario desde req.user:', {
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      email: req.user.email,
      user_id: req.user.user_id
    });

    console.log('👤 Datos completos del usuario comprador:', {
      first_name: buyerUser.first_name,
      last_name: buyerUser.last_name,
      email: buyerUser.email,
      username: buyerUser.username,
      user_id: buyerUser.user_id
    });

    // Obtener datos del libro publicado
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
      book_title: publishedBook.Book.title,
      book_author: publishedBook.Book.author,
      price: publishedBook.price
    });

    // Verificar que el usuario no esté comprando su propio libro
    console.log('🔍 Comparación de usuarios:', {
      libro_owner_id: publishedBook.user_id,
      current_user_id: userId,
      son_iguales: publishedBook.user_id === userId,
      tipos: {
        libro_owner_type: typeof publishedBook.user_id,
        current_user_type: typeof userId
      }
    });

    if (publishedBook.user_id === userId) {
      return error(res, 'No puedes comprar tu propio libro', 400);
    }

    // Obtener datos del vendedor
    const sellerUser = await User.findByPk(publishedBook.user_id);
    if (!sellerUser) {
      return error(res, 'Vendedor no encontrado', 404);
    }

    console.log('�� Datos del vendedor:', {
      seller_id: sellerUser.user_id,
      seller_email: sellerUser.email,
      seller_name: `${sellerUser.first_name} ${sellerUser.last_name}`
    });

    console.log('⚖️ Comparación comprador vs vendedor:', {
      buyer_email: buyerUser.email,
      seller_email: sellerUser.email,
      emails_diferentes: buyerUser.email !== sellerUser.email,
      buyer_name: `${buyerUser.first_name} ${buyer.last_name}`,
      seller_name: `${sellerUser.first_name} ${sellerUser.last_name}`
    });

    // Verificar que el libro esté disponible
    if (publishedBook.status !== 'available') {
      return error(res, 'El libro no está disponible para la venta', 400);
    }

    // Generar external_reference único
    const timestamp = Date.now();
    const externalReference = `LIBRO_${publishedBookId}_${userId}_${timestamp}`;

    console.log('🔗 Configurando URLs hardcodeadas para MercadoPago');

    // Configurar URLs de retorno
    const successUrl = `${process.env.FRONTEND_URL}/payment/processing?external_reference=${externalReference}&status=approved`;
    const failureUrl = `${process.env.FRONTEND_URL}/payment/failure?external_reference=${externalReference}&status=rejected`;
    const pendingUrl = `${process.env.FRONTEND_URL}/payment/processing?external_reference=${externalReference}&status=pending`;

    console.log('🔍 Validando URLs antes de enviar a MercadoPago:');
    console.log('✅ success URL:', successUrl);
    console.log('✅ failure URL:', failureUrl);
    console.log('✅ pending URL:', pendingUrl);
    console.log('✅ notification URL:', `${process.env.BACKEND_URL}/api/payments/webhook`);
    console.log('✅ auto_return: approved');

    // Verificar que las URLs sean válidas
    const isValidUrl = (string) => {
      try {
        new URL(string);
        return true;
      } catch (_) {
        return false;
      }
    };

    if (!isValidUrl(successUrl)) {
      throw new Error(`URL de éxito inválida: ${successUrl}`);
    }

    if (!isValidUrl(failureUrl)) {
      throw new Error(`URL de fallo inválida: ${failureUrl}`);
    }

    if (!isValidUrl(pendingUrl)) {
      throw new Error(`URL de pendiente inválida: ${pendingUrl}`);
    }

    // Preparar datos para MercadoPago - Estructura exacta según documentación oficial
    const preferenceData = {
      items: [
        {
          id: publishedBookId.toString(),
          title: publishedBook.Book.title,
          description: `${publishedBook.Book.title} por ${publishedBook.Book.author}`,
          quantity: 1,
          currency_id: 'CLP',
          unit_price: parseFloat(publishedBook.price)
        }
      ],
      external_reference: externalReference,
      notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`,
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl
      },
      auto_return: "approved",
      binary_mode: false,
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      payer: {
        name: buyerUser.first_name || buyerUser.username || 'Comprador',
        surname: buyerUser.last_name || 'LibroConecta',
        email: buyerUser.email
      },
      metadata: {
        published_book_id: publishedBookId.toString(),
        buyer_id: userId,
        seller_id: publishedBook.user_id,
        book_title: publishedBook.Book.title,
        integration_source: 'LibroConecta'
      },
      statement_descriptor: 'LIBROCONECTA'
    };

    console.log('🔧 Formato preparado para MercadoPago con auto_return:');
    console.log('   - back_urls (plural): true');
    console.log('   - auto_return configurado: approved');
    console.log('   - Estructura compatible con PHP docs: true');

    console.log('📋 Datos de preferencia a enviar:', JSON.stringify(preferenceData, null, 2));

    // Verificación final antes de enviar a MercadoPago
    console.log('🔍 VERIFICACIÓN FINAL ANTES DE MERCADOPAGO:');
    console.log('👤 COMPRADOR:', {
      user_id: userId,
      email: buyerUser.email,
      name: `${buyerUser.first_name} ${buyerUser.last_name}`
    });
    console.log('🏪 VENDEDOR:', {
      user_id: publishedBook.user_id,
      email: sellerUser.email,
      name: `${sellerUser.first_name} ${sellerUser.last_name}`
    });
    console.log('📚 LIBRO:', {
      id: publishedBookId,
      title: publishedBook.Book.title,
      price: publishedBook.price
    });

    // Intentar crear preferencia con diferentes formatos
    let preferenceResult;
    let errorMessage = '';

    try {
      console.log('🔄 Creando preferencia con API directa (formato oficial)...');
      preferenceResult = await preference.create({ body: preferenceData });
      console.log('✅ Preferencia creada con formato estándar');
    } catch (error) {
      console.log('❌ Error con formato estándar:', {
        message: error.message,
        error: error.error,
        status: error.status,
        cause: error.cause
      });
      errorMessage = error.message;

      try {
        console.log('🔄 Intentando con back_url (singular)...');
        const alternativeData = {
          ...preferenceData,
          back_url: preferenceData.back_urls,
          auto_return: "approved"
        };
        delete alternativeData.back_urls;
        preferenceResult = await preference.create({ body: alternativeData });
        console.log('✅ Preferencia creada con back_url singular');
      } catch (error2) {
        console.log('❌ Error con back_url singular:', {
          message: error2.message,
          error: error2.error,
          status: error2.status,
          cause: error2.cause
        });

        try {
          console.log('🔄 Último intento: sin auto_return...');
          const finalData = { ...preferenceData };
          delete finalData.auto_return;
          preferenceResult = await preference.create({ body: finalData });
          console.log('✅ Preferencia creada SIN auto_return');
        } catch (error3) {
          console.log('❌ Error final:', {
            message: error3.message,
            error: error3.error,
            status: error3.status,
            cause: error3.cause
          });
          throw new Error(`No se pudo crear la preferencia: ${error3.message}`);
        }
      }
    }

    console.log('✅ Preferencia creada en MercadoPago:', {
      id: preferenceResult.id,
      init_point: preferenceResult.init_point
    });

    // Crear registro de pago en nuestra base de datos
    const paymentRecord = await Payment.create({
      payment_id: uuidv4(),
      published_book_id: publishedBookId,
      buyer_id: userId,
      seller_id: publishedBook.user_id,
      amount: parseFloat(publishedBook.price),
      mp_external_reference: externalReference,
      mp_preference_id: preferenceResult.id,
      status: 'pending',
      payment_date: new Date()
    });

    console.log('✅ Preferencia de pago creada:', preferenceResult.id, 'para libro', publishedBookId);

    // 🚀 NUEVO: Marcar el libro como "reserved" cuando se crea el pago
    await PublishedBooks.update(
      { status: 'reserved' },
      { where: { published_book_id: publishedBookId } }
    );

    console.log('📚 Libro marcado como reservado:', publishedBookId);

    // Configurar redirección automática
    const successRedirectUrl = `${process.env.FRONTEND_URL}/payment/success`;
    
    // Almacenar información para redirección automática
    pendingPayments.set(paymentRecord.payment_id, {
      externalReference,
      publishedBookId,
      buyerId: userId,
      sellerId: publishedBook.user_id,
      amount: parseFloat(publishedBook.price),
      status: 'pending',
      createdAt: new Date(),
      redirectUrl: successRedirectUrl
    });

    console.log('🎯 URL de éxito:', successRedirectUrl);
    console.log('📝 Pago rastreado para redirección:', paymentRecord.payment_id);

    return success(res, {
      preference_id: preferenceResult.id,
      init_point: preferenceResult.init_point,
      external_reference: externalReference,
      payment_id: paymentRecord.payment_id
    }, 'Preferencia de pago creada exitosamente');

  } catch (error) {
    console.error('❌ Error creando preferencia de pago:', error);
    return error(res, `Error creando preferencia: ${error.message}`, 500);
  }
}

/**
 * Manejar webhook de MercadoPago
 * Esta función procesa las notificaciones que MercadoPago envía cuando cambia el estado de un pago
 */
export async function handlePaymentWebhook(req, res) {
  try {
    console.log('🔔 Webhook recibido de MercadoPago:', {
      headers: req.headers,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString()
    });

    // MercadoPago puede enviar diferentes tipos de notificaciones
    // Manejar casos donde req.body puede ser undefined
    const body = req.body || {};
    const { type, data } = body;
    const { id, topic } = req.query;

    // Responder inmediatamente con 200 para confirmar recepción
    res.status(200).send('OK');

    // Procesar solo notificaciones de pago
    const paymentId = data?.id || id;
    const notificationType = type || topic;

    if (notificationType === 'payment' && paymentId) {
      console.log(`💳 Procesando notificación de pago ID: ${paymentId}`);
      
      // Obtener información del pago desde MercadoPago
      const mpPaymentInfo = await payment.get({ id: paymentId });
      
      console.log('💳 Información del pago:', {
        id: mpPaymentInfo.id,
        status: mpPaymentInfo.status,
        external_reference: mpPaymentInfo.external_reference,
        payment_method_id: mpPaymentInfo.payment_method_id,
        date_approved: mpPaymentInfo.date_approved
      });

      // Buscar el pago en nuestra base de datos
      const paymentRecord = await Payment.findOne({
        where: { 
          mp_external_reference: mpPaymentInfo.external_reference 
        }
      });

      if (!paymentRecord) {
        console.error(`❌ Pago no encontrado con external_reference: ${mpPaymentInfo.external_reference}`);
        return;
      }

      console.log(`📋 Actualizando pago: ${paymentRecord.payment_id}`);
      await updatePaymentFromWebhook(paymentRecord, mpPaymentInfo, paymentId);

      console.log(`✅ Pago actualizado: ${paymentRecord.payment_id} - Estado: ${mpPaymentInfo.status}`);
    } else {
      console.log(`ℹ️ Notificación no procesable - Tipo: ${notificationType}, ID: ${paymentId}`);
      console.log(`📋 Body recibido:`, JSON.stringify(body, null, 2));
      console.log(`📋 Query recibido:`, JSON.stringify(req.query, null, 2));
    }

  } catch (error) {
    console.error('❌ Error procesando webhook:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    // No retornar error para evitar que MercadoPago reintente
  }
}

/**
 * Actualizar pago desde webhook de MercadoPago
 */
async function updatePaymentFromWebhook(paymentRecord, mpPaymentInfo, mpPaymentId) {
  try {
    console.log(`🔄 Actualizando pago ${paymentRecord.payment_id} con estado: ${mpPaymentInfo.status}`);
    
    // Actualizar información del pago
    const updateData = {
      mp_payment_id: mpPaymentId.toString(),
      mp_collection_id: mpPaymentInfo.collection_id,
      mp_collection_status: mpPaymentInfo.status,
      payment_method: mpPaymentInfo.payment_method_id,
      payment_date: mpPaymentInfo.date_approved || new Date(),
      status: mapMercadoPagoStatus(mpPaymentInfo.status)
    };

    await paymentRecord.update(updateData);

    console.log(`✅ Pago actualizado: ${paymentRecord.payment_id} - Estado: ${mpPaymentInfo.status}`);

    // Manejar diferentes estados del pago
    switch (mpPaymentInfo.status) {
      case 'approved':
        console.log(`✅ Pago aprobado, creando transacción para: ${paymentRecord.payment_id}`);
        await createTransactionFromPayment(paymentRecord);
        
        // Verificar si este pago está siendo rastreado para redirección
        const pendingPayment = pendingPayments.get(paymentRecord.payment_id);
        if (pendingPayment) {
          console.log(`🔄 Iniciando redirección automática para pago: ${paymentRecord.payment_id}`);
          
          pendingPayments.set(paymentRecord.payment_id, {
            ...pendingPayment,
            status: 'approved',
            readyForRedirect: true,
            redirectUrl: `${process.env.FRONTEND_URL}/payment/success?payment_id=${paymentRecord.payment_id}&collection_id=${mpPaymentInfo.collection_id}&collection_status=${mpPaymentInfo.status}`
          });
          
          console.log(`✅ Pago marcado para redirección: ${paymentRecord.payment_id}`);
        }
        break;

      case 'rejected':
      case 'cancelled':
        console.log(`❌ Pago rechazado/cancelado: ${paymentRecord.payment_id}`);
        
        // Marcar el libro como disponible nuevamente
        await PublishedBooks.update(
          { status: 'available' },
          { where: { published_book_id: paymentRecord.published_book_id } }
        );
        
        console.log(`📚 Libro marcado como disponible nuevamente: ${paymentRecord.published_book_id}`);
        break;

      case 'pending':
        console.log(`⏳ Pago pendiente: ${paymentRecord.payment_id}`);
        // El libro ya está marcado como 'reserved', mantener ese estado
        break;

      case 'in_process':
        console.log(`🔄 Pago en proceso: ${paymentRecord.payment_id}`);
        // Mantener el libro como 'reserved'
        break;

      default:
        console.log(`ℹ️ Estado de pago no manejado: ${mpPaymentInfo.status} para pago: ${paymentRecord.payment_id}`);
    }

  } catch (error) {
    console.error(`❌ Error actualizando pago ${paymentRecord.payment_id}:`, error);
    throw error;
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

    // Si el pago está pendiente y tenemos mp_payment_id, verificar con MercadoPago
    if (paymentRecord.status === 'pending' && paymentRecord.mp_payment_id) {
      try {
        console.log(`🔍 Verificando estado en MercadoPago para pago: ${paymentRecord.mp_payment_id}`);
        const mpPaymentInfo = await payment.get({ id: paymentRecord.mp_payment_id });
        
        // Actualizar estado si cambió
        if (mpPaymentInfo.status !== paymentRecord.mp_collection_status) {
          console.log(`🔄 Actualizando estado de ${paymentRecord.mp_collection_status} a ${mpPaymentInfo.status}`);
          
          await paymentRecord.update({
            mp_collection_status: mpPaymentInfo.status,
            status: mapMercadoPagoStatus(mpPaymentInfo.status),
            payment_date: mpPaymentInfo.date_approved || paymentRecord.payment_date
          });

          // Si se aprobó, crear transacción
          if (mpPaymentInfo.status === 'approved') {
            await createTransactionFromPayment(paymentRecord);
          }
        }
      } catch (mpError) {
        console.error('❌ Error verificando con MercadoPago:', mpError);
        // Continuar con el estado local
      }
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