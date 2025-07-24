import { useState, useEffect } from 'react';
import { getPendingChatRequestsCount } from '../api/chatRequests';
import { getConversations } from '../api/messages';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState({
    chatRequests: 0,
    unreadMessages: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      // Obtener conteo de solicitudes de chat pendientes
      const chatRequestsResponse = await getPendingChatRequestsCount();
      const chatRequestsCount = chatRequestsResponse.data?.count || 0;
      
      // Obtener conversaciones para contar mensajes no leídos
      const conversationsResponse = await getConversations();
      const conversations = conversationsResponse.data || [];
      const unreadMessagesCount = conversations.reduce((total, conv) => {
        return total + (conv.unread_count || 0);
      }, 0);
      
      const total = chatRequestsCount + unreadMessagesCount;
      
      setNotifications({
        chatRequests: chatRequestsCount,
        unreadMessages: unreadMessagesCount,
        total
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    
    // Recargar notificaciones cada 30 segundos
    const interval = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    loading,
    refreshNotifications: loadNotifications
  };
}; 