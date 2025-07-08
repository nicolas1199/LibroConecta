import { useState, useEffect } from "react";
import FileText from "../components/icons/FileText";
import Search from "../components/icons/Search";
import Edit from "../components/icons/Edit";
import Trash from "../components/icons/Trash";
import Plus from "../components/icons/Plus";
import Clock from "../components/icons/Clock";
import { Link } from "react-router-dom";

export default function Drafts() {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      // TODO: Implementar API call para obtener borradores
      // const response = await api.get('/api/drafts');
      // setDrafts(response.data);
      
      // Datos de ejemplo mientras se implementa la API
      setDrafts([]);
    } catch (error) {
      console.error("Error al cargar borradores:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDraft = async (id) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este borrador?")) return;

    try {
      // TODO: Implementar API call para eliminar borrador
      // await api.delete(`/api/drafts/${id}`);
      
      setDrafts(drafts.filter(draft => draft.id !== id));
    } catch (error) {
      console.error("Error al eliminar borrador:", error);
    }
  };

  const filteredDrafts = drafts.filter(draft => 
    draft.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.author?.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-2xl font-bold text-gray-900">Borradores</h1>
          <p className="text-gray-600">Libros que has empezado a publicar pero no has terminado</p>
        </div>
        <Link to="/dashboard/publish" className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Nuevo Borrador</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar borradores..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      {filteredDrafts.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No se encontraron borradores" : "No tienes borradores guardados"}
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm 
              ? "Intenta cambiar tu búsqueda" 
              : "Los borradores te permiten guardar publicaciones incompletas para terminarlas más tarde"}
          </p>
          {!searchTerm && (
            <Link to="/dashboard/publish" className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Borrador
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDrafts.map(draft => (
            <div key={draft.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{draft.title}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                      Borrador
                    </span>
                  </div>
                  
                  {draft.author && (
                    <p className="text-gray-600 mb-2">por {draft.author}</p>
                  )}
                  
                  {draft.description && (
                    <p className="text-gray-500 text-sm mb-3 line-clamp-2">{draft.description}</p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Guardado el {new Date(draft.updated_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                      {draft.completion_percentage || 0}% completo
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <Link
                    to={`/dashboard/publish?draft=${draft.id}`}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar borrador"
                  >
                    <Edit className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar borrador"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-gray-500">Progreso</span>
                  <span className="text-xs text-gray-500">{draft.completion_percentage || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${draft.completion_percentage || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 