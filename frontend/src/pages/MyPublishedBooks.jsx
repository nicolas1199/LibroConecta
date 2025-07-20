"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getPublishedBooksByUser, deletePublishedBook } from "../api/publishedBooks";
import { useAuth } from "../utils/auth.js";
import ArrowLeft from "../components/icons/ArrowLeft";
import Plus from "../components/icons/Plus";
import Edit from "../components/icons/Edit";
import Trash from "../components/icons/Trash";
import Eye from "../components/icons/Eye";
import BookOpen from "../components/icons/BookOpen";
import DollarSign from "../components/icons/DollarSign";
import Gift from "../components/icons/Gift";
import ArrowLeftRight from "../components/icons/ArrowLeftRight";

export default function MyPublishedBooks() {
  const { user } = useAuth();
  const [publishedBooks, setPublishedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingBook, setDeletingBook] = useState(null);

  useEffect(() => {
    if (user?.user_id) {
      loadPublishedBooks();
    }
  }, [user]);

  const loadPublishedBooks = async () => {
    try {
      setLoading(true);
      const response = await getPublishedBooksByUser(user.user_id);
      setPublishedBooks(response.publishedBooks || []);
    } catch (error) {
      console.error("Error loading published books:", error);
      setError("Error al cargar los libros publicados");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId, bookTitle) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar "${bookTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setDeletingBook(bookId);
      await deletePublishedBook(bookId);
      
      // Remover el libro de la lista
      setPublishedBooks(prev => prev.filter(book => book.published_book_id !== bookId));
      
      alert("Libro eliminado correctamente");
    } catch (error) {
      console.error("Error deleting book:", error);
      alert("Error al eliminar el libro");
    } finally {
      setDeletingBook(null);
    }
  };

  const getTransactionIcon = (transactionType) => {
    switch (transactionType?.description) {
      case "Venta":
        return <DollarSign className="h-4 w-4 text-green-600" />;
      case "Regalo":
        return <Gift className="h-4 w-4 text-blue-600" />;
      case "Intercambio":
        return <ArrowLeftRight className="h-4 w-4 text-purple-600" />;
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionBadge = (transactionType) => {
    switch (transactionType?.description) {
      case "Venta":
        return "bg-green-100 text-green-800";
      case "Regalo":
        return "bg-blue-100 text-blue-800";
      case "Intercambio":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner border-gray-300 border-t-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Error al cargar libros
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadPublishedBooks} 
            className="btn btn-primary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Libros Publicados</h1>
              <p className="text-gray-600">
                Gestiona los libros que has publicado para intercambio, regalo o venta
              </p>
            </div>

            <Link
              to="/dashboard/publish"
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Publicar Nuevo Libro</span>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Publicados</p>
                <p className="text-2xl font-bold text-gray-900">{publishedBooks.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En Venta</p>
                <p className="text-2xl font-bold text-green-600">
                  {publishedBooks.filter(book => book.TransactionType?.description === "Venta").length}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Para Intercambio</p>
                <p className="text-2xl font-bold text-purple-600">
                  {publishedBooks.filter(book => book.TransactionType?.description === "Intercambio").length}
                </p>
              </div>
              <ArrowLeftRight className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Para Regalar</p>
                <p className="text-2xl font-bold text-blue-600">
                  {publishedBooks.filter(book => book.TransactionType?.description === "Regalo").length}
                </p>
              </div>
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Books List */}
        <div className="space-y-4">
          {publishedBooks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes libros publicados
              </h3>
              <p className="text-gray-600 mb-6">
                ¡Publica tu primer libro para empezar a conectar con otros lectores!
              </p>
              <Link to="/dashboard/publish" className="btn btn-primary">
                Publicar Mi Primer Libro
              </Link>
            </div>
          ) : (
            publishedBooks.map((book) => (
              <div
                key={book.published_book_id}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  {/* Book Image */}
                  <div className="w-24 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {book.PublishedBookImages && book.PublishedBookImages.length > 0 ? (
                      <img
                        src={book.PublishedBookImages[0].image_url || book.PublishedBookImages[0].src}
                        alt={book.Book?.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {book.Book?.title}
                        </h3>
                        <p className="text-gray-600 mb-2">
                          por {book.Book?.author}
                        </p>
                      </div>
                      
                      {/* Transaction Type Badge */}
                      <div className="flex items-center space-x-2">
                        {getTransactionIcon(book.TransactionType)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionBadge(book.TransactionType)}`}>
                          {book.TransactionType?.description}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    {book.price && (
                      <p className="text-lg font-bold text-green-600 mb-2">
                        ${Number(book.price).toLocaleString()}
                      </p>
                    )}

                    {/* Description */}
                    <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                      {book.description || "Sin descripción"}
                    </p>

                    {/* Status and Location */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span>Estado: {book.BookCondition?.condition}</span>
                      {book.LocationBook && (
                        <span>
                          📍 {book.LocationBook.comuna}, {book.LocationBook.region}
                        </span>
                      )}
                      <span>
                        Publicado: {new Date(book.date_published).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <Link
                        to={`/book/${book.published_book_id}`}
                        className="btn btn-secondary btn-sm flex items-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Ver</span>
                      </Link>
                      
                      <Link
                        to={`/dashboard/publish/edit/${book.published_book_id}`}
                        className="btn btn-primary btn-sm flex items-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Editar</span>
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteBook(book.published_book_id, book.Book?.title)}
                        disabled={deletingBook === book.published_book_id}
                        className="btn btn-danger btn-sm flex items-center space-x-2"
                      >
                        <Trash className="h-4 w-4" />
                        <span>
                          {deletingBook === book.published_book_id ? "Eliminando..." : "Eliminar"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 