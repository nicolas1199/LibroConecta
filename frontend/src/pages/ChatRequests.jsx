import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getReceivedChatRequests, 
  getSentChatRequests, 
  respondToChatRequest 
} from "../api/chatRequests";
import DashboardLayout from "../layouts/DashboardLayout";
import ArrowLeft from "../components/icons/ArrowLeft";
import MessageCircle from "../components/icons/MessageCircle";
import CheckCircle from "../components/icons/CheckCircle";
import X from "../components/icons/X";
import Clock from "../components/icons/Clock";
import Users from "../components/icons/Users";

export default function ChatRequests() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("received");
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingTo, setRespondingTo] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [receivedData, sentData] = await Promise.all([
        getReceivedChatRequests("pending"),
        getSentChatRequests()
      ]);

      setReceivedRequests(receivedData.data || []);
      setSentRequests(sentData.data || []);
    } catch (error) {
      console.error("Error loading chat requests:", error);
      setError("Error al cargar las solicitudes de chat");
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (requestId, response) => {
    try {
      setRespondingTo(requestId);
      await respondToChatRequest(requestId, response);
      
      // Recargar datos
      await loadData();
      
      // Si se aceptó, redirigir a mensajes
      if (response === "accepted") {
        navigate("/dashboard/messages");
      }
    } catch (error) {
      console.error("Error responding to chat request:", error);
      setError("Error al responder a la solicitud");
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: "bg-yellow-100 text-yellow-800", text: "Pendiente" },
      accepted: { color: "bg-green-100 text-green-800", text: "Aceptada" },
      rejected: { color: "bg-red-100 text-red-800", text: "Rechazada" }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const renderReceivedRequest = (request) => (
    <div key={request.request_id} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {request.Requester?.first_name?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {request.Requester?.first_name} {request.Requester?.last_name}
            </h3>
            <p className="text-sm text-gray-600">@{request.Requester?.username}</p>
          </div>
        </div>
        <div className="text-right">
          {getStatusBadge(request.status)}
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      {request.Book && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-1">Libro de interés</h4>
          <p className="text-sm text-gray-600">
            {request.Book.Book?.title} - {request.Book.Book?.author}
          </p>
        </div>
      )}

      {request.message && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">{request.message}</p>
        </div>
      )}

      {request.status === "pending" && (
        <div className="flex space-x-3">
          <button
            onClick={() => handleRespond(request.request_id, "accepted")}
            disabled={respondingTo === request.request_id}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {respondingTo === request.request_id ? (
              <>
                <div className="spinner border-white border-t-transparent mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceptar
              </>
            )}
          </button>
          <button
            onClick={() => handleRespond(request.request_id, "rejected")}
            disabled={respondingTo === request.request_id}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {respondingTo === request.request_id ? (
              <>
                <div className="spinner border-white border-t-transparent mr-2" />
                Procesando...
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Rechazar
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

  const renderSentRequest = (request) => (
    <div key={request.request_id} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
            {request.Receiver?.first_name?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {request.Receiver?.first_name} {request.Receiver?.last_name}
            </h3>
            <p className="text-sm text-gray-600">@{request.Receiver?.username}</p>
          </div>
        </div>
        <div className="text-right">
          {getStatusBadge(request.status)}
          <p className="text-xs text-gray-500 mt-1">
            {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      {request.Book && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-1">Libro de interés</h4>
          <p className="text-sm text-gray-600">
            {request.Book.Book?.title} - {request.Book.Book?.author}
          </p>
        </div>
      )}

      {request.message && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">{request.message}</p>
        </div>
      )}

      {request.status === "accepted" && (
        <div className="mt-4">
          <button
            onClick={() => navigate("/dashboard/messages")}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Ir al Chat
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>

          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Solicitudes de Chat
            </h1>
            <p className="text-gray-600">
              Gestiona las solicitudes de chat que has enviado y recibido
            </p>
          </div>
        </div>

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("received")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "received"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Recibidas ({receivedRequests.length})</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab("sent")}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === "sent"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>Enviadas ({sentRequests.length})</span>
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === "received" ? (
              receivedRequests.length > 0 ? (
                receivedRequests.map(renderReceivedRequest)
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay solicitudes recibidas
                  </h3>
                  <p className="text-gray-600">
                    Cuando alguien te envíe una solicitud de chat, aparecerá aquí.
                  </p>
                </div>
              )
            ) : (
              sentRequests.length > 0 ? (
                sentRequests.map(renderSentRequest)
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay solicitudes enviadas
                  </h3>
                  <p className="text-gray-600">
                    Las solicitudes de chat que envíes aparecerán aquí.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 