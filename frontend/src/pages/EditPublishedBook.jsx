"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPublishedBookById, updatePublishedBook, uploadBookImagesBase64, deletePublishedBookImage } from "../api/publishedBooks";
import { getTransactionTypes, getBookConditions, getLocations, getCategories } from "../api/publishedBooks";
import ArrowLeft from "../components/icons/ArrowLeft";
import Plus from "../components/icons/Plus";
import Trash from "../components/icons/Trash";
import Upload from "../components/icons/Upload";
import CheckCircle from "../components/icons/CheckCircle";
import X from "../components/icons/X";

export default function EditPublishedBook() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    transaction_type_id: "",
    condition_id: "",
    location_id: "",
    isbn: "",
    editorial: "",
    publication_year: "",
    categories: []
  });

  // Reference data
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [bookConditions, setBookConditions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);

  // Images
  const [images, setImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [deletingImage, setDeletingImage] = useState(null);

  useEffect(() => {
    loadBook();
    loadReferenceData();
  }, [bookId]);

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await getPublishedBookById(bookId);
      setBook(response);
      
      // Set form data
      setFormData({
        title: response.Book?.title || "",
        author: response.Book?.author || "",
        description: response.description || "",
        price: response.price || "",
        transaction_type_id: response.transaction_type_id || "",
        condition_id: response.condition_id || "",
        location_id: response.location_id || "",
        isbn: response.Book?.isbn || "",
        editorial: response.Book?.editorial || "",
        publication_year: response.Book?.publication_year || "",
        categories: response.Book?.Categories?.map(cat => cat.category_id) || []
      });

      // Set images
      setImages(response.PublishedBookImages || []);
    } catch (error) {
      console.error("Error loading book:", error);
      setError("Error al cargar el libro");
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceData = async () => {
    try {
      const [transactionTypesData, bookConditionsData, locationsData, categoriesData] = await Promise.all([
        getTransactionTypes(),
        getBookConditions(),
        getLocations(),
        getCategories()
      ]);

      setTransactionTypes(transactionTypesData);
      setBookConditions(bookConditionsData);
      setLocations(locationsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error loading reference data:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    if (images.length + newImages.length + imageFiles.length > 10) {
      alert('Máximo 10 imágenes por libro');
      return;
    }

    setNewImages(prev => [...prev, ...imageFiles]);
  };

  const removeNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageId) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta imagen?')) {
      return;
    }

    try {
      setDeletingImage(imageId);
      await deletePublishedBookImage(imageId);
      
      // Remove from local state
      setImages(prev => prev.filter(img => img.published_book_image_id !== imageId));
      alert('Imagen eliminada correctamente');
    } catch (error) {
      console.error("Error deleting image:", error);
      alert('Error al eliminar la imagen');
    } finally {
      setDeletingImage(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author) {
      alert('El título y autor son obligatorios');
      return;
    }

    try {
      setSaving(true);

      // Update book data
      const updateData = {
        book: {
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          editorial: formData.editorial,
          publication_year: formData.publication_year,
          categories: formData.categories
        },
        published_book: {
          description: formData.description,
          price: formData.price ? Number(formData.price) : null,
          transaction_type_id: formData.transaction_type_id,
          condition_id: formData.condition_id,
          location_id: formData.location_id
        }
      };

      await updatePublishedBook(bookId, updateData);

      // Upload new images if any
      if (newImages.length > 0) {
        const formDataImages = new FormData();
        newImages.forEach((file, index) => {
          formDataImages.append('images', file);
          formDataImages.append('is_primary', index === 0 ? 'true' : 'false');
        });

        await uploadBookImagesBase64(bookId, formDataImages);
      }

      alert('Libro actualizado correctamente');
      navigate('/dashboard/my-published-books');
    } catch (error) {
      console.error("Error updating book:", error);
      alert('Error al actualizar el libro');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {error || "Libro no encontrado"}
          </h2>
          <button onClick={() => navigate(-1)} className="btn btn-primary">
            Volver
          </button>
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
            onClick={() => navigate(-1)}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Editar Libro: {book.Book?.title}
          </h1>
          <p className="text-gray-600">
            Actualiza la información y las imágenes de tu libro publicado
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) => handleInputChange('isbn', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Editorial
                </label>
                <input
                  type="text"
                  value={formData.editorial}
                  onChange={(e) => handleInputChange('editorial', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Año de Publicación
                </label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.publication_year}
                  onChange={(e) => handleInputChange('publication_year', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe el estado del libro, por qué lo quieres intercambiar/regalar/vender..."
              />
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detalles de Transacción</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Transacción *
                </label>
                <select
                  value={formData.transaction_type_id}
                  onChange={(e) => handleInputChange('transaction_type_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo</option>
                  {transactionTypes.map((type) => (
                    <option key={type.transaction_type_id} value={type.transaction_type_id}>
                      {type.description}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Libro *
                </label>
                <select
                  value={formData.condition_id}
                  onChange={(e) => handleInputChange('condition_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar estado</option>
                  {bookConditions.map((condition) => (
                    <option key={condition.condition_id} value={condition.condition_id}>
                      {condition.condition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <select
                  value={formData.location_id}
                  onChange={(e) => handleInputChange('location_id', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar ubicación</option>
                  {locations.map((location) => (
                    <option key={location.location_id} value={location.location_id}>
                      {location.comuna}, {location.region}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.transaction_type_id && 
             transactionTypes.find(t => t.transaction_type_id === formData.transaction_type_id)?.description === "Venta" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio (CLP)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Categorías</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((category) => (
                <label key={category.category_id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category.category_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleInputChange('categories', [...formData.categories, category.category_id]);
                      } else {
                        handleInputChange('categories', formData.categories.filter(id => id !== category.category_id));
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{category.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Imágenes</h2>
            
            {/* Current Images */}
            {images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Imágenes Actuales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {images.map((image) => (
                    <div key={image.published_book_image_id} className="relative">
                      <img
                        src={image.image_url || image.src}
                        alt="Libro"
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(image.published_book_image_id)}
                        disabled={deletingImage === image.published_book_image_id}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                      {image.is_primary && (
                        <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                          Principal
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Agregar Nuevas Imágenes</h3>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">
                    Haz clic para seleccionar imágenes o arrastra aquí
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Máximo 10 imágenes. La primera será la imagen principal.
                  </p>
                </label>
              </div>

              {/* Preview of new images */}
              {newImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Nuevas Imágenes</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {newImages.map((file, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Nueva imagen ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        {index === 0 && (
                          <span className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary flex items-center space-x-2"
            >
                                <CheckCircle className="h-4 w-4" />
              <span>{saving ? "Guardando..." : "Guardar Cambios"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 