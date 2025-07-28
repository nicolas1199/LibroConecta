import { useState, useEffect } from 'react';
import { getPendingChatRequestsCount } from '../api/chatRequests';
import { getConversations } from '../api/messages';
import { getMatches } from '../api/matches';
import { getPendingRatings } from '../api/ratings';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState({
    chatRequests: 0,
    unreadMessages: 0,
    newMatches: 0,
    pendingRatings: 0,
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
      
      // Obtener matches para contar nuevos matches
      const matchesResponse = await getMatches();
      const matches = matchesResponse.data || [];
      const newMatchesCount = matches.filter(match => {
        // Considerar como "nuevo" si tiene menos de 24 horas
        const matchDate = new Date(match.date_match);
        const now = new Date();
        const hoursDiff = (now - matchDate) / (1000 * 60 * 60);
        return hoursDiff < 24;
      }).length;
      
      // Obtener calificaciones pendientes
      const pendingRatingsResponse = await getPendingRatings();
      const pendingRatingsCount = pendingRatingsResponse.data?.length || 0;
      
      const total = chatRequestsCount + unreadMessagesCount + newMatchesCount + pendingRatingsCount;
      
      setNotifications({
        chatRequests: chatRequestsCount,
        unreadMessages: unreadMessagesCount,
        newMatches: newMatchesCount,
        pendingRatings: pendingRatingsCount,
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