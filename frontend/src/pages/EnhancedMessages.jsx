import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getConversations, getMessages, sendTextMessage, sendImageMessage, markMessagesAsRead } from "../api/messages";
import { getExchangeInfo, completeExchange } from "../api/exchanges";
import MessageCircle from "../components/icons/MessageCircle";
import Users from "../components/icons/Users";
import ArrowLeft from "../components/icons/ArrowLeft";
import Camera from "../components/icons/Camera";
import Paperclip from "../components/icons/Paperclip";
import Star from "../components/icons/Star";
import CheckCircle from "../components/icons/CheckCircle";
import ProfileImage from "../components/ProfileImage";
import { Link } from "react-router-dom";
import socket from "../api/socket";
import { useNotifications } from "../hooks/useNotifications";

export default function EnhancedMessages() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [error, setError] = useState(null);
  const [exchangeInfo, setExchangeInfo] = useState(null);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const { refreshNotifications } = useNotifications();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (matchId) {
      loadMessages(matchId);
      loadExchangeInfo(matchId);
    }
  }, [matchId, conversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Unirse a la room de usuario al montar si está autenticado
    if (currentUser && currentUser.user_id) {
      socket.emit("join_user_room", currentUser.user_id);
    }
    // Escuchar evento de nuevo mensaje por socket.io
    socket.on("new_message", (data) => {
      refreshNotifications();
      // Opcional: puedes actualizar el estado de mensajes aquí si quieres
    });
    return () => {
      socket.off("new_message");
    };
  }, [currentUser?.user_id]);

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

  const loadMessages = async (matchId) => {
    try {
      const response = await getMessages(matchId);
      setMessages(response.data || []);
      
      // Si conversations aún no está disponible, cargarlo primero
      let conversationsList = conversations;
      if (conversations.length === 0) {
        const conversationsResponse = await getConversations();
        conversationsList = conversationsResponse.data || [];
        setConversations(conversationsList);
      }
      
      // Encontrar la conversación seleccionada
      const conversation = conversationsList.find(c => c.match_id === parseInt(matchId));
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

  const loadExchangeInfo = async (matchId) => {
    try {
      const response = await getExchangeInfo(matchId);
      setExchangeInfo(response.data);
    } catch (error) {
      console.error("Error loading exchange info:", error);
      // No mostrar error aquí, puede que no sea un intercambio
    }
  };

  const handleSendMessage = React.useCallback(async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await sendTextMessage(selectedConversation.match_id, newMessage);
      setMessages(prev => [...prev, response.data]);
      setNewMessage("");
      
      // Actualizar la conversación en la lista
      setConversations(prev => 
        prev.map(conv => 
          conv.match_id === selectedConversation.match_id 
            ? { ...conv, last_message: { text: newMessage, date: new Date(), is_from_me: true } }
            : conv
        )
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSendingMessage(false);
    }
  }, [newMessage, selectedConversation]);

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es demasiado grande. Máximo 5MB permitido');
      return;
    }

    try {
      setSendingMessage(true);
      const response = await sendImageMessage(selectedConversation.match_id, file);
      setMessages(prev => [...prev, response.data]);
      setShowImageUpload(false);
      
      // Actualizar la conversación en la lista
      setConversations(prev => 
        prev.map(conv => 
          conv.match_id === selectedConversation.match_id 
            ? { ...conv, last_message: { text: "📷 Imagen", date: new Date(), is_from_me: true } }
            : conv
        )
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Error al enviar la imagen");
    } finally {
      setSendingMessage(false);
      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCompleteExchange = async () => {
    if (!selectedConversation) return;

    try {
      await completeExchange(selectedConversation.match_id);
      await loadExchangeInfo(selectedConversation.match_id);
      setError(null);
      // Mostrar mensaje de éxito
      alert("¡Intercambio completado! Ahora puedes calificar al otro usuario.");
    } catch (error) {
      console.error("Error completing exchange:", error);
      setError("Error al completar el intercambio");
    }
  };

  const handleGoToRating = () => {
    if (!selectedConversation || !exchangeInfo) return;
    
    // Navegar a la página de calificaciones con parámetros
    navigate(`/dashboard/ratings?match_id=${selectedConversation.match_id}&user_id=${exchangeInfo.other_user.user_id}&type=exchange`);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  const renderMessage = (message) => {
    const isFromMe = message.sender_id === currentUser.user_id;
    
    return (
      <div
        key={message.message_id}
        className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isFromMe
              ? "bg-blue-600 text-white"
              : "bg-white border border-gray-200 text-gray-900"
          }`}
        >
          {/* Render mensaje de texto */}
          {message.message_type === 'text' && (
            <p className={`text-sm ${isFromMe ? "text-white" : "text-gray-900"}`}>
              {message.message_text}
            </p>
          )}
          
          {/* Render mensaje de imagen */}
          {message.message_type === 'image' && (
            <div className="space-y-2">
              {message.image_data && (
                <img 
                  src={message.image_data} 
                  alt={message.image_filename || "Imagen"}
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    // Abrir imagen en nueva pestaña
                    const newWindow = window.open();
                    newWindow.document.write(`<img src="${message.image_data}" style="max-width:100%;height:auto;" />`);
                  }}
                />
              )}
              {message.message_text && (
                <p className={`text-sm ${isFromMe ? "text-white" : "text-gray-900"}`}>
                  {message.message_text}
                </p>
              )}
            </div>
          )}
          
          <p
            className={`text-xs mt-1 ${
              isFromMe ? "text-blue-200" : "text-gray-500"
            }`}
          >
            {new Date(message.sent_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    );
  };

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
          conversations.map((conversation) => (
            <Link
              key={conversation.match_id}
              to={`/dashboard/messages/${conversation.match_id}`}
              className={`block p-4 hover:bg-gray-50 border-b border-gray-100 transition-colors ${
                selectedConversation?.match_id === conversation.match_id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <ProfileImage user={conversation.other_user} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {conversation.other_user.first_name} {conversation.other_user.last_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {conversation.unread_count}
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        {conversation.last_message?.sent_at && formatDate(conversation.last_message.sent_at)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.last_message ? (
                      conversation.last_message.is_from_me ? (
                        <span className="text-gray-500">Tú: {conversation.last_message.message_text}</span>
                      ) : (
                        conversation.last_message.message_text
                      )
                    ) : (
                      "No hay mensajes aún"
                    )}
                  </p>
                </div>
              </div>
            </Link>
          ))
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
  ), [loading, conversations, selectedConversation, formatDate]);

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

    return (
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                to="/dashboard/messages"
                className="md:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <ProfileImage user={selectedConversation.other_user} size="md" />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {selectedConversation.other_user.first_name} {selectedConversation.other_user.last_name}
                </h3>
                <p className="text-sm text-gray-600">
                  Match desde {formatDate(selectedConversation.date_match)}
                </p>
              </div>
            </div>
            
            {/* Botones de intercambio */}
            {exchangeInfo && (
              <div className="flex items-center space-x-2">
                {!exchangeInfo.is_completed ? (
                  <button
                    onClick={handleCompleteExchange}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center space-x-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Completar Intercambio</span>
                  </button>
                ) : (
                  <button
                    onClick={handleGoToRating}
                    className="bg-yellow-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-yellow-700 transition-colors flex items-center space-x-1"
                  >
                    <Star className="h-4 w-4" />
                    <span>Calificar</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length > 0 ? (
            messages.map(renderMessage)
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
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            {/* Botón de imagen */}
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                title="Enviar imagen"
              >
                <Camera className="h-5 w-5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            {/* Input de texto */}
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingMessage}
              />
            </div>
            
            {/* Botón enviar */}
            <button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="btn btn-primary"
            >
              {sendingMessage ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    );
  }, [selectedConversation, messages, currentUser, newMessage, sendingMessage, handleSendMessage, formatDate, exchangeInfo]);

  return (
    <div className="h-screen flex flex-col">
      {/* Mobile: Show either conversation list or chat */}
      <div className="md:hidden flex-1">
        {matchId ? ChatArea() : ConversationList}
      </div>

      {/* Desktop: Show both side by side */}
      <div className="hidden md:flex flex-1">
        <div className="w-1/3 min-w-0">
          {ConversationList}
        </div>
        {ChatArea()}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
