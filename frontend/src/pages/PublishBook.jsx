"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import BookOpen from "../components/icons/BookOpen"
import ArrowRight from "../components/icons/ArrowRight"
import ArrowLeft from "../components/icons/ArrowLeft"
import Upload from "../components/icons/Upload"
import X from "../components/icons/X"
import Search from "../components/icons/Search"
import Plus from "../components/icons/Plus"
import {
  getTransactionTypes,
  getBookConditions,
  getLocations,
  getCategories,
  createBook,
  publishBook,
  uploadBookImages,
} from "../api/publishedBooks"

const STEPS = [
  { id: 1, title: "Información básica", subtitle: "Cuéntanos sobre tu libro" },
  { id: 2, title: "Estado y transacción", subtitle: "¿En qué condición está y cómo quieres compartirlo?" },
  { id: 3, title: "Detalles adicionales", subtitle: "Describe tu libro y dónde te encuentras" },
  { id: 4, title: "Imágenes del libro", subtitle: "Sube fotos para que otros vean tu libro" },
]

export default function PublishBook() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  // Google Books search
  const [searchTerm, setSearchTerm] = useState("")
  const [googleBooks, setGoogleBooks] = useState([])
  const [searchingGoogle, setSearchingGoogle] = useState(false)
  const [showGoogleSearch, setShowGoogleSearch] = useState(false)
  const [showManualForm, setShowManualForm] = useState(false)

  // Datos de referencia
  const [transactionTypes, setTransactionTypes] = useState([])
  const [bookConditions, setBookConditions] = useState([])
  const [locations, setLocations] = useState([])
  const [categories, setCategories] = useState([])

  // Datos del formulario
  const [formData, setFormData] = useState({
    // Paso 1: Información básica
    title: "",
    author: "",
    category_ids: [],
    date_of_pub: "",

    // Paso 2: Estado y transacción
    condition_id: "",
    transaction_type_id: "",
    price: "",
    look_for: "",

    // Paso 3: Detalles adicionales
    description: "",
    location_id: "",

    // Paso 4: Imágenes
    images: [],
  })

  // Cargar datos de referencia
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [transactionTypesData, bookConditionsData, locationsData, categoriesData] = await Promise.all([
          getTransactionTypes(),
          getBookConditions(),
          getLocations(),
          getCategories(),
        ])

        setTransactionTypes(transactionTypesData)
        setBookConditions(bookConditionsData)
        setLocations(locationsData)
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error loading reference data:", error)
      }
    }

    loadReferenceData()
  }, [])

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

  const validateStep = (step) => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!formData.title.trim()) newErrors.title = "El título es requerido"
        if (!formData.author.trim()) newErrors.author = "El autor es requerido"
        break
      case 2:
        if (!formData.condition_id) newErrors.condition_id = "Selecciona el estado del libro"
        if (!formData.transaction_type_id) newErrors.transaction_type_id = "Selecciona el tipo de transacción"
        if (formData.transaction_type_id === "1" && !formData.price) {
          newErrors.price = "El precio es requerido para ventas"
        }
        break
      case 3:
        if (!formData.description.trim()) newErrors.description = "La descripción es requerida"
        if (!formData.location_id) newErrors.location_id = "Selecciona tu ubicación"
        break
      case 4:
        if (formData.images.length === 0) newErrors.images = "Sube al menos una imagen"
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4))
    }
  }

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      is_primary: formData.images.length === 0, // Primera imagen es principal
    }))

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newImages].slice(0, 5), // Máximo 5 imágenes
    }))
  }

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  const setPrimaryImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => ({
        ...img,
        is_primary: i === index,
      })),
    }))
  }

  // Google Books search function
  const searchGoogleBooks = async (query) => {
    if (!query.trim()) {
      setGoogleBooks([])
      return
    }

    try {
      setSearchingGoogle(true)
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=es&printType=books`
      )
      const data = await response.json()

      if (!data.items) {
        setGoogleBooks([])
        return
      }

      const books = data.items.map((item) => {
        const bookInfo = item.volumeInfo

        let isbn = null
        if (bookInfo.industryIdentifiers) {
          const isbn13 = bookInfo.industryIdentifiers.find(
            (id) => id.type === "ISBN_13"
          )
          const isbn10 = bookInfo.industryIdentifiers.find(
            (id) => id.type === "ISBN_10"
          )
          isbn = isbn13?.identifier || isbn10?.identifier || null
        }

        let imageUrl = null
        if (bookInfo.imageLinks) {
          imageUrl =
            bookInfo.imageLinks.thumbnail ||
            bookInfo.imageLinks.smallThumbnail ||
            null
          if (imageUrl) {
            imageUrl = imageUrl.replace("http://", "https://")
          }
        }

        return {
          id: item.id,
          title: bookInfo.title || "Título desconocido",
          author: bookInfo.authors
            ? bookInfo.authors.join(", ")
            : "Autor desconocido",
          isbn: isbn,
          image_url: imageUrl,
          date_of_pub: bookInfo.publishedDate ? bookInfo.publishedDate.split('-')[0] : null,
          publisher: bookInfo.publisher || null,
          description: bookInfo.description || null,
          language: bookInfo.language || "es",
          categories: bookInfo.categories || [],
        }
      })

      setGoogleBooks(books)
    } catch (error) {
      console.error("Error searching Google Books:", error)
      alert("Error al buscar libros")
    } finally {
      setSearchingGoogle(false)
    }
  }

  // Handle Google Books search with debounce
  useEffect(() => {
    if (showGoogleSearch) {
      const timeoutId = setTimeout(() => {
        searchGoogleBooks(searchTerm)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [searchTerm, showGoogleSearch])

  // Handle Google Book selection
  const handleGoogleBookSelect = (book) => {
    // Auto-populate form with Google Books data
    setFormData(prev => ({
      ...prev,
      title: book.title,
      author: book.author,
      date_of_pub: book.date_of_pub || "",
      // Try to match categories from Google Books to our categories
      category_ids: matchGoogleCategories(book.categories)
    }))
    
    setShowGoogleSearch(false)
    setShowManualForm(true)
  }

  // Helper function to match Google Books categories to our database categories
  const matchGoogleCategories = (googleCategories) => {
    if (!googleCategories || !Array.isArray(googleCategories)) return []
    
    const matchedIds = []
    const categoryMap = {
      'Fiction': 'Ficción',
      'Science Fiction': 'Ciencia Ficción',
      'Fantasy': 'Fantasía',
      'Romance': 'Romance',
      'Mystery': 'Misterio',
      'Thriller': 'Suspenso',
      'Horror': 'Terror',
      'Biography': 'Biografía',
      'History': 'Historia',
      'Science': 'Ciencia',
      'Technology': 'Tecnología',
      'Philosophy': 'Filosofía',
      'Religion': 'Religión',
      'Poetry': 'Poesía',
      'Drama': 'Drama',
      'Education': 'Educación',
      'Health': 'Salud',
      'Business': 'Negocios',
      'Economics': 'Economía',
      'Psychology': 'Psicología',
      'Art': 'Arte',
      'Music': 'Música',
      'Sports': 'Deportes',
      'Travel': 'Viajes',
      'Cooking': 'Cocina',
      'Self-Help': 'Autoayuda'
    }

    googleCategories.forEach(googleCat => {
      const matchedCategory = categories.find(cat => 
        cat.title.toLowerCase() === googleCat.toLowerCase() ||
        cat.title.toLowerCase() === categoryMap[googleCat]?.toLowerCase()
      )
      if (matchedCategory && !matchedIds.includes(matchedCategory.category_id)) {
        matchedIds.push(matchedCategory.category_id)
      }
    })

    return matchedIds
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsLoading(true)
    try {
      // 1. Crear el libro
      const bookData = {
        title: formData.title,
        author: formData.author,
        date_of_pub: formData.date_of_pub || null,
        location: locations.find((l) => l.location_id === Number.parseInt(formData.location_id))?.comuna || "",
        category_ids: formData.category_ids,
      }

      const createdBook = await createBook(bookData)

      // 2. Publicar el libro
      const publishData = {
        book_id: createdBook.book_id,
        transaction_type_id: Number.parseInt(formData.transaction_type_id),
        price: formData.price ? Number.parseFloat(formData.price) : null,
        look_for: formData.look_for || null,
        condition_id: Number.parseInt(formData.condition_id),
        location_id: Number.parseInt(formData.location_id),
        description: formData.description,
      }

      const publishedBook = await publishBook(publishData)

      // 3. Subir imágenes reales
      if (formData.images.length > 0) {
        const imageFormData = new FormData()
        formData.images.forEach((image) => {
          imageFormData.append('images', image.file)
        })
        
        await uploadBookImages(publishedBook.published_book_id, imageFormData)
      }

      // Redirigir al dashboard con mensaje de éxito
      navigate("/dashboard", { state: { message: "¡Libro publicado exitosamente!" } })
    } catch (error) {
      console.error("Error publishing book:", error)
      setErrors({ submit: "Error al publicar el libro. Inténtalo de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1 
            formData={formData} 
            handleInputChange={handleInputChange} 
            errors={errors} 
            categories={categories}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            googleBooks={googleBooks}
            searchingGoogle={searchingGoogle}
            showGoogleSearch={showGoogleSearch}
            setShowGoogleSearch={setShowGoogleSearch}
            showManualForm={showManualForm}
            setShowManualForm={setShowManualForm}
            handleGoogleBookSelect={handleGoogleBookSelect}
          />
        )
      case 2:
        return (
          <Step2
            formData={formData}
            handleInputChange={handleInputChange}
            errors={errors}
            bookConditions={bookConditions}
            transactionTypes={transactionTypes}
          />
        )
      case 3:
        return <Step3 formData={formData} handleInputChange={handleInputChange} errors={errors} locations={locations} />
      case 4:
        return (
          <Step4
            formData={formData}
            handleImageUpload={handleImageUpload}
            removeImage={removeImage}
            setPrimaryImage={setPrimaryImage}
            errors={errors}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Publicar libro</h1>
            <p className="text-gray-600 mb-6">Comparte tu libro con la comunidad</p>

            {/* Progress */}
            <div className="flex items-center justify-center mb-2">
              <span className="text-sm text-gray-500">Paso {currentStep} de 4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-center space-x-4 mb-8">
              {STEPS.map((step) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.id === currentStep
                        ? "bg-blue-600 text-white"
                        : step.id < currentStep
                          ? "bg-blue-100 text-blue-600"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.id}
                  </div>
                  {step.id < 4 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="text-center mb-8">
            <BookOpen className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{STEPS[currentStep - 1].title}</h2>
            <p className="text-gray-600">{STEPS[currentStep - 1].subtitle}</p>
          </div>

          {renderStep()}

          {errors.submit && <p className="text-red-600 text-center mt-4">{errors.submit}</p>}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Anterior
            </button>

            {currentStep < 4 ? (
              <button onClick={handleNext} className="btn btn-primary">
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={isLoading} className="btn btn-primary">
                {isLoading ? (
                  <>
                    <div className="spinner mr-2" />
                    Publicando...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4 mr-2" />
                    Publicar libro
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componentes para cada paso
function Step1({ 
  formData, 
  handleInputChange, 
  errors, 
  categories,
  searchTerm,
  setSearchTerm,
  googleBooks,
  searchingGoogle,
  showGoogleSearch,
  setShowGoogleSearch,
  showManualForm,
  setShowManualForm,
  handleGoogleBookSelect
}) {
  // If showing manual form, show the regular form
  if (showManualForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Información del libro</h3>
          <button
            onClick={() => {
              setShowManualForm(false)
              setShowGoogleSearch(false)
            }}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Volver a opciones
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">
              Título del libro <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className={`form-control ${errors.title ? "border-red-500" : ""}`}
              placeholder="Ej. Cien años de soledad"
            />
            {errors.title && <p className="form-error">{errors.title}</p>}
          </div>

          <div>
            <label className="form-label">
              Autor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => handleInputChange("author", e.target.value)}
              className={`form-control ${errors.author ? "border-red-500" : ""}`}
              placeholder="Ej. Gabriel García Márquez"
            />
            {errors.author && <p className="form-error">{errors.author}</p>}
          </div>
        </div>

        <div>
          <label className="form-label">Año de publicación (opcional)</label>
          <input
            type="number"
            value={formData.date_of_pub}
            onChange={(e) => handleInputChange("date_of_pub", e.target.value)}
            className="form-control"
            placeholder="Ej. 1967"
            min="1000"
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label className="form-label">Categorías (opcional)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto border rounded-lg p-4">
            {categories.map((category) => (
              <label key={category.category_id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.category_ids.includes(category.category_id)}
                  onChange={(e) => {
                    const categoryId = category.category_id
                    if (e.target.checked) {
                      handleInputChange("category_ids", [...formData.category_ids, categoryId])
                    } else {
                      handleInputChange(
                        "category_ids",
                        formData.category_ids.filter((id) => id !== categoryId),
                      )
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{category.title}</span>
              </label>
            ))}
          </div>
          {categories.length === 0 && <p className="text-sm text-gray-500 mt-2">Cargando categorías...</p>}
          <p className="form-text">Selecciona las categorías que mejor describan tu libro</p>
        </div>
      </div>
    )
  }

  // If showing Google search, show search results
  if (showGoogleSearch) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">Buscar en Google Books</h3>
          <button
            onClick={() => setShowGoogleSearch(false)}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Volver a opciones
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar libros por título, autor o ISBN..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchingGoogle && (
          <div className="text-center py-4">
            <div className="inline-flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Buscando...</span>
            </div>
          </div>
        )}

        {googleBooks.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Resultados de búsqueda</h4>
            <div className="grid gap-4">
              {googleBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
                  onClick={() => handleGoogleBookSelect(book)}
                >
                  {book.image_url && (
                    <img
                      src={book.image_url}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">{book.title}</h5>
                    <p className="text-sm text-gray-600 truncate">{book.author}</p>
                    {book.date_of_pub && (
                      <p className="text-xs text-gray-500">Publicado en {book.date_of_pub}</p>
                    )}
                    {book.categories && book.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {book.categories.slice(0, 2).map((category, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-blue-600 hover:text-blue-700">
                      <Plus className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchTerm && !searchingGoogle && googleBooks.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron libros</p>
            <p className="text-sm text-gray-500 mt-2">
              Intenta con un término diferente o{" "}
              <button
                onClick={() => setShowManualForm(true)}
                className="text-blue-600 hover:text-blue-700"
              >
                agrega el libro manualmente
              </button>
            </p>
          </div>
        )}
      </div>
    )
  }

  // Default view - show options
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">¿Cómo quieres agregar el libro?</h3>
        <p className="text-gray-600">Elige la opción que prefieras</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
          onClick={() => setShowGoogleSearch(true)}
        >
          <div className="text-center">
            <Search className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Buscar en Google Books</h4>
            <p className="text-sm text-gray-600">
              Busca tu libro en Google Books para autocompletar la información
            </p>
          </div>
        </div>

        <div
          className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-300 cursor-pointer transition-colors"
          onClick={() => setShowManualForm(true)}
        >
          <div className="text-center">
            <Plus className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Agregar manualmente</h4>
            <p className="text-sm text-gray-600">
              Completa la información del libro manualmente
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step2({ formData, handleInputChange, errors, bookConditions, transactionTypes }) {
  return (
    <div className="space-y-8">
      {/* Estado del libro */}
      <div>
        <label className="form-label mb-4">
          Estado del libro <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          {bookConditions.map((condition) => (
            <label
              key={condition.condition_id}
              className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
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
                <div className="font-medium text-gray-900">{condition.condition}</div>
                <div className="text-sm text-gray-600">{condition.descripcion}</div>
              </div>
            </label>
          ))}
        </div>
        {errors.condition_id && <p className="form-error mt-2">{errors.condition_id}</p>}
      </div>

      {/* Tipo de transacción */}
      <div>
        <label className="form-label mb-4">
          Tipo de transacción <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {transactionTypes.map((type) => (
            <label
              key={type.transaction_type_id}
              className={`flex flex-col items-center p-6 border rounded-lg cursor-pointer transition-colors ${
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
              <div className="text-2xl mb-2">
                {type.description === "Regalo" && "🎁"}
                {type.description === "Intercambio" && "🔄"}
                {type.description === "Venta" && "💰"}
              </div>
              <div className="font-medium text-gray-900 mb-1">{type.description}</div>
              <div className="text-sm text-gray-600 text-center">
                {type.description === "Regalo" && "Regala tu libro a otro lector"}
                {type.description === "Intercambio" && "Intercambia por otro libro"}
                {type.description === "Venta" && "Vende tu libro"}
              </div>
            </label>
          ))}
        </div>
        {errors.transaction_type_id && <p className="form-error mt-2">{errors.transaction_type_id}</p>}
      </div>

      {/* Campos condicionales */}
      {formData.transaction_type_id === "1" && (
        <div>
          <label className="form-label">
            Precio <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={formData.price}
              onChange={(e) => handleInputChange("price", e.target.value)}
              className={`form-control pl-8 ${errors.price ? "border-red-500" : ""}`}
              placeholder="0"
              min="0"
              step="100"
            />
          </div>
          {errors.price && <p className="form-error">{errors.price}</p>}
        </div>
      )}

      {formData.transaction_type_id === "2" && (
        <div>
          <label className="form-label">¿Qué libro buscas a cambio? (opcional)</label>
          <textarea
            value={formData.look_for}
            onChange={(e) => handleInputChange("look_for", e.target.value)}
            className="form-control"
            rows="3"
            placeholder="Ej. Busco libros de ciencia ficción, especialmente de Isaac Asimov..."
          />
        </div>
      )}
    </div>
  )
}

