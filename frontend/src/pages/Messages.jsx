import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getConversations, getMessages, sendMessage, markMessagesAsRead } from "../api/messages";
import { 
  getReceivedChatRequests, 
  getSentChatRequests, 
  respondToChatRequest 
} from "../api/chatRequests";
import MessageCircle from "../components/icons/MessageCircle";
import Users from "../components/icons/Users";
import ArrowLeft from "../components/icons/ArrowLeft";
import Clock from "../components/icons/Clock";
import CheckCircle from "../components/icons/CheckCircle";
import X from "../components/icons/X";
import ProfileImage from "../components/ProfileImage";
import { Link } from "react-router-dom";

export default function Messages() {
  const { matchId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  
  // Estados para solicitudes de chat
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState("conversations"); // "conversations", "received", "sent"
  const [notification, setNotification] = useState(null);
  
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadConversations();
    loadChatRequests();
  }, []);

  useEffect(() => {
    if (matchId) {
      loadMessages(matchId);
    }
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.data || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Error al cargar las conversaciones");
    } finally {
      setLoading(false);
    }
  };

  const loadChatRequests = async () => {
    try {
      setLoadingRequests(true);
      const [receivedResponse, sentResponse] = await Promise.all([
        getReceivedChatRequests("pending"),
        getSentChatRequests()
      ]);
      
      setReceivedRequests(receivedResponse.data || []);
      setSentRequests(sentResponse.data || []);
    } catch (error) {
      console.error("Error loading chat requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadMessages = async (matchId) => {
    try {
      const response = await getMessages(matchId);
      setMessages(response.data || []);
      
      // Encontrar la conversación seleccionada
      const conversation = conversations.find(c => c.match_id === parseInt(matchId));
      if (conversation) {
        setSelectedConversation(conversation);
        // Marcar mensajes como leídos
        await markMessagesAsRead(matchId);
      }
    } catch (error) {
      console.error("Error loading messages:", error);
      setError("Error al cargar los mensajes");
    }
  };

  const handleSendMessage = React.useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await sendMessage(selectedConversation.match_id, newMessage);
      setMessages(prev => [...prev, response.data]);
      setNewMessage("");
      
      // Actualizar la conversación en la lista
      setConversations(prev => 
        prev.map(conv => 
          conv.match_id === selectedConversation.match_id 
            ? { ...conv, last_message: newMessage, last_message_date: new Date() }
            : conv
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation]);

  const handleRespondToRequest = async (requestId, response) => {
    try {
      await respondToChatRequest(requestId, response);
      
      // Mostrar notificación
      const message = response === 'accepted' 
        ? 'Solicitud aceptada. ¡Ya puedes chatear!' 
        : 'Solicitud rechazada.';
      
      showNotification(message, response === 'accepted' ? 'success' : 'info');
      
      // Recargar solicitudes
      await loadChatRequests();
      
      // Si fue aceptada, recargar conversaciones
      if (response === 'accepted') {
        await loadConversations();
        // Cambiar a la pestaña de conversaciones
        setActiveTab("conversations");
      }
    } catch (error) {
      console.error("Error responding to request:", error);
      showNotification("Error al responder a la solicitud", "error");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return "Hoy";
    } else if (diffDays === 2) {
      return "Ayer";
    } else if (diffDays < 7) {
      return `${diffDays} días`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Componente para mostrar solicitudes recibidas
  const ReceivedRequestsList = React.useMemo(() => (
    <div className="bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Solicitudes de Chat</h2>
            <p className="text-sm text-gray-600 mt-1">Solicitudes pendientes de respuesta</p>
          </div>
          <button
            onClick={loadChatRequests}
            disabled={loadingRequests}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refrescar solicitudes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto h-full">
        {loadingRequests ? (
          <div className="flex justify-center py-8">
            <div className="spinner border-gray-300 border-t-blue-600"></div>
          </div>
        ) : receivedRequests.length > 0 ? (
          receivedRequests.map((request) => (
            <div
              key={request.request_id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {request.requester.first_name} {request.requester.last_name}
                    </p>
                    <span className="text-xs text-gray-500">
                      {formatDate(request.created_at)}
                    </span>
                  </div>
                  
                  {request.book && (
                    <p className="text-xs text-gray-600 mb-2">
                      Interesado en: <span className="font-medium">{request.book.title}</span>
                    </p>
                  )}
                  
                  {request.message && (
                    <p className="text-sm text-gray-700 mb-3 bg-gray-50 p-2 rounded">
                      "{request.message}"
                    </p>
                  )}
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleRespondToRequest(request.request_id, 'accepted')}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200 transition-colors"
                    >
                      <CheckCircle className="h-3 w-3" />
                      <span>Aceptar</span>
                    </button>
                    <button
                      onClick={() => handleRespondToRequest(request.request_id, 'rejected')}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200 transition-colors"
                    >
                      <X className="h-3 w-3" />
                      <span>Rechazar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay solicitudes pendientes
            </h3>
            <p className="text-gray-600">
              No tienes solicitudes de chat por responder
            </p>
          </div>
        )}
      </div>
    </div>
  ), [loadingRequests, receivedRequests, handleRespondToRequest, formatDate, loadChatRequests]);

  // Componente para mostrar solicitudes enviadas
  const SentRequestsList = React.useMemo(() => (
    <div className="bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Solicitudes Enviadas</h2>
            <p className="text-sm text-gray-600 mt-1">Solicitudes que has enviado</p>
          </div>
          <button
            onClick={loadChatRequests}
            disabled={loadingRequests}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="Refrescar solicitudes"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="overflow-y-auto h-full">
        {loadingRequests ? (
          <div className="flex justify-center py-8">
            <div className="spinner border-gray-300 border-t-blue-600"></div>
          </div>
        ) : sentRequests.length > 0 ? (
          sentRequests.map((request) => (
            <div
              key={request.request_id}
              className="p-4 border-b border-gray-100 hover:bg-gray-50"
            >
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {request.receiver.first_name} {request.receiver.last_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : request.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {request.status === 'pending' ? 'Pendiente' : 
                         request.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(request.created_at)}
                      </span>
                    </div>
                  </div>
                  
                  {request.book && (
                    <p className="text-xs text-gray-600 mb-2">
                      Interesado en: <span className="font-medium">{request.book.title}</span>
                    </p>
                  )}
                  
                  {request.message && (
                    <p className="text-sm text-gray-700 mb-2 bg-gray-50 p-2 rounded">
                      "{request.message}"
                    </p>
                  )}
                  
                  {request.status === 'accepted' && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ Solicitud aceptada - Ya puedes chatear
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay solicitudes enviadas
            </h3>
            <p className="text-gray-600">
              No has enviado solicitudes de chat aún
            </p>
          </div>
        )}
      </div>
    </div>
  ), [loadingRequests, sentRequests, formatDate, loadChatRequests]);

  // Componente separado para evitar re-renderizados
  const ConversationList = React.useMemo(() => (
    <div className="bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Conversaciones</h2>
      </div>
      
      <div className="overflow-y-auto h-full">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="spinner border-gray-300 border-t-blue-600"></div>
          </div>
        ) : conversations.length > 0 ? (
          conversations.map((conversation) => {
            // Verificar si hay una solicitud pendiente para esta conversación
            const pendingRequest = sentRequests.find(request => 
              request.receiver.user_id === conversation.other_user.user_id && 
              request.status === 'pending'
            );
            
            return (
              <Link
                key={conversation.match_id}
                to={`/dashboard/messages/${conversation.match_id}`}
                className={`block p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                  selectedConversation?.match_id === conversation.match_id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ProfileImage
                    user={conversation.other_user}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {conversation.other_user.first_name} {conversation.other_user.last_name}
                        </p>
                        {pendingRequest && (
                          <Clock className="h-3 w-3 text-yellow-500" title="Solicitud pendiente" />
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        {conversation.unread_count > 0 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {conversation.unread_count}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {conversation.last_message_date && formatDate(conversation.last_message_date)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {pendingRequest ? (
                        <span className="text-yellow-600">
                          Solicitud de chat pendiente
                        </span>
                      ) : (
                        conversation.last_message || "No hay mensajes aún"
                      )}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay conversaciones
            </h3>
            <p className="text-gray-600">
              Haz match con alguien para empezar a chatear
            </p>
          </div>
        )}
      </div>
    </div>
  ), [loading, conversations, selectedConversation, formatDate, sentRequests]);

  // Componente de navegación por pestañas
  const TabNavigation = React.useMemo(() => (
    <div className="bg-white border-r border-gray-200">
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("conversations")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "conversations"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Conversaciones
          {conversations.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs rounded-full px-2 py-1">
              {conversations.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("received")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "received"
              ? "text-purple-600 border-b-2 border-purple-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Recibidas
          {receivedRequests.length > 0 && (
            <span className="ml-2 bg-purple-100 text-purple-800 text-xs rounded-full px-2 py-1">
              {receivedRequests.length}
            </span>
          )}
        </button>
        
        <button
          onClick={() => setActiveTab("sent")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === "sent"
              ? "text-green-600 border-b-2 border-green-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Enviadas
          {sentRequests.length > 0 && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs rounded-full px-2 py-1">
              {sentRequests.length}
            </span>
          )}
        </button>
      </div>
    </div>
  ), [activeTab, conversations.length, receivedRequests.length, sentRequests.length]);

  const ChatArea = React.useCallback(() => {
    if (!selectedConversation) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecciona una conversación
            </h3>
            <p className="text-gray-600">
              Elige una conversación para empezar a chatear
            </p>
          </div>
        </div>
      );
    }

    // Verificar si hay una solicitud pendiente para esta conversación
    const pendingRequest = sentRequests.find(request => 
      request.receiver.user_id === selectedConversation.other_user.user_id && 
      request.status === 'pending'
    );

    return (
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white p-4 border-b border-gray-200 flex items-center space-x-3">
          <Link
            to="/dashboard/messages"
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <ProfileImage
            user={selectedConversation.other_user}
            size="md"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {selectedConversation.other_user.first_name} {selectedConversation.other_user.last_name}
            </h3>
            <p className="text-sm text-gray-600">
              Match desde {formatDate(selectedConversation.date_match)}
            </p>
            {pendingRequest && (
              <div className="flex items-center space-x-2 mt-1">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-xs text-yellow-600 font-medium">
                  Solicitud de chat pendiente
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {pendingRequest ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Solicitud de chat pendiente
                </h3>
                <p className="text-yellow-700 mb-4">
                  Has enviado una solicitud de chat a {selectedConversation.other_user.first_name}. 
                  No puedes enviar mensajes hasta que acepte tu solicitud.
                </p>
                {pendingRequest.message && (
                  <div className="bg-white border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Tu mensaje:</span> "{pendingRequest.message}"
                    </p>
                  </div>
                )}
                <div className="flex items-center justify-center space-x-2 text-sm text-yellow-600">
                  <Clock className="h-4 w-4" />
                  <span>Esperando respuesta...</span>
                </div>
              </div>
            </div>
          ) : messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.message_id}
                className={`flex ${
                  message.sender_id === currentUser.user_id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender_id === currentUser.user_id
                      ? "bg-blue-600"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  <p className={`text-sm ${
                    message.sender_id === currentUser.user_id ? "text-white" : "text-gray-900"
                  }`}>
                    {message.message_text}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender_id === currentUser.user_id ? "text-blue-200" : "text-gray-500"
                    }`}
                  >
                    {new Date(message.sent_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No hay mensajes aún</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white p-4 border-t border-gray-200">
          <form onSubmit={handleSendMessage} className="flex space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={pendingRequest ? "Esperando respuesta de la solicitud..." : "Escribe un mensaje..."}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                disabled={sendingMessage || pendingRequest}
              />
            </div>
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim() || pendingRequest}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sendingMessage ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    );
  }, [selectedConversation, messages, currentUser, newMessage, sendingMessage, handleSendMessage, formatDate, sentRequests]);

  // Determinar qué lista mostrar basado en la pestaña activa
  const getActiveList = () => {
    switch (activeTab) {
      case "received":
        return ReceivedRequestsList;
      case "sent":
        return SentRequestsList;
      default:
        return ConversationList;
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile: Show either conversation list or chat */}
      <div className="md:hidden flex-1">
        {matchId ? ChatArea() : (
          <div className="h-full">
            {TabNavigation}
            {getActiveList()}
          </div>
        )}
      </div>

      {/* Desktop: Show both side by side */}
      <div className="hidden md:flex flex-1">
        <div className="w-1/3 min-w-0">
          {TabNavigation}
          {getActiveList()}
        </div>
        {ChatArea()}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : notification.type === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center space-x-2">
            {notification.type === 'success' && (
              <CheckCircle className="h-5 w-5" />
            )}
            {notification.type === 'error' && (
              <X className="h-5 w-5" />
            )}
            {notification.type === 'info' && (
              <Clock className="h-5 w-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
} 