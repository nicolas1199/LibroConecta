"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"

export const useSearch = (initialFilters = {}) => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    search: searchParams.get("search") || initialFilters.search || "",
  }))

  // Sincronizar con URL
  useEffect(() => {
    const searchFromUrl = searchParams.get("search") || ""
    if (searchFromUrl !== filters.search) {
      setFilters((prev) => ({
        ...prev,
        search: searchFromUrl,
      }))
    }
  }, [searchParams])

  const updateFilter = useCallback(
    (key, value) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }))

      // Actualizar URL para búsqueda
      if (key === "search") {
        const newSearchParams = new URLSearchParams(searchParams)
        if (value && value.trim()) {
          newSearchParams.set("search", value.trim())
        } else {
          newSearchParams.delete("search")
        }
        setSearchParams(newSearchParams)
      }
    },
    [searchParams, setSearchParams],
  )

  const clearFilters = useCallback(() => {
    const clearedFilters = Object.keys(initialFilters).reduce((acc, key) => {
      acc[key] = initialFilters[key] || ""
      return acc
    }, {})

    setFilters(clearedFilters)
    setSearchParams({})
  }, [initialFilters, setSearchParams])

  return {
    filters,
    updateFilter,
    clearFilters,
    setFilters,
  }
}
