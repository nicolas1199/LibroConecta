import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getConversations, getMessages, sendTextMessage, sendImageMessage, markMessagesAsRead } from "../api/messages";
import { getExchangeInfo, completeExchange } from "../api/exchanges";
import MessageCircle from "../components/icons/MessageCircle";
import Users from "../components/icons/Users";
import ArrowLeft from "../components/icons/ArrowLeft";
import ImageIcon from "../components/icons/ImageIcon";
import Paperclip from "../components/icons/Paperclip";
import CheckCircle from "../components/icons/CheckCircle";
import Star from "../components/icons/Star";
import X from "../components/icons/X"; // Para cerrar el modal
import ProfileImage from "./ProfileImage";
import { Link } from "react-router-dom";

export default function EnhancedMessages() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [exchangeInfo, setExchangeInfo] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);
  const [showExchangeActions, setShowExchangeActions] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false); // Nuevo estado para el modal
  const [exchangeCompleted, setExchangeCompleted] = useState(false); // Para track del intercambio
  const [debugInfo, setDebugInfo] = useState(null); // Para debuggear
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (matchId) {
      loadMessages(matchId);
      loadExchangeInfo(matchId);
    }
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: Monitorear cambios en showRatingModal
  useEffect(() => {
    console.log("🔍 showRatingModal cambió a:", showRatingModal);
  }, [showRatingModal]);

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
      
      const conversation = conversations.find(c => c.match_id === parseInt(matchId));
      if (conversation) {
        setSelectedConversation(conversation);
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
      
      // Mostrar acciones de intercambio si es un intercambio activo
      setShowExchangeActions(!response.data.is_completed);
    } catch (error) {
      console.error("Error loading exchange info:", error);
      // No mostrar error si no es un intercambio
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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedConversation) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    try {
      setUploadingImage(true);
      
      // Convertir imagen a base64
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Enviar mensaje con imagen
      const response = await sendImageMessage(
        selectedConversation.match_id, 
        base64Image,
        newMessage || '' // Caption opcional
      );
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage("");
      
      setConversations(prev => 
        prev.map(conv => 
          conv.match_id === selectedConversation.match_id 
            ? { ...conv, last_message: "📷 Imagen", last_message_date: new Date() }
            : conv
        )
      );
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Error al enviar la imagen");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCompleteExchange = async () => {
    try {
      console.log("🎯 Iniciando completar intercambio...");
      console.log("📊 Estado actual - showRatingModal:", showRatingModal);
      
      await completeExchange(selectedConversation.match_id);
      console.log("✅ Intercambio completado exitosamente");
      
      setShowExchangeActions(false);
      setExchangeInfo(prev => ({ ...prev, is_completed: true }));
      setExchangeCompleted(true);
      
      console.log("🔔 Configurando timer para mostrar modal...");
      setDebugInfo("Timer configurado, esperando 1 segundo...");
      
      // Mostrar modal de calificación después de completar
      setTimeout(() => {
        console.log("🎭 Timer ejecutado - Mostrando modal de calificación");
        console.log("📊 Estado antes de setShowRatingModal(true):", showRatingModal);
        setShowRatingModal(true);
        console.log("📊 Estado después de setShowRatingModal(true):", true);
        setDebugInfo("Modal debería estar visible ahora");
        
        // Verificar que el estado se actualizó correctamente
        setTimeout(() => {
          console.log("🔍 Verificación - showRatingModal debería ser true ahora");
        }, 100);
      }, 1000); // Mostrar después de 1 segundo
      
      // Recargar información del intercambio
      loadExchangeInfo(selectedConversation.match_id);
    } catch (error) {
      console.error("Error completing exchange:", error);
      setError("Error al completar el intercambio");
    }
  };

  const handleGoToReview = () => {
    if (exchangeInfo && exchangeInfo.users) {
      // Encontrar el otro usuario
      const otherUser = exchangeInfo.users.find(user => user.user_id !== currentUser.user_id);
      if (otherUser) {
        navigate(`/dashboard/ratings?review_user=${otherUser.user_id}&match_id=${selectedConversation.match_id}`);
      }
    }
    setShowRatingModal(false);
    setDebugInfo(null);
  };

  const handleSkipRating = () => {
    setShowRatingModal(false);
    setDebugInfo(null);
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
    const isMyMessage = message.sender_id === currentUser.user_id;
    
    return (
      <div
        key={message.message_id}
        className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isMyMessage
              ? "bg-blue-600"
              : "bg-white border border-gray-200"
          }`}
        >
          {message.message_type === 'image' ? (
            <div>
              <img 
                src={message.image_url} 
                alt="Imagen enviada"
                className="rounded-lg max-w-full h-auto mb-2"
                style={{ maxHeight: '200px' }}
              />
              {message.message_text && (
                <p className={`text-sm ${isMyMessage ? "text-white" : "text-gray-900"}`}>
                  {message.message_text}
                </p>
              )}
            </div>
          ) : (
            <p className={`text-sm ${isMyMessage ? "text-white" : "text-gray-900"}`}>
              {message.message_text}
            </p>
          )}
          <p
            className={`text-xs mt-1 ${
              isMyMessage ? "text-blue-200" : "text-gray-500"
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
                    {conversation.last_message || "No hay mensajes aún"}
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
            
            {/* Exchange Actions */}
            {showExchangeActions && exchangeInfo && (
              <div className="flex space-x-2">
                <button
                  onClick={handleCompleteExchange}
                  className="btn btn-success btn-sm flex items-center space-x-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Completar Intercambio</span>
                </button>
                <button
                  onClick={handleGoToReview}
                  className="btn btn-primary btn-sm flex items-center space-x-1"
                >
                  <Star className="h-4 w-4" />
                  <span>Calificar</span>
                </button>
              </div>
            )}
          </div>

          {/* Exchange Status */}
          {exchangeInfo && exchangeInfo.is_completed && (
            <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800">Intercambio completado</span>
                <button
                  onClick={handleGoToReview}
                  className="ml-auto text-sm text-green-600 hover:text-green-800 flex items-center space-x-1"
                >
                  <Star className="h-4 w-4" />
                  <span>Calificar</span>
                </button>
              </div>
            </div>
          )}
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
            <div className="flex-1 flex items-end space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingMessage || uploadingImage}
              />
              
              {/* Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={sendingMessage || uploadingImage}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Enviar imagen"
              >
                {uploadingImage ? (
                  <div className="spinner w-5 h-5" />
                ) : (
                  <ImageIcon className="h-5 w-5" />
                )}
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            
            <button
              type="submit"
              disabled={sendingMessage || uploadingImage || (!newMessage.trim() && !uploadingImage)}
              className="btn btn-primary"
            >
              {sendingMessage ? "..." : "Enviar"}
            </button>
          </form>
        </div>
      </div>
    ), [selectedConversation, messages, currentUser, newMessage, sendingMessage, uploadingImage, handleSendMessage, formatDate, exchangeInfo, showExchangeActions]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Existing sidebar code */}
      <div className="w-1/3 bg-white border-r border-gray-200">
        {ConversationList}
      </div>

      {/* Existing main content */}
      <div className="flex-1 flex flex-col">
        {matchId ? ChatArea() : (
          <div className="flex-1 flex items-center justify-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Selecciona una conversación
            </h3>
            <p className="text-gray-600">
              Elige una conversación para empezar a chatear
            </p>
          </div>
        )}
      </div>

      {/* Modal de Calificación */}
      {showRatingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            {console.log("🎭 Modal renderizado correctamente")}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                ¡Intercambio Completado! 🎉
              </h3>
              <button
                onClick={handleSkipRating}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-2">
                El intercambio se ha completado exitosamente.
              </p>
              <p className="text-sm text-gray-500">
                ¿Te gustaría calificar tu experiencia con este intercambio?
              </p>
            </div>

            {exchangeInfo && (
              <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">
                  Detalles del intercambio:
                </h4>
                <div className="space-y-1 text-sm text-gray-600">
                  {exchangeInfo.users?.map((user, index) => (
                    <div key={user.user_id} className="flex justify-between">
                      <span>{user.name}</span>
                      <span>{user.books?.length || 0} libro(s)</span>
                    </div>
                  ))}
                  <div className="border-t pt-1 mt-2">
                    <span className="font-medium">Total de libros: {exchangeInfo.total_books || 0}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleGoToReview}
                className="flex-1 btn btn-primary flex items-center justify-center space-x-2"
              >
                <Star className="h-4 w-4" />
                <span>Calificar Ahora</span>
              </button>
              <button
                onClick={handleSkipRating}
                className="flex-1 btn btn-secondary"
              >
                Más Tarde
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-3">
              Puedes calificar más tarde desde tu perfil
            </p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {exchangeCompleted && !showRatingModal && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-40">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>¡Intercambio completado exitosamente!</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}
