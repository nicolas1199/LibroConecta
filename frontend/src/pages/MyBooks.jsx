import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import BookOpen from "../components/icons/BookOpen";
import Search from "../components/icons/Search";
import Filter from "../components/icons/Filter";
import Plus from "../components/icons/Plus";
import Edit from "../components/icons/Edit";
import Trash from "../components/icons/Trash";

export default function MyBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMyBooks();
  }, []);

  const fetchMyBooks = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API call para obtener mis libros publicados
      // const response = await api.get('/api/my-published-books');
      // setBooks(response.data);
      
      // Datos de ejemplo mientras se implementa la API
      setBooks([]);
    } catch (error) {
      console.error("Error al cargar mis libros:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta publicación?")) return;
    
    try {
      // TODO: Implementar API call para eliminar libro
      // await api.delete(`/api/published-books/${bookId}`);
      setBooks(books.filter(book => book.id !== bookId));
    } catch (error) {
      console.error("Error al eliminar libro:", error);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || book.transaction_type === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis Libros Publicados</h1>
          <p className="text-gray-600">Gestiona los libros que has publicado para intercambio o venta</p>
        </div>
        <Link to="/dashboard/publish" className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Publicar Libro</span>
        </Link>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en mis libros..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          <option value="sale">En venta</option>
          <option value="exchange">Para intercambio</option>
          <option value="gift">Para regalo</option>
        </select>
      </div>

      {/* Books Grid */}
      {filteredBooks.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== "all" ? "No se encontraron libros" : "No has publicado libros aún"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filter !== "all" 
              ? "Intenta cambiar tu búsqueda o filtro" 
              : "Publica tu primer libro para que otros usuarios puedan encontrarlo"}
          </p>
          {!searchTerm && filter === "all" && (
            <Link to="/dashboard/publish" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Publicar Mi Primer Libro
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBooks.map(book => (
            <div key={book.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
              {/* Book Image */}
              {book.image_url && (
                <div className="aspect-[3/4] w-full mb-4">
                  <img
                    src={book.image_url}
                    alt={book.title}
                    className="w-full h-full object-cover rounded-t-lg"
                  />
                </div>
              )}
              
              {/* Book Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{book.title}</h3>
                <p className="text-gray-600 text-sm mb-2">por {book.author}</p>
                
                {/* Transaction Info */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    book.transaction_type === 'sale' ? 'bg-green-100 text-green-800' :
                    book.transaction_type === 'exchange' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {book.transaction_type === 'sale' ? `$${book.price}` :
                     book.transaction_type === 'exchange' ? 'Intercambio' :
                     'Regalo'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    book.status === 'available' ? 'bg-green-100 text-green-800' :
                    book.status === 'reserved' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {book.status === 'available' ? 'Disponible' :
                     book.status === 'reserved' ? 'Reservado' :
                     'No disponible'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/dashboard/publish?edit=${book.id}`}
                    className="flex-1 btn btn-secondary text-center text-sm py-2"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Link>
                  <button
                    onClick={() => handleDeleteBook(book.id)}
                    className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash className="h-3 w-3" />
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-3 text-xs text-gray-500 flex justify-between">
                  <span>{book.views || 0} visualizaciones</span>
                  <span>{book.interested || 0} interesados</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 