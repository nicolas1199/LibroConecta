import { useState, useEffect } from "react";
import Heart from "../components/icons/Heart";
import Search from "../components/icons/Search";
import Filter from "../components/icons/Filter";
import BookOpen from "../components/icons/BookOpen";
import BookCard from "../components/BookCard";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API call para obtener favoritos
      // const response = await api.get('/api/favorites');
      // setFavorites(response.data);
      
      // Datos de ejemplo mientras se implementa la API
      setFavorites([]);
    } catch (error) {
      console.error("Error al cargar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = favorites.filter(book => {
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
          <h1 className="text-2xl font-bold text-gray-900">Mis Favoritos</h1>
          <p className="text-gray-600">Libros que has marcado como favoritos</p>
        </div>
        <div className="text-sm text-gray-500">
          {favorites.length} {favorites.length === 1 ? 'libro' : 'libros'}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar en favoritos..."
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
          <option value="exchange">Intercambio</option>
          <option value="sale">Venta</option>
        </select>
      </div>

      {/* Content */}
      {filteredFavorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filter !== "all" ? "No se encontraron resultados" : "Aún no tienes favoritos"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || filter !== "all" 
              ? "Intenta cambiar tu búsqueda o filtro" 
              : "Explora libros y marca tus favoritos usando el ícono de corazón"}
          </p>
          {!searchTerm && filter === "all" && (
            <button className="btn btn-primary">
              <BookOpen className="h-4 w-4 mr-2" />
              Explorar Libros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFavorites.map(book => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
} 