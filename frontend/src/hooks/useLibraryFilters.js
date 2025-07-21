import { useState, useCallback } from "react";

export const useLibraryFilters = () => {
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [quickGenreFilter, setQuickGenreFilter] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({
    author: "",
    rating: "",
    year: "",
    genre: "",
    sortBy: "updatedAt",
    sortOrder: "DESC",
  });

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setQuickGenreFilter("");
    setAdvancedFilters({
      author: "",
      rating: "",
      year: "",
      genre: "",
      sortBy: "updatedAt",
      sortOrder: "DESC",
    });
    setActiveTab("todos");
    setShowAdvancedSearch(false);
  }, []);

  const getFilterParams = useCallback(
    (includeAdvanced = false) => {
      const params = {};

      // Filtro por estado (tab activo)
      if (activeTab !== "todos") {
        params.status = activeTab;
      }

      // Filtros básicos con validación
      if (searchTerm && searchTerm.trim().length >= 2) {
        params.search = searchTerm.trim();
      }

      if (quickGenreFilter && quickGenreFilter.trim()) {
        params.genre = quickGenreFilter.trim();
      }

      // Filtros avanzados con validación (solo si se solicita explícitamente)
      if (includeAdvanced && showAdvancedSearch) {
        if (
          advancedFilters.author &&
          advancedFilters.author.trim().length >= 2
        ) {
          params.author = advancedFilters.author.trim();
        }

        if (advancedFilters.rating && !isNaN(Number(advancedFilters.rating))) {
          const rating = Number(advancedFilters.rating);
          if (rating >= 1 && rating <= 5) {
            params.rating = rating;
          }
        }

        if (advancedFilters.year && !isNaN(Number(advancedFilters.year))) {
          const year = Number(advancedFilters.year);
          if (year >= 1000 && year <= new Date().getFullYear()) {
            params.year = year;
          }
        }

        if (advancedFilters.genre && advancedFilters.genre.trim()) {
          params.genre = advancedFilters.genre.trim();
        }

        if (advancedFilters.sortBy && advancedFilters.sortBy.trim()) {
          params.sortBy = advancedFilters.sortBy;
        }

        if (
          advancedFilters.sortOrder &&
          ["ASC", "DESC"].includes(advancedFilters.sortOrder.toUpperCase())
        ) {
          params.sortOrder = advancedFilters.sortOrder;
        }
      }

      return params;
    },
    [
      activeTab,
      searchTerm,
      quickGenreFilter,
      showAdvancedSearch,
      advancedFilters,
    ],
  );

  const updateAdvancedFilter = useCallback((key, value) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const getAdvancedFilterParams = useCallback(() => {
    return getFilterParams(true);
  }, [getFilterParams]);

  return {
    // Estado
    activeTab,
    searchTerm,
    showAdvancedSearch,
    quickGenreFilter,
    advancedFilters,

    // Setters
    setActiveTab,
    setSearchTerm,
    setShowAdvancedSearch,
    setQuickGenreFilter,
    updateAdvancedFilter,

    // Utilidades
    resetFilters,
    getFilterParams,
    getAdvancedFilterParams,
  };
};
