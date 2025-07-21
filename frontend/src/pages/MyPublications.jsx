"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getMyPublishedBooks, deletePublishedBook } from "../api/publishedBooks"
import DashboardLayout from "../layouts/DashboardLayout"
import ArrowLeft from "../components/icons/ArrowLeft"
import BookOpen from "../components/icons/BookOpen"
import Edit from "../components/icons/Edit"
import Trash from "../components/icons/Trash"
import Plus from "../components/icons/Plus"

export default function MyPublications() {
  const navigate = useNavigate()
  const [publications, setPublications] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    loadPublications()
  }, [])

  const loadPublications = async () => {
    try {
      setIsLoading(true)
      const data = await getMyPublishedBooks()
      setPublications(data.publishedBooks || data)
    } catch (error) {
      console.error("Error loading publications:", error)
      setError("Error al cargar las publicaciones")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (publicationId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación?")) {
      return
    }

    try {
      await deletePublishedBook(publicationId)
      console.log("Publicación eliminada:", publicationId)
      // Recargar publicaciones después de eliminar
      loadPublications()
    } catch (error) {
      console.error("Error deleting publication:", error)
      alert("Error al eliminar la publicación")
    }
  }

  const getImageUrl = (publication) => {
    const images = publication.PublishedBookImages || []
    const primaryImage = images.find((img) => img.is_primary) || images[0]

    if (primaryImage) {
      // Si tiene image_data (base64), usarlo
      if (primaryImage.image_data) {
        return primaryImage.image_data
      }
      // Si tiene image_url (Cloudinary), usarlo
      if (primaryImage.image_url) {
        return primaryImage.image_url
      }
    }

    // Imagen por defecto
    return "/api/placeholder/300/200"
  }

  const getTransactionTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "venta":
        return "💰"
      case "intercambio":
        return "🔄"
      case "regalo":
        return "🎁"
      default:
        return "📚"
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando publicaciones...</p>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </button>

            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Mis Publicaciones</h1>
                <p className="text-gray-600">Gestiona tus libros publicados</p>
              </div>

              <button onClick={() => navigate("/dashboard/publish")} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Publicar nuevo libro
              </button>
            </div>
          </div>

          {/* Content */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>
          )}

          {publications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">No tienes publicaciones aún</h2>
              <p className="text-gray-600 mb-6">Comienza publicando tu primer libro para compartir con la comunidad</p>
              <button onClick={() => navigate("/dashboard/publish")} className="btn btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Publicar mi primer libro
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publications.map((publication) => (
                <div
                  key={publication.published_book_id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Imagen */}
                  <div className="h-48 bg-gray-100 relative">
                    <img
                      src={getImageUrl(publication) || "/placeholder.svg"}
                      alt={publication.Book?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/api/placeholder/300/200"
                      }}
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm">
                        {getTransactionTypeIcon(publication.TransactionType?.description)}
                        {publication.TransactionType?.description}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-1 truncate">{publication.Book?.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">por {publication.Book?.author}</p>

                    {/* Precio/Estado */}
                    {publication.price && (
                      <p className="text-lg font-semibold text-green-600 mb-2">${publication.price.toLocaleString()}</p>
                    )}

                    {/* Condición */}
                    <p className="text-sm text-gray-500 mb-3">Estado: {publication.BookCondition?.condition}</p>

                    {/* Descripción */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">{publication.description}</p>

                    {/* Ubicación */}
                    <p className="text-xs text-gray-500 mb-4">
                      📍 {publication.LocationBook?.comuna}, {publication.LocationBook?.region}
                    </p>

                    {/* Acciones */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/edit-publication/${publication.published_book_id}`)}
                        className="flex-1 btn btn-secondary text-sm"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </button>

                      <button
                        onClick={() => handleDelete(publication.published_book_id)}
                        className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200 text-sm"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Footer con estadísticas */}
                  <div className="bg-gray-50 px-4 py-3 border-t">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{publication.PublishedBookImages?.length || 0} imagen(es)</span>
                      <span>Publicado: {new Date(publication.date_published).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  return <DashboardLayout>{renderContent()}</DashboardLayout>
}
