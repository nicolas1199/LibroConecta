"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { getPublishedBooks } from "../api/publishedBooks"
import MapPin from "../components/icons/MapPin"
import Star from "../components/icons/Star"
import MessageCircle from "../components/icons/MessageCircle"
import BookOpen from "../components/icons/BookOpen"
import PaymentButton from "../components/PaymentButton"
import DashboardLayout from "../layouts/DashboardLayout"

export default function BookDetails() {
  const { bookId } = useParams()
  const navigate = useNavigate()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true)
        // Obtener el libro específico
        const response = await getPublishedBooks({
          published_book_id: bookId,
        })

        if (response.publishedBooks && response.publishedBooks.length > 0) {
          console.log("Libro cargado:", response.publishedBooks[0])
          setBook(response.publishedBooks[0])
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

  const handleStartChat = () => {
    if (book?.User?.user_id) {
      navigate(`/dashboard/messages/new?user=${book.User.user_id}&book=${bookId}`)
    }
  }

  const renderStars = (rating = 4) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star key={index} className={`h-4 w-4 ${index < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
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
        <div className="mb-6">
          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Imágenes */}
          <div className="space-y-4">
            {/* Imagen principal */}
            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-md">
              <img
                src={imageError ? "/placeholder.svg?height=400&width=400&text=Libro" : getImageUrl(images)}
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
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      index === currentImageIndex ? "border-blue-500" : "border-gray-200"
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
          <div className="space-y-6">
            {/* Título y autor */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{bookInfo?.title}</h1>
              <p className="text-xl text-gray-600 mb-4">por {bookInfo?.author}</p>

              {/* Badge del tipo de transacción */}
              <div className="flex items-center space-x-2 mb-4">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
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
                  <span className="text-2xl font-bold text-green-600">${Number(price).toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Precio y acciones */}
            {transactionType?.description === "Venta" && price && (
              <div className="bg-green-50 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">Precio</p>
                    <p className="text-3xl font-bold text-green-900">${Number(price).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Estado</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
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
              <h3 className="font-semibold text-gray-900 mb-3">Propietario</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {user?.first_name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <div className="flex items-center space-x-1">
                      {renderStars()}
                      <span className="text-sm text-gray-500 ml-1">(4/5)</span>
                    </div>
                  </div>
                </div>

                <button onClick={handleStartChat} className="btn btn-primary flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>Contactar</span>
                </button>
              </div>
            </div>

            {/* Ubicación */}
            {location && (
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Ubicación</h3>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {location.comuna}, {location.region}
                  </span>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-2">Descripción</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{description || "Sin descripción disponible"}</p>
            </div>

            {/* Detalles adicionales */}
            <div className="bg-white p-4 rounded-lg border shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles</h3>
              <div className="space-y-2">
                {condition && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium">{condition.condition}</span>
                  </div>
                )}

                {date_published && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Publicado:</span>
                    <span className="font-medium">{new Date(date_published).toLocaleDateString()}</span>
                  </div>
                )}

                {bookInfo?.isbn && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ISBN:</span>
                    <span className="font-medium">{bookInfo.isbn}</span>
                  </div>
                )}

                {bookInfo?.editorial && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Editorial:</span>
                    <span className="font-medium">{bookInfo.editorial}</span>
                  </div>
                )}

                {bookInfo?.publication_year && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Año:</span>
                    <span className="font-medium">{bookInfo.publication_year}</span>
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
  return <DashboardLayout>{renderContent()}</DashboardLayout>
}