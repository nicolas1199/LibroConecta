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

  const getFilterParams = useCallback(() => {
    const params = {};

    // Filtro por estado (tab activo)
    if (activeTab !== "todos") {
      params.status = activeTab;
    }

    // Filtros básicos
    if (searchTerm) params.search = searchTerm;
    if (quickGenreFilter) params.genre = quickGenreFilter;

    // Filtros avanzados
    if (showAdvancedSearch) {
      if (advancedFilters.author) params.author = advancedFilters.author;
      if (advancedFilters.rating) params.rating = advancedFilters.rating;
      if (advancedFilters.year) params.year = advancedFilters.year;
      if (advancedFilters.genre) params.genre = advancedFilters.genre;
      if (advancedFilters.sortBy) params.sortBy = advancedFilters.sortBy;
      if (advancedFilters.sortOrder)
        params.sortOrder = advancedFilters.sortOrder;
    }

    return params;
  }, [
    activeTab,
    searchTerm,
    quickGenreFilter,
    showAdvancedSearch,
    advancedFilters,
  ]);

  const updateAdvancedFilter = useCallback((key, value) => {
    setAdvancedFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

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
  };
};
