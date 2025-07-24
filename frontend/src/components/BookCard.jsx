"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MapPin from "./icons/MapPin";
import Eye from "./icons/Eye";
import MessageCircle from "./icons/MessageCircle";
import Star from "./icons/Star";
import PaymentButton from './PaymentButton';
import ChatRequestModal from './ChatRequestModal';
import { getMatches } from '../api/matches';

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [hasMatch, setHasMatch] = useState(false);
  const [checkingMatch, setCheckingMatch] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  // Extraer datos del libro
  const {
    Book: bookInfo,
    User: user,
    TransactionType: transactionType,
    BookCondition: condition,
    LocationBook: location,
    PublishedBookImages: images = [],
    description,
    price,
    date_published,
  } = book;

  // Verificar si hay match entre usuarios
  useEffect(() => {
    const checkMatch = async () => {
      if (!currentUser.user_id || !user?.user_id || currentUser.user_id === user.user_id) {
        return;
      }

      try {
        setCheckingMatch(true);
        const response = await getMatches();
        const matches = response.data || [];
        
        const hasMatchWithUser = matches.some(match => 
          (match.user_id_1 === currentUser.user_id && match.user_id_2 === user.user_id) ||
          (match.user_id_1 === user.user_id && match.user_id_2 === currentUser.user_id)
        );
        
        setHasMatch(hasMatchWithUser);
      } catch (error) {
        console.error("Error checking match:", error);
        setHasMatch(false);
      } finally {
        setCheckingMatch(false);
      }
    };

    checkMatch();
  }, [currentUser.user_id, user?.user_id]);

  // Obtener la imagen principal o usar placeholder
  const primaryImage = images.find((img) => img.is_primary) || images[0];
  const imageUrl =
    primaryImage?.src ||          // Usar el campo 'src' que puede ser URL o base64
    primaryImage?.image_url ||    // Fallback a image_url por compatibilidad
    primaryImage?.image_data ||   // Fallback a image_data por compatibilidad  
    "/placeholder.svg?height=200&width=300&text=Libro";

  // Función para obtener el color del badge según el tipo de transacción
  const getTransactionBadge = () => {
    const type = transactionType?.description;
    switch (type) {
      case "Regalo":
        return "bg-blue-500 text-white";
      case "Intercambio":
        return "bg-purple-500 text-white";
      case "Venta":
        return "bg-green-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  // Función para generar estrellas de calificación (simulada por ahora)
  const renderStars = (rating = 4) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
      />
    ));
  };

  // Función para manejar el botón "Ver"
  const handleViewBook = (e) => {
    e.stopPropagation();
    navigate(`/book/${book.published_book_id}`);
  };

  // Función para manejar el botón "Chat"
  const handleStartChat = (e) => {
    e.stopPropagation();
    
    // Si es el propio usuario, no hacer nada
    if (currentUser.user_id === user?.user_id) {
      return;
    }

    // Si hay match, ir directamente al chat
    if (hasMatch && user?.user_id) {
      navigate(`/dashboard/messages/new?user=${user.user_id}&book=${book.published_book_id}`);
    } else {
      // Si no hay match, mostrar modal de solicitud
      setShowChatModal(true);
    }
  };

  // Función para manejar el éxito de la solicitud
  const handleChatRequestSuccess = () => {
    setShowChatModal(false);
    // Opcional: mostrar mensaje de éxito
    // Puedes agregar un toast o notificación aquí
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
        {/* Imagen del libro */}
        <div className="relative aspect-[4/3] bg-gray-100">
          <img
            src={
              imageError
                ? "/placeholder.svg?height=200&width=300&text=Libro"
                : imageUrl
            }
            alt={bookInfo?.title || "Libro"}
            className="w-full h-full object-cover image-render-crisp"
            style={{
              imageRendering: 'optimize-contrast',
              msInterpolationMode: 'nearest-neighbor'
            }}
            onError={() => setImageError(true)}
          />

          {/* Badge del tipo de transacción */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionBadge()}`}
            >
              {transactionType?.description}
            </span>
          </div>

          {/* Iconos de interacción */}
          <div className="absolute bottom-3 left-3 flex space-x-2">
            <button
              onClick={handleViewBook}
              className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"
              title="Ver detalles del libro"
            >
              <Eye className="h-4 w-4" />
            </button>
            
            {/* Solo mostrar botón de chat si no es el propio usuario */}
            {currentUser.user_id !== user?.user_id && (
              <button
                onClick={handleStartChat}
                disabled={checkingMatch}
                className={`p-2 rounded-lg transition-colors ${
                  checkingMatch 
                    ? "bg-gray-400 cursor-not-allowed" 
                    : hasMatch 
                      ? "bg-green-600 hover:bg-green-700 text-white" 
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
                title={
                  checkingMatch 
                    ? "Verificando..." 
                    : hasMatch 
                      ? "Iniciar chat con el dueño" 
                      : "Solicitar chat con el dueño"
                }
              >
                <MessageCircle className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Precio si es venta */}
          {transactionType?.description === "Venta" && price && (
            <div className="absolute bottom-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-lg">
              <span className="text-sm font-semibold text-gray-900">
                ${Number(price).toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Contenido de la tarjeta */}
        <div className="p-4">
          {/* Título y autor */}
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">
              {bookInfo?.title}
            </h3>
            <p className="text-gray-600 text-sm">{bookInfo?.author}</p>
          </div>

          {/* Ubicación */}
          {location && (
            <div className="flex items-center text-gray-500 text-sm mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span>
                {location.comuna}, {location.region}
              </span>
            </div>
          )}

          {/* Descripción */}
          <p className="text-gray-700 text-sm mb-4 line-clamp-2">{description}</p>

          {/* Usuario y calificación */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.first_name?.charAt(0) || "U"}
              </div>
              <span className="text-sm font-medium text-gray-900">
                {user?.first_name} {user?.last_name?.charAt(0)}.
              </span>
            </div>

            {/* Calificación */}
            <div className="flex items-center space-x-1">{renderStars()}</div>
          </div>

          {/* Botón de pago para ventas */}
          {transactionType?.description === "Venta" && price && (
            <div className="mt-4">
              <PaymentButton
                publishedBookId={book.published_book_id}
                bookTitle={bookInfo?.title}
                bookAuthor={bookInfo?.author}
                price={Number(price)}
                className="w-full"
                onPaymentStart={() => console.log('Pago iniciado')}
                onPaymentError={(error) => console.error('Error de pago:', error)}
              />
            </div>
          )}

          {/* Estado del libro */}
          {condition && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">Estado: </span>
              <span className="text-xs font-medium text-gray-700">
                {condition.condition}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modal de solicitud de chat */}
      <ChatRequestModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        book={book}
        receiverUser={user}
        onSuccess={handleChatRequestSuccess}
      />
    </>
  );
}
