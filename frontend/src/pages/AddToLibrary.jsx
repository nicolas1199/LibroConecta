"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addToLibrary } from "../api/userLibrary";
import BookOpen from "../components/icons/BookOpen";
import Search from "../components/icons/Search";
import Plus from "../components/icons/Plus";
import ArrowLeft from "../components/icons/ArrowLeft";

export default function AddToLibrary() {
  const navigate = useNavigate();
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
  });

  useEffect(() => {
    if (activeSearchType === "google") {
      const timeoutId = setTimeout(() => {
        searchGoogleBooks(searchTerm);
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
      image_url: book.image_url || "",
      date_of_pub: book.date_of_pub || "",
      reading_status: "por_leer",
      rating: 0,
      review: "",
      date_started: "",
      date_finished: "",
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
    });
    setShowManualForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      };

      await addToLibrary(dataToSend);
      navigate("/dashboard/library");
    } catch (error) {
      console.error("Error adding book:", error);
      alert("Error al agregar el libro a la biblioteca");
    }
  };

  // Busqueda con Google Books API
  const searchGoogleBooks = async (query) => {
    if (!query.trim()) {
      setGoogleBooks([]);
      return;
    }

    try {
      setSearchingGoogle(true);

      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=es&printType=books`,
      );
      const data = await response.json();

      if (!data.items) {
        setGoogleBooks([]);
        return;
      }

      const books = data.items.map((item) => {
        const bookInfo = item.volumeInfo;

        // Mejor manejo de ISBN
        let isbn = null;
        if (bookInfo.industryIdentifiers) {
          const isbn13 = bookInfo.industryIdentifiers.find(
            (id) => id.type === "ISBN_13",
          );
          const isbn10 = bookInfo.industryIdentifiers.find(
            (id) => id.type === "ISBN_10",
          );
          isbn = isbn13?.identifier || isbn10?.identifier || null;
        }

        // Mejor manejo de imagen
        let imageUrl = null;
        if (bookInfo.imageLinks) {
          imageUrl =
            bookInfo.imageLinks.thumbnail ||
            bookInfo.imageLinks.smallThumbnail ||
            null;
          if (imageUrl) {
            imageUrl = imageUrl.replace("http://", "https://");
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
          date_of_pub: bookInfo.publishedDate || null,
          publisher: bookInfo.publisher || null,
          description: bookInfo.description || null,
          language: bookInfo.language || "es",
        };
      });

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
        searchGoogleBooks(searchTerm);
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de publicación
                </label>
                <input
                  type="date"
                  value={formData.date_of_pub}
                  onChange={(e) =>
                    setFormData({ ...formData, date_of_pub: e.target.value })
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de lectura
              </label>
              <select
                value={formData.reading_status}
                onChange={(e) =>
                  setFormData({ ...formData, reading_status: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="por_leer">Quiero leer</option>
                <option value="leyendo">Leyendo</option>
                <option value="leido">Leído</option>
                <option value="abandonado">Abandonado</option>
              </select>
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Agregar a biblioteca
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de lectura
              </label>
              <select
                value={formData.reading_status}
                onChange={(e) =>
                  setFormData({ ...formData, reading_status: e.target.value })
                }
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="por_leer">Quiero leer</option>
                <option value="leyendo">Leyendo</option>
                <option value="leido">Leído</option>
                <option value="abandonado">Abandonado</option>
              </select>
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

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Agregar a biblioteca
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
                  {book.image_url && (
                    <img
                      src={book.image_url}
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
                  </div>
                </div>

                {book.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-3">
                    {book.description.length > 150
                      ? `${book.description.substring(0, 150)}...`
                      : book.description}
                  </p>
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
