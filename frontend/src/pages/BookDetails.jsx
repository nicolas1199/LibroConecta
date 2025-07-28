"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getPublishedBookById } from "../api/publishedBooks"
import MapPin from "../components/icons/MapPin"
import Star from "../components/icons/Star"
import MessageCircle from "../components/icons/MessageCircle"
import BookOpen from "../components/icons/BookOpen"
import PaymentButton from "../components/PaymentButton"
import ProfileImage from "../components/ProfileImage"
import ChatRequestModal from "../components/ChatRequestModal"
import DashboardLayout from "../layouts/DashboardLayout"
import { getMatches } from "../api/matches"

export default function BookDetails() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [hasMatch, setHasMatch] = useState(false)
  const [checkingMatch, setCheckingMatch] = useState(false)
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}")

  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true)
        // Obtener el libro específico por ID
        const response = await getPublishedBookById(bookId)
        
        if (response) {
          console.log("Libro cargado:", response)
          setBook(response)
        } else {
          setError("Libro no encontrado")
        }
      } catch (error) {
        console.error("Error loading book:", error)
        setError("Error al cargar el libro")
      } finally {
        setLoading(false)
      }
    }

    if (bookId) {
      loadBook()
    }
  }, [bookId])

  // Verificar si hay match entre usuarios
  useEffect(() => {
    const checkMatch = async () => {
      if (!currentUser.user_id || !book?.User?.user_id || currentUser.user_id === book.User.user_id) {
        return;
      }

      try {
        setCheckingMatch(true);
        const response = await getMatches();
        const matches = response.data || [];
        
        const hasMatchWithUser = matches.some(match => 
          (match.user_id_1 === currentUser.user_id && match.user_id_2 === book.User.user_id) ||
          (match.user_id_1 === book.User.user_id && match.user_id_2 === currentUser.user_id)
        );
        
        setHasMatch(hasMatchWithUser);
      } catch (error) {
        console.error("Error checking match:", error);
        setHasMatch(false);
      } finally {
        setCheckingMatch(false);
      }
    };

    if (book?.User?.user_id) {
      checkMatch();
    }
  }, [currentUser.user_id, book?.User?.user_id]);

  const handleStartChat = () => {
    // Si es el propio usuario, no hacer nada
    if (currentUser.user_id === book?.User?.user_id) {
      return;
    }

    // Si hay match, ir directamente al chat
    if (hasMatch && book?.User?.user_id) {
      navigate(`/dashboard/messages/new?user=${book.User.user_id}&book=${bookId}`);
    } else {
      // Si no hay match, mostrar modal de solicitud
      setShowChatModal(true);
    }
  };

  const handleChatRequestSuccess = () => {
    // Opcional: mostrar notificación de éxito
    console.log("Solicitud de chat enviada exitosamente");
  };

  const renderStars = (rating = 4) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`h-3.5 w-3.5 ${index < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  // Función para obtener la URL de la imagen, similar a BookCard.jsx
  const getImageUrl = (images) => {
    if (!images || images.length === 0) {
      return "/placeholder.svg?height=400&width=400&text=Libro"
    }

    const primaryImage = images.find((img) => img.is_primary) || images[0]
    return (
      primaryImage?.src ||
      primaryImage?.image_url ||
      primaryImage?.image_data ||
      "/placeholder.svg?height=400&width=400&text=Libro"
    )
  }

  // Función para obtener la URL de la imagen actual basada en el índice seleccionado
  const getCurrentImageUrl = (images, index) => {
    if (!images || images.length === 0) {
      return "/placeholder.svg?height=400&width=400&text=Libro"
    }

    const selectedImage = images[index] || images[0]
    return (
      selectedImage?.src ||
      selectedImage?.image_url ||
      selectedImage?.image_data ||
      "/placeholder.svg?height=400&width=400&text=Libro"
    )
  }

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (error || !book) {
      return (
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">{error || "Libro no encontrado"}</h2>
            <button onClick={() => navigate(-1)} className="btn btn-primary">
              Volver
            </button>
          </div>
        </div>
      )
    }

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
      published_book_id: publishedBookId,
    } = book

    return (
      <div className="container mx-auto px-4 py-6">
        {/* Header con breadcrumb */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
            <button onClick={() => navigate("/dashboard")} className="hover:text-blue-600 transition-colors">
              Dashboard
            </button>
            <span>/</span>
            <button onClick={() => navigate("/dashboard/explore")} className="hover:text-blue-600 transition-colors">
              Explorar
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">{bookInfo?.title || "Detalles del libro"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Imágenes */}
          <div className="space-y-3">
            {/* Imagen principal */}
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm">
              <img
                src={imageError ? "/placeholder.svg?height=400&width=400&text=Libro" : getCurrentImageUrl(images, currentImageIndex)}
                alt={bookInfo?.title || "Libro"}
                className="w-full h-full object-cover image-render-crisp"
                style={{
                  imageRendering: "optimize-contrast",
                  msInterpolationMode: "nearest-neighbor",
                }}
                onError={() => {
                  console.error("Error al cargar la imagen")
                  setImageError(true)
                }}
              />
            </div>

            {/* Miniaturas */}
            {images.length > 1 && (
              <div className="flex space-x-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentImageIndex(index)
                      setImageError(false) // Reset image error when changing image
                    }}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex ? "border-blue-500" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={
                        image.src ||
                        image.image_url ||
                        image.image_data ||
                        "/placeholder.svg?height=100&width=100&text=Libro" ||
                        "/placeholder.svg"
                      }
                      alt={`${bookInfo?.title} - ${index + 1}`}
                      className="w-full h-full object-cover image-render-crisp"
                      style={{
                        imageRendering: "optimize-contrast",
                        msInterpolationMode: "nearest-neighbor",
                      }}
                      onError={(e) => {
                        console.error("Error al cargar miniatura")
                        e.target.src = "/placeholder.svg?height=100&width=100&text=Libro"
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Información del libro */}
          <div className="space-y-4">
            {/* Título y autor */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{bookInfo?.title}</h1>
              <p className="text-lg text-gray-600 mb-3">por {bookInfo?.author}</p>

              {/* Badge del tipo de transacción */}
              <div className="flex items-center space-x-3 mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    transactionType?.description === "Regalo"
                      ? "bg-blue-100 text-blue-800"
                      : transactionType?.description === "Intercambio"
                        ? "bg-purple-100 text-purple-800"
                        : transactionType?.description === "Venta"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {transactionType?.description}
                </span>

                {transactionType?.description === "Venta" && price && (
                  <span className="text-xl font-bold text-green-600">${Number(price).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Precio y acciones */}
            {transactionType?.description === "Venta" && price && (
              <div className="bg-green-50 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Precio</p>
                    <p className="text-2xl font-bold text-green-900">${Number(price).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Estado</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Disponible
                    </span>
                  </div>
                </div>

                <PaymentButton
                  publishedBookId={publishedBookId}
                  bookTitle={bookInfo?.title}
                  bookAuthor={bookInfo?.author}
                  price={Number(price)}
                  className="w-full"
                  onPaymentStart={() => console.log("Pago iniciado para libro:", publishedBookId)}
                  onPaymentError={(error) => {
                    console.error("Error de pago:", error)
                    alert(`Error en el pago: ${error}`)
                  }}
                />
              </div>
            )}

            {/* Información del usuario */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Propietario</h3>
              <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                <ProfileImage user={user} size="md" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <div className="flex items-center space-x-1">
                      {renderStars()}
                      <span className="text-xs text-gray-500 ml-1">(4/5)</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleStartChat} className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <MessageCircle className="h-4 w-4" />
                  <span>Contactar</span>
                </button>
              </div>
            </div>

            {/* Ubicación */}
            {location && (
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Ubicación</h3>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm">
                    {location.comuna}, {location.region}
                  </span>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 uppercase tracking-wide">Descripción</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{description || "Sin descripción disponible"}</p>
            </div>

            {/* Detalles adicionales */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">Detalles</h3>
              <div className="space-y-2">
                {condition && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">Estado:</span>
                    <span className="text-sm font-medium text-gray-900">{condition.condition}</span>
                  </div>
                )}

                {date_published && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">Publicado:</span>
                    <span className="text-sm font-medium text-gray-900">{new Date(date_published).toLocaleDateString()}</span>
                  </div>
                )}

                {bookInfo?.isbn && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">ISBN:</span>
                    <span className="text-sm font-medium text-gray-900">{bookInfo.isbn}</span>
                  </div>
                )}

                {bookInfo?.editorial && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">Editorial:</span>
                    <span className="text-sm font-medium text-gray-900">{bookInfo.editorial}</span>
                  </div>
                )}

                {bookInfo?.publication_year && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-xs text-gray-600 uppercase tracking-wide">Año:</span>
                    <span className="text-sm font-medium text-gray-900">{bookInfo.publication_year}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Envolver todo el contenido en el DashboardLayout
  return (
    <>
      <DashboardLayout>{renderContent()}</DashboardLayout>
      
      {/* Modal de solicitud de chat */}
      <ChatRequestModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        book={book}
        receiverUser={book?.User}
        onSuccess={handleChatRequestSuccess}
      />
    </>
  )
}