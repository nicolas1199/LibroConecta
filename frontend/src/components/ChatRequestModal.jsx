import React, { useState } from "react";
import { createChatRequest } from "../api/chatRequests";
import X from "./icons/X";
import MessageCircle from "./icons/MessageCircle";
import ProfileImage from "./ProfileImage";

export default function ChatRequestModal({ 
  isOpen, 
  onClose, 
  book, 
  receiverUser, 
  onSuccess 
}) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!receiverUser?.user_id) {
      setError("Usuario no válido");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await createChatRequest(
        receiverUser.user_id,
        book?.published_book_id || null,
        message.trim() || null
      );

      // Limpiar formulario
      setMessage("");
      onSuccess?.();
      onClose();
    } catch (error) {
      setError(error.message || "Error al enviar la solicitud");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMessage("");
      setError("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <MessageCircle className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              Solicitar Chat
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Información del libro */}
          {book && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">
                Libro de interés
              </h3>
              <div className="flex items-start space-x-3">
                {book.PublishedBookImages?.[0]?.image_data ? (
                  <img
                    src={book.PublishedBookImages[0].image_data}
                    alt={book.Book?.title}
                    className="w-12 h-16 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-16 bg-gray-200 rounded border flex items-center justify-center">
                    <span className="text-gray-500 text-xs">Sin imagen</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {book.Book?.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {book.Book?.author || "Autor desconocido"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {book.TransactionType?.transaction_type}
                    {book.price && ` - $${book.price}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Información del usuario */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">
              Enviar solicitud a
            </h3>
            <div className="flex items-center space-x-3">
              <ProfileImage user={receiverUser} size="md" />
              <div>
                <p className="font-medium text-blue-900">
                  {receiverUser?.first_name} {receiverUser?.last_name}
                </p>
                <p className="text-sm text-blue-700">
                  {receiverUser?.username ? `@${receiverUser.username}` : "Usuario"}
                </p>
              </div>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje para acompañar tu solicitud..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="4"
                maxLength="500"
                disabled={isLoading}
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  Máximo 500 caracteres
                </span>
                <span className="text-xs text-gray-500">
                  {message.length}/500
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Botones */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="spinner border-white border-t-transparent mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 