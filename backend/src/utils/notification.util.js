// Utilidades para formatear notificaciones de los nuevos sistemas

// Formatear notificación de nuevo match
export function formatMatchNotification(matchData) {
  return {
    type: 'match',
    title: '¡Nuevo Match!',
    message: `Tienes un nuevo match con ${matchData.otherUser.first_name} ${matchData.otherUser.last_name}`,
    data: {
      match_id: matchData.match_id,
      user_id: matchData.otherUser.user_id,
      compatibility_score: matchData.compatibility_score,
    },
    timestamp: new Date().toISOString(),
  };
}

// Formatear notificación de nuevo mensaje
export function formatMessageNotification(messageData) {
  return {
    type: 'message',
    title: 'Nuevo Mensaje',
    message: `${messageData.sender.first_name} te ha enviado un mensaje`,
    data: {
      match_id: messageData.match_id,
      message_id: messageData.message_id,
      sender_id: messageData.sender_id,
      preview: messageData.message_text.substring(0, 50) + (messageData.message_text.length > 50 ? '...' : ''),
    },
    timestamp: messageData.sent_at,
  };
}

// Formatear notificación de nueva calificación
export function formatRatingNotification(ratingData) {
  return {
    type: 'rating',
    title: 'Nueva Calificación',
    message: `${ratingData.rater.first_name} te ha calificado con ${ratingData.rating} estrellas`,
    data: {
      rating_id: ratingData.rating_id,
      rater_id: ratingData.rater_id,
      rating: ratingData.rating,
      transaction_type: ratingData.exchange_id ? 'exchange' : 'sell',
    },
    timestamp: ratingData.created_at,
  };
}

// Formatear notificación de calificación pendiente
export function formatPendingRatingNotification(transactionData) {
  return {
    type: 'pending_rating',
    title: 'Calificación Pendiente',
    message: `No olvides calificar tu ${transactionData.transaction_type === 'exchange' ? 'intercambio' : 'compra/venta'} con ${transactionData.other_first_name}`,
    data: {
      transaction_id: transactionData.transaction_id,
      transaction_type: transactionData.transaction_type,
      other_user_id: transactionData.other_user_id,
      book_title: transactionData.book_title,
    },
    timestamp: new Date().toISOString(),
  };
}

// Formatear notificación de match sugerido
export function formatSuggestedMatchNotification(suggestionData) {
  return {
    type: 'suggested_match',
    title: 'Match Sugerido',
    message: `${suggestionData.user.first_name} podría interesarte (${suggestionData.compatibility.commonCategories} intereses en común)`,
    data: {
      suggested_user_id: suggestionData.user.user_id,
      compatibility_score: suggestionData.compatibility.score,
      common_categories: suggestionData.compatibility.commonCategories,
      location_match: suggestionData.compatibility.locationMatch,
    },
    timestamp: new Date().toISOString(),
  };
}

// Formatear notificación de conversación activa
export function formatActiveConversationNotification(conversationData) {
  return {
    type: 'active_conversation',
    title: 'Conversación Activa',
    message: `Tienes ${conversationData.unread_count} mensajes sin leer`,
    data: {
      match_id: conversationData.match_id,
      unread_count: conversationData.unread_count,
      last_message_date: conversationData.last_message.date,
    },
    timestamp: new Date().toISOString(),
  };
}

// Generar resumen de notificaciones
export function generateNotificationSummary(notifications) {
  const summary = {
    total: notifications.length,
    byType: {},
    unreadCount: 0,
    latestTimestamp: null,
  };

  notifications.forEach(notification => {
    // Contar por tipo
    if (!summary.byType[notification.type]) {
      summary.byType[notification.type] = 0;
    }
    summary.byType[notification.type]++;

    // Contar no leídos
    if (!notification.read) {
      summary.unreadCount++;
    }

    // Encontrar timestamp más reciente
    if (!summary.latestTimestamp || notification.timestamp > summary.latestTimestamp) {
      summary.latestTimestamp = notification.timestamp;
    }
  });

  return summary;
}

// Agrupar notificaciones por tipo
export function groupNotificationsByType(notifications) {
  const grouped = {};

  notifications.forEach(notification => {
    if (!grouped[notification.type]) {
      grouped[notification.type] = [];
    }
    grouped[notification.type].push(notification);
  });

  return grouped;
}

// Filtrar notificaciones por fecha
export function filterNotificationsByDate(notifications, startDate, endDate) {
  return notifications.filter(notification => {
    const notificationDate = new Date(notification.timestamp);
    return notificationDate >= startDate && notificationDate <= endDate;
  });
}

// Marcar notificaciones como leídas
export function markNotificationsAsRead(notifications) {
  return notifications.map(notification => ({
    ...notification,
    read: true,
    readAt: new Date().toISOString(),
  }));
}

// Priorizar notificaciones
export function prioritizeNotifications(notifications) {
  const priorityOrder = {
    'rating': 1,
    'message': 2,
    'match': 3,
    'pending_rating': 4,
    'suggested_match': 5,
    'active_conversation': 6,
  };

  return notifications.sort((a, b) => {
    const aPriority = priorityOrder[a.type] || 10;
    const bPriority = priorityOrder[b.type] || 10;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Si tienen la misma prioridad, ordenar por fecha (más reciente primero)
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}

// Generar texto de notificación personalizado
export function generatePersonalizedMessage(type, userData, contextData) {
  const templates = {
    match: `¡Hola ${userData.first_name}! Tienes un nuevo match con ${contextData.otherUser.first_name}. ¡Pueden tener ${contextData.compatibility.commonCategories} intereses en común!`,
    message: `${userData.first_name}, ${contextData.sender.first_name} te escribió: "${contextData.preview}"`,
    rating: `${userData.first_name}, ${contextData.rater.first_name} te calificó con ${contextData.rating} estrellas${contextData.comment ? ': "' + contextData.comment + '"' : ''}`,
    pending_rating: `${userData.first_name}, no olvides calificar tu ${contextData.transaction_type === 'exchange' ? 'intercambio' : 'compra/venta'} del libro "${contextData.book_title}"`,
  };

  return templates[type] || `${userData.first_name}, tienes una nueva notificación`;
}

// Validar estructura de notificación
export function validateNotificationStructure(notification) {
  const requiredFields = ['type', 'title', 'message', 'timestamp'];
  const optionalFields = ['data', 'read', 'readAt', 'priority'];
  
  // Verificar campos requeridos
  for (const field of requiredFields) {
    if (!notification.hasOwnProperty(field)) {
      return { valid: false, error: `Campo requerido faltante: ${field}` };
    }
  }

  // Verificar tipos de notificación válidos
  const validTypes = ['match', 'message', 'rating', 'pending_rating', 'suggested_match', 'active_conversation'];
  if (!validTypes.includes(notification.type)) {
    return { valid: false, error: `Tipo de notificación inválido: ${notification.type}` };
  }

  // Verificar formato de timestamp
  if (!notification.timestamp || isNaN(Date.parse(notification.timestamp))) {
    return { valid: false, error: 'Timestamp inválido' };
  }

  return { valid: true };
}

// Limpiar notificaciones antiguas
export function cleanupOldNotifications(notifications, maxAge = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - maxAge);

  return notifications.filter(notification => {
    return new Date(notification.timestamp) > cutoffDate;
  });
}

// Generar ID único para notificación
export function generateNotificationId() {
  return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 