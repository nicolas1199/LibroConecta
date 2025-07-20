import { memo } from "react";
import Search from "../icons/Search";
import Filter from "../icons/Filter";
import X from "../icons/X";
import CustomSelect from "../CustomSelect";
import SearchableSelect from "../SearchableSelect";
import { BOOK_GENRES } from "../../utils/constants";

const LibraryFilters = memo(
  ({
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    showAdvancedSearch,
    setShowAdvancedSearch,
    quickGenreFilter,
    setQuickGenreFilter,
    advancedFilters,
    updateAdvancedFilter,
    resetFilters,
    onSearch,
    globalStats,
  }) => {
    const tabs = [
      { id: "todos", label: "Todos", count: globalStats?.total || 0 },
      { id: "por_leer", label: "Por leer", count: globalStats?.toRead || 0 },
      { id: "leyendo", label: "Leyendo", count: globalStats?.reading || 0 },
      { id: "leido", label: "Leídos", count: globalStats?.read || 0 },
      {
        id: "abandonado",
        label: "Abandonados",
        count: globalStats?.abandoned || 0,
      },
    ];

    const sortOptions = [
      { value: "updatedAt", label: "Última actualización" },
      { value: "createdAt", label: "Fecha agregado" },
      { value: "title", label: "Título" },
      { value: "author", label: "Autor" },
      { value: "rating", label: "Valoración" },
    ];

    const orderOptions = [
      { value: "DESC", label: "Descendente" },
      { value: "ASC", label: "Ascendente" },
    ];

    const ratingOptions = [
      { value: "", label: "Todas las valoraciones" },
      { value: "5", label: "5 estrellas" },
      { value: "4", label: "4+ estrellas" },
      { value: "3", label: "3+ estrellas" },
      { value: "2", label: "2+ estrellas" },
      { value: "1", label: "1+ estrellas" },
    ];

    const handleSearchChange = (e) => {
      const value = e.target.value;
      setSearchTerm(value);

      // Debounced search
      const timeoutId = setTimeout(() => {
        onSearch(value);
      }, 500);

      // Cleanup function
      return () => clearTimeout(timeoutId);
    };

    return (
      <div className="space-y-4">
        {/* Tabs de estado */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por título, autor..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtro rápido por género */}
          <div className="w-full lg:w-48">
            <SearchableSelect
              value={quickGenreFilter}
              onChange={setQuickGenreFilter}
              options={[
                { value: "", label: "Todos los géneros" },
                ...[...BOOK_GENRES].sort().map((genre) => ({
                  value: genre,
                  label: genre,
                })),
              ]}
              placeholder="Género"
              searchPlaceholder="Buscar género..."
            />
          </div>

          {/* Botón de filtros avanzados */}
          <button
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors ${
              showAdvancedSearch
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {showAdvancedSearch && <X className="w-4 h-4 ml-2" />}
          </button>

          {/* Botón reset */}
          {(searchTerm || quickGenreFilter || showAdvancedSearch) && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Filtros avanzados */}
        {showAdvancedSearch && (
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Autor
                </label>
                <input
                  type="text"
                  value={advancedFilters.author}
                  onChange={(e) =>
                    updateAdvancedFilter("author", e.target.value)
                  }
                  placeholder="Buscar por autor"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <CustomSelect
                  value={advancedFilters.rating}
                  onChange={(value) => updateAdvancedFilter("rating", value)}
                  options={ratingOptions}
                  label="Valoración"
                  placeholder="Seleccionar valoración"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Año de publicación
                </label>
                <input
                  type="number"
                  value={advancedFilters.year}
                  onChange={(e) => updateAdvancedFilter("year", e.target.value)}
                  placeholder="Ej: 2023"
                  min="1000"
                  max={new Date().getFullYear()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <SearchableSelect
                  value={advancedFilters.genre}
                  onChange={(value) => updateAdvancedFilter("genre", value)}
                  options={[
                    { value: "", label: "Todos los géneros" },
                    ...[...BOOK_GENRES].sort().map((genre) => ({
                      value: genre,
                      label: genre,
                    })),
                  ]}
                  label="Género específico"
                  placeholder="Seleccionar género"
                  searchPlaceholder="Buscar género..."
                />
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CustomSelect
                  value={advancedFilters.sortBy}
                  onChange={(value) => updateAdvancedFilter("sortBy", value)}
                  options={sortOptions}
                  label="Ordenar por"
                  placeholder="Seleccionar campo"
                />

                <CustomSelect
                  value={advancedFilters.sortOrder}
                  onChange={(value) => updateAdvancedFilter("sortOrder", value)}
                  options={orderOptions}
                  label="Orden"
                  placeholder="Seleccionar orden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  },
);

LibraryFilters.displayName = "LibraryFilters";

export default LibraryFilters;
