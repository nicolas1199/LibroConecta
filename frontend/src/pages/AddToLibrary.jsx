"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAddToLibrary } from "../hooks/useAddToLibrary";
import { BOOK_GENRES } from "../utils/constants";
import { searchGoogleBooks } from "../services/googleBooks";
import BookOpen from "../components/icons/BookOpen";
import Search from "../components/icons/Search";
import Plus from "../components/icons/Plus";
import ArrowLeft from "../components/icons/ArrowLeft";
import CustomDatePicker from "../components/CustomDatePicker";
import CustomSelect from "../components/CustomSelect";

export default function AddToLibrary() {
  const navigate = useNavigate();
  const { addBookAsync, isAdding, error: addBookError } = useAddToLibrary();

  const [searchTerm, setSearchTerm] = useState("");
  const [googleBooks, setGoogleBooks] = useState([]);
  const [searchingGoogle, setSearchingGoogle] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [activeSearchType, setActiveSearchType] = useState("google"); // "google", "manual"
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    image_url: "",
    date_of_pub: "",
    reading_status: "por_leer",
    rating: 0,
    review: "",
    date_started: "",
    date_finished: "",
    genres: [],
    main_genre: "",
  });

  // Opciones para el selector de estado
  const readingStatusOptions = [
    {
      value: "por_leer",
      label: "Quiero leer",
      description: "Añadir a lista de pendientes",
    },
    {
      value: "leyendo",
      label: "Leyendo",
      description: "Actualmente en progreso",
    },
    {
      value: "leido",
      label: "Leído",
      description: "Lectura completada",
    },
    {
      value: "abandonado",
      label: "Abandonado",
      description: "Lectura interrumpida",
    },
  ];

  useEffect(() => {
    if (activeSearchType === "google") {
      const timeoutId = setTimeout(() => {
        searchGoogleBooksFunc(searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, activeSearchType]);

  const handleGoogleBookSelect = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author || "",
      isbn: book.isbn || "",
      image_url: book.thumbnail || book.image_url || "",
      date_of_pub: book.date_of_pub || "",
      reading_status: "por_leer",
      rating: 0,
      review: "",
      date_started: "",
      date_finished: "",
      genres: book.genres || [],
      main_genre: book.mainGenre || "",
    });
    setShowForm(true);
  };

  const handleManualAdd = () => {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      image_url: "",
      date_of_pub: "",
      reading_status: "por_leer",
      rating: 0,
      review: "",
      date_started: "",
      date_finished: "",
      genres: [],
      main_genre: "",
    });
    setShowManualForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación de fechas
    if (formData.date_started && formData.date_finished) {
      const startDate = new Date(formData.date_started);
      const finishDate = new Date(formData.date_finished);

      if (startDate > finishDate) {
        alert(
          "La fecha de inicio no puede ser posterior a la fecha de finalización",
        );
        return;
      }
    }

    try {
      const dataToSend = {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        image_url: formData.image_url,
        date_of_pub: formData.date_of_pub || null,
        reading_status: formData.reading_status,
        rating: formData.rating || null,
        review: formData.review,
        date_started: formData.date_started || null,
        date_finished: formData.date_finished || null,
        genres: formData.genres || [],
        main_genre: formData.main_genre || null,
      };

      await addBookAsync(dataToSend);
      navigate("/dashboard/library");
    } catch (error) {
      console.error("Error adding book:", error);
      alert("Error al agregar el libro a la biblioteca");
    }
  };

  // Busqueda con Google Books API
  const searchGoogleBooksFunc = async (query) => {
    if (!query.trim()) {
      setGoogleBooks([]);
      return;
    }

    try {
      setSearchingGoogle(true);
      const books = await searchGoogleBooks(query, 10);
      setGoogleBooks(books);
    } catch (error) {
      console.error("Error searching Google Books:", error);
      alert("Error al buscar libros");
    } finally {
      setSearchingGoogle(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (activeSearchType === "google") {
      const timeoutId = setTimeout(() => {
        searchGoogleBooksFunc(searchTerm);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, activeSearchType]);

  // Formulario manual
  if (showManualForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowManualForm(false)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agregar libro manualmente
            </h1>
            <p className="text-gray-600">Completa la información del libro</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ISBN
                </label>
                <input
                  type="text"
                  value={formData.isbn}
                  onChange={(e) =>
                    setFormData({ ...formData, isbn: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <CustomDatePicker
                  selected={
                    formData.date_of_pub ? new Date(formData.date_of_pub) : null
                  }
                  onChange={(dateString) =>
                    setFormData({
                      ...formData,
                      date_of_pub: dateString,
                    })
                  }
                  placeholder="Selecciona fecha de publicación"
                  label="Fecha de publicación"
                  optional={false}
                  maxDate={new Date()}
                  minDate={null}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL de la imagen (portada)
              </label>
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://ejemplo.com/portada.jpg"
              />
            </div>

            <div>
              <CustomSelect
                value={formData.reading_status}
                onChange={(value) =>
                  setFormData({ ...formData, reading_status: value })
                }
                options={readingStatusOptions}
                label="Estado de lectura"
                placeholder="Selecciona el estado del libro"
              />
            </div>

            {/* Campos de Género */}
            <div>
              <CustomSelect
                value={formData.main_genre}
                onChange={(value) =>
                  setFormData({ ...formData, main_genre: value })
                }
                options={[...BOOK_GENRES].sort().map((genre) => ({
                  value: genre,
                  label: genre,
                }))}
                label="Género principal"
                placeholder="Selecciona un género"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Géneros adicionales (opcional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {[...BOOK_GENRES].sort().map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            genres: [...formData.genres, genre],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            genres: formData.genres.filter((g) => g !== genre),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{genre}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona todos los géneros que apliquen a este libro
              </p>
            </div>

            {formData.reading_status === "leido" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valoración
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`p-2 ${
                        (formData.rating || 0) >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: 0 })}
                    className="text-sm text-gray-500 ml-2"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.review}
                onChange={(e) =>
                  setFormData({ ...formData, review: e.target.value })
                }
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe tus notas sobre este libro..."
              />
            </div>

            {(formData.reading_status === "leyendo" ||
              formData.reading_status === "leido" ||
              formData.reading_status === "abandonado") && (
              <div>
                <CustomDatePicker
                  selected={
                    formData.date_started
                      ? new Date(formData.date_started)
                      : null
                  }
                  onChange={(dateString) =>
                    setFormData({
                      ...formData,
                      date_started: dateString,
                    })
                  }
                  placeholder="Selecciona fecha de inicio"
                  label="Fecha de inicio"
                  optional={true}
                  maxDate={new Date()}
                  minDate={null}
                />
              </div>
            )}

            {(formData.reading_status === "leido" ||
              formData.reading_status === "abandonado") && (
              <div>
                <CustomDatePicker
                  selected={
                    formData.date_finished
                      ? new Date(formData.date_finished)
                      : null
                  }
                  onChange={(dateString) =>
                    setFormData({
                      ...formData,
                      date_finished: dateString,
                    })
                  }
                  placeholder="Selecciona fecha de finalización"
                  label="Fecha de finalización"
                  optional={true}
                  maxDate={new Date()}
                  minDate={
                    formData.date_started
                      ? new Date(formData.date_started)
                      : null
                  }
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                disabled={isAdding}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAdding && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isAdding ? "Agregando..." : "Agregar a biblioteca"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Formulario para libro seleccionado
  if (showForm && selectedBook) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowForm(false)}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Agregar a mi biblioteca
            </h1>
            <p className="text-gray-600">
              Configura cómo quieres agregar este libro
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              {selectedBook.title}
            </h2>
            <p className="text-gray-600">por {selectedBook.author}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <CustomSelect
                value={formData.reading_status}
                onChange={(value) =>
                  setFormData({ ...formData, reading_status: value })
                }
                options={readingStatusOptions}
                label="Estado de lectura"
                placeholder="Selecciona el estado del libro"
              />
            </div>

            {/* Campos de Género */}
            <div>
              <CustomSelect
                value={formData.main_genre}
                onChange={(value) =>
                  setFormData({ ...formData, main_genre: value })
                }
                options={[
                  { value: "", label: "Selecciona un género" },
                  ...[...BOOK_GENRES].sort().map((genre) => ({
                    value: genre,
                    label: genre,
                  })),
                ]}
                label="Género principal"
                placeholder="Selecciona un género"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Géneros adicionales (opcional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {[...BOOK_GENRES].sort().map((genre) => (
                  <label
                    key={genre}
                    className="flex items-center space-x-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={formData.genres.includes(genre)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            genres: [...formData.genres, genre],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            genres: formData.genres.filter((g) => g !== genre),
                          });
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>{genre}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Selecciona todos los géneros que apliquen a este libro
              </p>
            </div>

            {formData.reading_status === "leido" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valoración
                </label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                      className={`p-2 ${
                        (formData.rating || 0) >= star
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }`}
                    >
                      ★
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: 0 })}
                    className="text-sm text-gray-500 ml-2"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas (opcional)
              </label>
              <textarea
                value={formData.review}
                onChange={(e) =>
                  setFormData({ ...formData, review: e.target.value })
                }
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escribe tus notas sobre este libro..."
              />
            </div>

            {(formData.reading_status === "leyendo" ||
              formData.reading_status === "leido" ||
              formData.reading_status === "abandonado") && (
              <div>
                <CustomDatePicker
                  selected={
                    formData.date_started
                      ? new Date(formData.date_started)
                      : null
                  }
                  onChange={(dateString) =>
                    setFormData({
                      ...formData,
                      date_started: dateString,
                    })
                  }
                  placeholder="Selecciona fecha de inicio"
                  label="Fecha de inicio"
                  optional={true}
                  maxDate={new Date()}
                  minDate={null}
                />
              </div>
            )}

            {(formData.reading_status === "leido" ||
              formData.reading_status === "abandonado") && (
              <div>
                <CustomDatePicker
                  selected={
                    formData.date_finished
                      ? new Date(formData.date_finished)
                      : null
                  }
                  onChange={(dateString) =>
                    setFormData({
                      ...formData,
                      date_finished: dateString,
                    })
                  }
                  placeholder="Selecciona fecha de finalización"
                  label="Fecha de finalización"
                  optional={true}
                  maxDate={new Date()}
                  minDate={
                    formData.date_started
                      ? new Date(formData.date_started)
                      : null
                  }
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={isAdding}
                className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isAdding}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isAdding && (
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isAdding ? "Agregando..." : "Agregar a biblioteca"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Lista principal de libros
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate("/dashboard/library")}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Agregar libro a biblioteca
          </h1>
          <p className="text-gray-600">
            Busca y selecciona un libro para agregar a tu biblioteca personal
          </p>
        </div>
      </div>
      {/* Botón para agregar manualmente */}
      <div className="flex justify-end">
        <button onClick={handleManualAdd} className="btn btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          Agregar libro manualmente
        </button>
      </div>
      {/* Tabs for search types */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveSearchType("google")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSearchType === "google"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Buscar en Google Books
            </button>
          </nav>
        </div>

        {/* Search */}
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar en Google Books..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>{" "}
      {/* Books List - Google Books only */}
      <div>
        {searchingGoogle && (
          <div className="flex items-center justify-center h-32">
            <div className="spinner border-gray-300 border-t-blue-600"></div>
            <span className="ml-2 text-gray-600">
              Buscando en Google Books...
            </span>
          </div>
        )}

        {!searchingGoogle && searchTerm && googleBooks.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron libros
            </h3>
            <p className="text-gray-600">
              Intenta con otros términos de búsqueda
            </p>
          </div>
        )}

        {!searchingGoogle && !searchTerm && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Buscar en Google Books
            </h3>
            <p className="text-gray-600">
              Escribe el título o autor del libro que quieres buscar
            </p>
          </div>
        )}

        {googleBooks.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {googleBooks.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
              >
                <div className="flex space-x-4">
                  {book.thumbnail && (
                    <img
                      src={book.thumbnail}
                      alt={book.title}
                      className="w-16 h-24 object-cover rounded"
                      onError={(e) => {
                        if (e.target instanceof HTMLImageElement) {
                          e.target.style.display = "none";
                        }
                      }}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{book.author}</p>
                    {book.isbn && (
                      <p className="text-xs text-gray-500 mb-2">
                        ISBN: {book.isbn}
                      </p>
                    )}
                    {book.date_of_pub && (
                      <p className="text-xs text-gray-500 mb-2">
                        Publicado: {book.date_of_pub}
                      </p>
                    )}
                    {book.mainGenre && (
                      <p className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block mb-2">
                        {book.mainGenre}
                      </p>
                    )}
                  </div>
                </div>

                {book.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                    {book.description.length > 150
                      ? `${book.description.substring(0, 150)}...`
                      : book.description}
                  </p>
                )}

                {book.genres && book.genres.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Géneros:</p>
                    <div className="flex flex-wrap gap-1">
                      {book.genres.slice(0, 3).map((genre, index) => (
                        <span
                          key={index}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {genre}
                        </span>
                      ))}
                      {book.genres.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{book.genres.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => handleGoogleBookSelect(book)}
                  className="w-full btn btn-primary mt-4"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar a biblioteca
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
