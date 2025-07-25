import { useState, useEffect, useRef } from "react";
import { useNotifications } from "../hooks/useNotifications";
import Clock from "./icons/Clock";
import X from "./icons/X";
import Star from "./icons/Star";
import MessageCircle from "./icons/MessageCircle";
import Heart from "./icons/Heart";
import ArrowLeftRight from "./icons/ArrowLeftRight";
import Users from "./icons/Users";

export default function NotificationDropdown({ isOpen, onClose }) {
  const { notifications: notificationCounts, loading } = useNotifications();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      // Crear notificaciones basadas en los conteos reales
      const realNotifications = [];
      
      // Notificación de solicitudes de chat pendientes
      if (notificationCounts.chatRequests > 0) {
        realNotifications.push({
          id: 'chat-requests',
          type: "chat_request",
          title: "Solicitudes de chat pendientes",
          message: `Tienes ${notificationCounts.chatRequests} solicitud${notificationCounts.chatRequests > 1 ? 'es' : ''} de chat pendiente${notificationCounts.chatRequests > 1 ? 's' : ''}`,
          timestamp: new Date().toISOString(),
          read: false,
          icon: Users,
          color: "purple",
          count: notificationCounts.chatRequests
        });
      }
      
      // Notificación de mensajes no leídos
      if (notificationCounts.unreadMessages > 0) {
        realNotifications.push({
          id: 'unread-messages',
          type: "message",
          title: "Mensajes no leídos",
          message: `Tienes ${notificationCounts.unreadMessages} mensaje${notificationCounts.unreadMessages > 1 ? 's' : ''} sin leer`,
          timestamp: new Date().toISOString(),
          read: false,
          icon: MessageCircle,
          color: "blue",
          count: notificationCounts.unreadMessages
        });
      }
      
      setNotifications(realNotifications);
    } catch (error) {
      console.error("Error al cargar notificaciones:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // TODO: Implementar API call para marcar como leída
      // await api.patch(`/api/notifications/${notificationId}/read`);
      
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error("Error al marcar notificación como leída:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: Implementar API call para marcar todas como leídas
      // await api.patch('/api/notifications/read-all');
      
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (error) {
      console.error("Error al marcar todas las notificaciones como leídas:", error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      // TODO: Implementar API call para eliminar notificación
      // await api.delete(`/api/notifications/${notificationId}`);
      
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error("Error al eliminar notificación:", error);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now - time) / 1000);
    
    if (diffInSeconds < 60) return "Ahora";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`;
    return time.toLocaleDateString();
  };

  const getIconColor = (color) => {
    const colors = {
      blue: "text-blue-600 bg-blue-50",
      green: "text-green-600 bg-green-50",
      red: "text-red-600 bg-red-50",
      yellow: "text-yellow-600 bg-yellow-50",
      gray: "text-gray-600 bg-gray-50"
    };
    return colors[color] || colors.gray;
  };

  if (!isOpen) return null;

  return (
    <div ref={dropdownRef} className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
        <div className="flex items-center space-x-2">
          {notifications.some(n => !n.read) && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Marcar todas como leídas
            </button>
          )}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {loadingNotifications ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No tienes notificaciones</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(notification => {
              const IconComponent = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-gray-50 transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${getIconColor(notification.color)}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-700' : 'text-gray-500'}`}>
                        {notification.message}
                      </p>
                      {notification.count && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2">
                          {notification.count}
                        </span>
                      )}
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                        >
                          Marcar como leída
                        </button>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
} 