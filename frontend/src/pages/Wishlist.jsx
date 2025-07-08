import { useState, useEffect } from "react";
import { List, Search, Plus, BookOpen, X } from "../components/icons";

export default function Wishlist() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ title: "", author: "", notes: "" });

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API call para obtener wishlist
      // const response = await api.get('/api/wishlist');
      // setWishlist(response.data);
      
      // Datos de ejemplo mientras se implementa la API
      setWishlist([]);
    } catch (error) {
      console.error("Error al cargar lista de deseos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;

    try {
      // TODO: Implementar API call para agregar item
      // await api.post('/api/wishlist', newItem);
      
      // Agregar localmente mientras se implementa la API
      const item = {
        id: Date.now(),
        ...newItem,
        created_at: new Date().toISOString(),
        found: false
      };
      
      setWishlist([...wishlist, item]);
      setNewItem({ title: "", author: "", notes: "" });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error al agregar item:", error);
    }
  };

  const handleRemoveItem = async (id) => {
    try {
      // TODO: Implementar API call para eliminar item
      // await api.delete(`/api/wishlist/${id}`);
      
      setWishlist(wishlist.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error al eliminar item:", error);
    }
  };

  const filteredWishlist = wishlist.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">Lista de Deseos</h1>
          <p className="text-gray-600">Libros que te gustaría conseguir</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Agregar Libro</span>
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Agregar libro a la lista</h3>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newItem.title}
                onChange={(e) => setNewItem({...newItem, title: e.target.value})}
                placeholder="Nombre del libro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Autor
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={newItem.author}
                onChange={(e) => setNewItem({...newItem, author: e.target.value})}
                placeholder="Autor del libro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                value={newItem.notes}
                onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                placeholder="Notas adicionales (opcional)"
              />
            </div>
            <div className="flex space-x-3">
              <button type="submit" className="btn btn-primary">
                Agregar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar en lista de deseos..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      {filteredWishlist.length === 0 ? (
        <div className="text-center py-12">
          <List className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No se encontraron resultados" : "Tu lista de deseos está vacía"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? "Intenta cambiar tu búsqueda" 
              : "Comienza agregando libros que te gustaría conseguir"}
          </p>
          {!searchTerm && (
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Primer Libro
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredWishlist.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{item.title}</h3>
                  {item.author && (
                    <p className="text-gray-600 mt-1">por {item.author}</p>
                  )}
                  {item.notes && (
                    <p className="text-gray-500 text-sm mt-2">{item.notes}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Agregado el {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 