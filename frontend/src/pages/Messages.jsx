import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getConversations, getMessages, sendMessage, markMessagesAsRead } from "../api/messages";
import MessageCircle from "../components/icons/MessageCircle";
import Users from "../components/icons/Users";
import ArrowLeft from "../components/icons/ArrowLeft";
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
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadConversations();
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
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
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
        <div className="bg-white p-4 border-b border-gray-200 flex items-center space-x-3">
          <Link
            to="/dashboard/messages"
            className="md:hidden p-2 -ml-2 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {selectedConversation.other_user.first_name} {selectedConversation.other_user.last_name}
            </h3>
            <p className="text-sm text-gray-600">
              Match desde {formatDate(selectedConversation.date_match)}
            </p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.length > 0 ? (
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
                placeholder="Escribe un mensaje..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sendingMessage}
              />
            </div>
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
  }, [selectedConversation, messages, currentUser, newMessage, sendingMessage, handleSendMessage, formatDate]);

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
        </div>
      )}
    </div>
  );
} 