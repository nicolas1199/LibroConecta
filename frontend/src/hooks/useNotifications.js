import { useState, useEffect } from 'react';
import { getUserNotifications } from '../api/notifications';

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
      
      // Obtener notificaciones desde la API
      const response = await getUserNotifications();
      const notificationData = response.data;
      
      // Extraer datos del summary
      const {
        chatRequests = 0,
        unreadMessages = 0,
        newMatches = 0,
        pendingRatings = 0
      } = notificationData.summary || {};
      
      const total = notificationData.total || 0;
      
      setNotifications({
        chatRequests,
        unreadMessages,
        newMatches,
        pendingRatings,
        total
      });
    } catch (error) {
      console.error('Error loading notifications:', error);
      // En caso de error, mantener valores por defecto
      setNotifications({
        chatRequests: 0,
        unreadMessages: 0,
        newMatches: 0,
        pendingRatings: 0,
        total: 0
      });
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