function Step3({ formData, handleInputChange, errors, locations }) {
  const groupedLocations = locations.reduce((acc, location) => {
    if (!acc[location.region]) {
      acc[location.region] = []
    }
    acc[location.region].push(location)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <label className="form-label">
          Descripción <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          className={`form-control ${errors.description ? "border-red-500" : ""}`}
          rows="5"
          placeholder="Describe el libro, su estado, por qué lo recomiendas, etc."
          maxLength="500"
        />
        <div className="flex justify-between items-center mt-1">
          {errors.description && <p className="form-error">{errors.description}</p>}
          <span className="text-sm text-gray-500">{formData.description.length}/500 caracteres</span>
        </div>
      </div>

      <div>
        <label className="form-label">
          Ubicación <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.location_id}
          onChange={(e) => handleInputChange("location_id", e.target.value)}
          className={`form-control ${errors.location_id ? "border-red-500" : ""}`}
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
        {errors.location_id && <p className="form-error">{errors.location_id}</p>}
      </div>
    </div>
  )
}

function Step4({ formData, handleImageUpload, removeImage, setPrimaryImage, errors }) {
  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Arrastra y suelta tus imágenes aquí</h3>
        <p className="text-gray-600 mb-4">o haz clic para seleccionar archivos</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="btn btn-secondary">
          Seleccionar imágenes
        </label>
      </div>

      {errors.images && <p className="form-error">{errors.images}</p>}

      {/* Image preview */}
      {formData.images.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Imágenes seleccionadas ({formData.images.length}/5)</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.preview || "/placeholder.svg"}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                  {!image.is_primary && (
                    <button
                      onClick={() => setPrimaryImage(index)}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                    >
                      Principal
                    </button>
                  )}
                  <button
                    onClick={() => removeImage(index)}
                    className="bg-red-600 text-white p-1 rounded hover:bg-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {image.is_primary && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs">
                    Principal
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Consejos para mejores fotos:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Formatos aceptados: JPG, PNG, WEBP</li>
          <li>• Tamaño máximo por imagen: 5MB</li>
          <li>• Máximo 5 imágenes</li>
          <li>• La primera imagen será la principal</li>
          <li>• Usa buena iluminación y enfoque claro</li>
        </ul>
      </div>
    </div>
  )
}
