"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  getTransactionTypes,
  getBookConditions,
  getLocations,
  getCategories,
  getPublishedBookById,
  updatePublishedBook,
  uploadBookImages,
  uploadBookImagesBase64,
  deletePublishedBookImage,
} from "../api/publishedBooks"
import ArrowLeft from "../components/icons/ArrowLeft"
import BookOpen from "../components/icons/BookOpen"
import Upload from "../components/icons/Upload"
import X from "../components/icons/X"

export default function EditPublication() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imageStorageType, setImageStorageType] = useState("base64")
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [publication, setPublication] = useState(null)
  const [isDragging, setIsDragging] = useState(false)

  // Datos de referencia
  const [transactionTypes, setTransactionTypes] = useState([])
  const [bookConditions, setBookConditions] = useState([])
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Información del libro
    title: "",
    author: "",
    category_ids: [],
    date_of_pub: "",

    // Estado y transacción
    condition_id: "",
    transaction_type_id: "",
    price: "",
    look_for: "",

    // Detalles adicionales
    description: "",
    location_id: "",

    // Imágenes
    images: [],
    existingImages: [],
  })

  // Cargar datos de referencia y publicación
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true)

        const [transactionTypesData, bookConditionsData, locationsData, categoriesData, publicationData] =
          await Promise.all([
            getTransactionTypes(),
            getBookConditions(),
            getLocations(),
            getCategories(),
            getPublishedBookById(id),
          ])

        setTransactionTypes(transactionTypesData)
        setBookConditions(bookConditionsData)
        setLocations(locationsData)
        setCategories(categoriesData)

        // Llenar formulario con datos existentes
        const publication = publicationData
        setPublication(publication)
        
        setFormData({
          title: publication.Book?.title || "",
          author: publication.Book?.author || "",
          category_ids: publication.Book?.BookCategories?.map((bc) => bc.Category?.category_id) || [],
          date_of_pub: publication.Book?.date_of_pub || "",
          condition_id: publication.condition_id?.toString() || "",
          transaction_type_id: publication.transaction_type_id?.toString() || "",
          price: publication.price?.toString() || "",
          look_for: publication.look_for || "",
          description: publication.description || "",
          location_id: publication.location_id?.toString() || "",
          images: [],
          existingImages: publication.PublishedBookImages || [],
          imagesToDelete: [], // Array para rastrear imágenes a eliminar
        })
      } catch (error) {
        console.error("Error loading data:", error)
        alert("Error al cargar los datos de la publicación")
        navigate("/my-publications")
      } finally {
        setIsLoadingData(false)
      }
    }

    if (id) {
      loadData()
    }
  }, [id, navigate])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))

    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }))
    }
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      is_primary: formData.images.length === 0 && formData.existingImages.length === 0,
    }))

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 5), // Máximo 5 imágenes total
    }))
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
    
    const files = Array.from(event.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) {
      setErrors({ images: "Solo se permiten archivos de imagen" })
      return
    }

    const newImages = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      is_primary: formData.images.length === 0 && formData.existingImages.length === 0,
    }))

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 5), // Máximo 5 imágenes total
    }))

    // Limpiar error si había
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: "" }))
    }
  }

  const removeNewImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const removeExistingImage = async (imageId) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta imagen?")) {
      try {
        // 1. Eliminar del estado local inmediatamente
        setFormData((prev) => ({
          ...prev,
          existingImages: prev.existingImages.filter((img) => img.published_book_image_id !== imageId),
          // Agregar a lista de imágenes a eliminar en BD
          imagesToDelete: [...(prev.imagesToDelete || []), imageId]
        }));
        
      } catch (error) {
        console.error("❌ [FRONTEND] Error eliminando imagen Base64:", error);
        alert("Error al eliminar la imagen. Inténtalo de nuevo.");
      }
    }
  }

  const setPrimaryImage = (index, isExisting = false) => {
    if (isExisting) {
      setFormData((prev) => ({
        ...prev,
        existingImages: prev.existingImages.map((img, i) => ({
          ...img,
          is_primary: i === index,
        })),
        images: prev.images.map((img) => ({ ...img, is_primary: false })),
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.map((img, i) => ({
          ...img,
          is_primary: i === index,
        })),
        existingImages: prev.existingImages.map((img) => ({ ...img, is_primary: false })),
      }))
    }
  }

  const getImageUrl = (image) => {
    if (image.image_data) return image.image_data
    if (image.image_url) return image.image_url
    return "/api/placeholder/300/200"
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.title.trim()) newErrors.title = "El título es requerido"
    if (!formData.author.trim()) newErrors.author = "El autor es requerido"
    if (!formData.condition_id) newErrors.condition_id = "Selecciona el estado del libro"
    if (!formData.transaction_type_id) newErrors.transaction_type_id = "Selecciona el tipo de transacción"
    if (formData.transaction_type_id === "1" && !formData.price) {
      newErrors.price = "El precio es requerido para ventas"
    }
    if (!formData.description.trim()) newErrors.description = "La descripción es requerida"
    if (!formData.location_id) newErrors.location_id = "Selecciona tu ubicación"

    const totalImages = formData.images.length + formData.existingImages.length
    if (totalImages === 0) newErrors.images = "Debe tener al menos una imagen"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Preparar datos para actualizar - SOLO datos de la publicación
      const updateData = {
        transaction_type_id: Number.parseInt(formData.transaction_type_id),
        price: formData.price ? Number.parseFloat(formData.price) : null,
        look_for: formData.look_for || null,
        condition_id: Number.parseInt(formData.condition_id),
        location_id: Number.parseInt(formData.location_id),
        description: formData.description,
        // Incluir datos del libro para actualización
        book: {
          title: formData.title,
          author: formData.author,
          date_of_pub: formData.date_of_pub || null,
        },
      }

      // Actualizar la publicación - CORREGIDO: ahora sí llama a la API
      const updatedPublication = await updatePublishedBook(id, updateData)

      // Eliminar imágenes marcadas para eliminación
      if (formData.imagesToDelete && formData.imagesToDelete.length > 0) {
        for (const imageId of formData.imagesToDelete) {
          try {
            await deletePublishedBookImage(imageId);
          } catch (error) {
            console.warn(`⚠️ No se pudo eliminar imagen ${imageId} de la BD:`, error);
            // Continuar con las demás, no fallar todo el proceso
          }
        }
      }

      // Subir nuevas imágenes si las hay
      if (formData.images.length > 0) {
        if (imageStorageType === "base64") {
          const base64Images = await Promise.all(
            formData.images.map(
              (img) =>
                new Promise((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    resolve({
                      base64: reader.result,
                      is_primary: img.is_primary || false,
                    })
                  }
                  reader.onerror = reject
                  reader.readAsDataURL(img.file)
                }),
            ),
          )
          await uploadBookImagesBase64(id, base64Images)
        } else {
          const imageFormData = new FormData()
          formData.images.forEach((image) => {
            imageFormData.append("images", image.file)
          })
          await uploadBookImages(id, imageFormData)
        }
      }

      // Redirigir con mensaje de éxito y flag para refrescar datos
      navigate("/my-publications", {
        state: {
          message: "¡Publicación actualizada exitosamente!",
          refreshData: true,
        },
      })
    } catch (error) {
      console.error("Error updating publication:", error)
      setErrors({ submit: "Error al actualizar la publicación. Inténtalo de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  // Agrupar ubicaciones por región
  const groupedLocations = locations.reduce((acc, location) => {
    if (!acc[location.region]) {
      acc[location.region] = []
    }
    acc[location.region].push(location)
    return acc
  }, {})

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos de la publicación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/my-publications")}
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a mis publicaciones
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Editar Publicación</h1>
            <p className="text-sm text-gray-600">Actualiza la información de tu libro</p>
            {publication?.date_published && (
              <p className="text-xs text-gray-500 mt-2">
                Publicado el: {new Date(publication.date_published).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica del libro */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Información del libro</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Título del libro <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${errors.title ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Ej. Cien años de soledad"
                  />
                  {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Autor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => handleInputChange("author", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${errors.author ? "border-red-500" : "border-gray-300"}`}
                    placeholder="Ej. Gabriel García Márquez"
                  />
                  {errors.author && <p className="mt-1 text-xs text-red-600">{errors.author}</p>}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Año de publicación (opcional)</label>
                <input
                  type="number"
                  value={formData.date_of_pub}
                  onChange={(e) => handleInputChange("date_of_pub", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:w-48"
                  placeholder="Ej. 1967"
                  min="1000"
                  max={new Date().getFullYear()}
                />
              </div>
            </div>

            {/* Estado y transacción */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Estado y transacción</h3>

              {/* Estado del libro */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Estado del libro <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {bookConditions.map((condition) => (
                    <label
                      key={condition.condition_id}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        formData.condition_id === condition.condition_id.toString()
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="condition"
                        value={condition.condition_id}
                        checked={formData.condition_id === condition.condition_id.toString()}
                        onChange={(e) => handleInputChange("condition_id", e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{condition.condition}</div>
                        <div className="text-xs text-gray-600">{condition.descripcion}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.condition_id && <p className="mt-2 text-xs text-red-600">{errors.condition_id}</p>}
              </div>

              {/* Tipo de transacción */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de transacción <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {transactionTypes.map((type) => (
                    <label
                      key={type.transaction_type_id}
                      className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.transaction_type_id === type.transaction_type_id.toString()
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="transaction_type"
                        value={type.transaction_type_id}
                        checked={formData.transaction_type_id === type.transaction_type_id.toString()}
                        onChange={(e) => handleInputChange("transaction_type_id", e.target.value)}
                        className="sr-only"
                      />
                      <div className="text-xl mb-2">
                        {type.description === "Regalo" && "🎁"}
                        {type.description === "Intercambio" && "🔄"}
                        {type.description === "Venta" && "💰"}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{type.description}</div>
                    </label>
                  ))}
                </div>
                {errors.transaction_type_id && <p className="mt-2 text-xs text-red-600">{errors.transaction_type_id}</p>}
              </div>

              {/* Campos condicionales */}
              {formData.transaction_type_id === "1" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Precio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange("price", e.target.value)}
                      className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${errors.price ? "border-red-500" : "border-gray-300"}`}
                      placeholder="0"
                      min="0"
                      step="100"
                    />
                  </div>
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                </div>
              )}

              {formData.transaction_type_id === "2" && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué libro buscas a cambio? (opcional)</label>
                  <textarea
                    value={formData.look_for}
                    onChange={(e) => handleInputChange("look_for", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    rows="2"
                    placeholder="Ej. Busco libros de ciencia ficción, especialmente de Isaac Asimov..."
                  />
                </div>
              )}
            </div>

            {/* Detalles adicionales */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Detalles adicionales</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descripción <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${errors.description ? "border-red-500" : "border-gray-300"}`}
                    rows="4"
                    placeholder="Describe el libro, su estado, por qué lo recomiendas, etc."
                    maxLength="500"
                  />
                  <div className="flex justify-between items-center mt-1">
                    {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
                    <span className="text-xs text-gray-500">{formData.description.length}/500 caracteres</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ubicación <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.location_id}
                    onChange={(e) => handleInputChange("location_id", e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm ${errors.location_id ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Selecciona tu ubicación</option>
                    {Object.entries(groupedLocations).map(([region, locations]) => (
                      <optgroup key={region} label={region}>
                        {locations.map((location) => (
                          <option key={location.location_id} value={location.location_id}>
                            {location.comuna}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  {errors.location_id && <p className="mt-1 text-xs text-red-600">{errors.location_id}</p>}
                </div>
              </div>
            </div>

            {/* Imágenes */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">Imágenes del libro</h3>

              {/* Selector de tipo de almacenamiento */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">💾 Método de almacenamiento de imágenes</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="storageType"
                      value="base64"
                      checked={imageStorageType === "base64"}
                      onChange={(e) => setImageStorageType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-xs">
                      <strong>Base64 (Recomendado)</strong> - Las imágenes se almacenan en la base de datos
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="storageType"
                      value="cloudinary"
                      checked={imageStorageType === "cloudinary"}
                      onChange={(e) => setImageStorageType(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-xs">
                      <strong>Cloudinary</strong> - Las imágenes se almacenan en la nube
                    </span>
                  </label>
                </div>
              </div>

              {/* Imágenes existentes */}
              {formData.existingImages.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Imágenes actuales</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.existingImages.map((image, index) => (
                      <div 
                        key={image.published_book_image_id} 
                        className="relative group"
                        data-image-id={image.published_book_image_id}
                      >
                        <img
                          src={getImageUrl(image) || "/placeholder.svg"}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index, true)}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Principal
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeExistingImage(image.published_book_image_id)}
                            className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                            title={`Eliminar imagen ${image.published_book_image_id}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {image.is_primary && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white px-1 py-0.5 rounded text-xs">
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subir nuevas imágenes */}
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors mb-4 ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className={`h-8 w-8 mx-auto mb-3 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
                <h3 className={`text-sm font-medium mb-2 ${isDragging ? 'text-blue-900' : 'text-gray-900'}`}>
                  {isDragging ? 'Suelta tus imágenes aquí' : 'Agregar más imágenes'}
                </h3>
                <p className={`text-xs mb-3 ${isDragging ? 'text-blue-700' : 'text-gray-600'}`}>
                  Arrastra y suelta tus imágenes aquí o haz clic para seleccionar archivos
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors">
                  Seleccionar imágenes
                </label>
              </div>

              {errors.images && <p className="text-xs text-red-600 mb-4">{errors.images}</p>}

              {/* Nuevas imágenes */}
              {formData.images.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Nuevas imágenes ({formData.images.length})</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image.preview || "/placeholder.svg"}
                          alt={`Nueva imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-1">
                          {!image.is_primary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryImage(index, false)}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                            >
                              Principal
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeNewImage(index)}
                            className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        {image.is_primary && (
                          <div className="absolute top-1 left-1 bg-blue-600 text-white px-1 py-0.5 rounded text-xs">
                            Principal
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mensaje de error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{errors.submit}</div>
            )}

            {/* Botones */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
              <button 
                type="button" 
                onClick={() => navigate("/my-publications")} 
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>

              <button 
                type="submit" 
                disabled={isLoading} 
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Actualizar publicación
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}